"""Structured JSON logging adapter for liriac.

Provides JSON-formatted logging to stderr with redaction capabilities.
"""

import json
import logging
import sys
from collections.abc import Mapping
from datetime import UTC, datetime
from logging import LogRecord
from typing import Any, TypeAlias

__all__ = ["get_json_logger", "redact_value", "redact_keys"]

# Type aliases for better readability
JsonObject: TypeAlias = dict[str, Any]
LogLevel: TypeAlias = str | int


def redact_value(value: str) -> str:
    """Mask the middle of secret-like values.

    Args:
        value: String value that might contain a secret

    Returns:
        Redacted string with middle portion masked

    Examples:
        >>> redact_value("sk-1234567890abcdef")
        'sk-****cdef'
        >>> redact_value("short")
        '****'
    """

    if len(value) <= 4:
        return "*" * len(value)

    # Show first 3 and last 4 characters, mask middle with 4 asterisks
    start = value[:3]
    end = value[-4:]
    return f"{start}****{end}"


def redact_keys(data: Mapping[str, Any]) -> dict[str, Any]:
    """Mask values for keys that might contain secrets.

    Args:
        data: Dictionary with potential secret keys

    Returns:
        Dictionary with secret values redacted
    """

    result = {}
    secret_key_patterns = {"key", "token", "secret", "password", "authorization"}

    for key, value in data.items():
        key_lower = key.lower()
        if any(pattern in key_lower for pattern in secret_key_patterns):
            result[key] = redact_value(str(value))
        else:
            result[key] = value

    return result


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: LogRecord) -> str:
        """Format a log record as JSON.

        Args:
            record: The log record to format

        Returns:
            JSON string representation of the log record
        """
        # Create base log entry
        entry: JsonObject = {
            "time": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno,
            "pid": record.process,
            "thread": record.thread,
        }

        # Add context if present (under 'ctx' key)
        if hasattr(record, "ctx") and record.ctx:
            if isinstance(record.ctx, Mapping):
                entry["ctx"] = redact_keys(record.ctx)
            else:
                entry["ctx"] = {"value": str(record.ctx)}

        # Add exception info if present
        if record.exc_info:
            exc_type, exc_value, exc_traceback = record.exc_info
            entry["exc_type"] = exc_type.__name__ if exc_type else None
            entry["exc_message"] = str(exc_value) if exc_value else None
            entry["exc_traceback"] = self.formatException(record.exc_info)

        return json.dumps(entry, ensure_ascii=False)


# Global registry to prevent duplicate handlers
_configured_loggers: set[str] = set()


def get_json_logger(
    name: str | None = None, level: LogLevel = "INFO"
) -> logging.Logger:
    """Get a logger with JSON formatter.

    Args:
        name: Logger name (uses root logger if None)
        level: Logging level as string ("DEBUG", "INFO", etc.) or int

    Returns:
        Configured logger instance

    Note:
        Multiple calls with the same name will return the same logger
        without adding duplicate handlers.
    """
    logger = logging.getLogger(name)

    # Convert string level to int if needed
    if isinstance(level, str):
        level = getattr(logging, level.upper(), logging.INFO)

    logger.setLevel(level)

    # Check if we already have a working JSON handler
    has_json_handler = False
    for handler in logger.handlers[:]:
        if isinstance(handler, logging.StreamHandler) and isinstance(
            handler.formatter, JSONFormatter
        ):
            has_json_handler = True
            break
        else:
            # Remove non-JSON handlers
            logger.removeHandler(handler)

    # Add JSON handler if needed
    if not has_json_handler:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    # Prevent propagation to avoid duplicate logs
    logger.propagate = False

    return logger
