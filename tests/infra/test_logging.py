"""Tests for structured JSON logging adapter."""

import json
from collections.abc import Generator
from datetime import datetime

import pytest

from liriac.infra.logging import get_json_logger, redact_keys, redact_value


@pytest.fixture(autouse=True)
def cleanup_loggers() -> Generator[None, None, None]:
    """Clean up loggers between tests."""
    # Import and clear the configured loggers set
    from liriac.infra.logging import _configured_loggers

    # Save original state
    original_loggers = set(_configured_loggers)

    # Clear configured loggers
    _configured_loggers.clear()

    yield

    # Restore original state
    _configured_loggers.clear()
    _configured_loggers.update(original_loggers)


class TestRedactValue:
    """Test secret value redaction."""

    def test_redact_short_values(self) -> None:
        """Test redaction of short values."""
        assert redact_value("abc") == "***"
        assert redact_value("abcd") == "****"
        assert redact_value("") == ""

    def test_redact_long_values(self) -> None:
        """Test redaction of longer values."""
        assert redact_value("sk-1234567890abcdef") == "sk-****cdef"
        assert redact_value("very-long-secret-key-here") == "ver****here"

    def test_redact_short_string_values(self) -> None:
        """Test redaction of short string values."""
        assert redact_value("123") == "***"


class TestRedactKeys:
    """Test secret key redaction."""

    def test_redact_secret_keys(self) -> None:
        """Test redaction of secret-like keys."""
        data = {
            "api_key": "secret123",
            "auth_token": "token456",
            "password": "pass789",
            "public": "safe_value",
            "Authorization": "bearer123",
        }

        result = redact_keys(data)
        assert result["api_key"] != "secret123"
        assert result["auth_token"] != "token456"
        assert result["password"] != "pass789"
        assert result["public"] == "safe_value"
        assert result["Authorization"] != "bearer123"

    def test_redact_keys_empty(self) -> None:
        """Test redaction of empty dict."""
        assert redact_keys({}) == {}

    def test_redact_keys_non_mapping(self) -> None:
        """Test redaction of non-mapping input."""
        assert redact_keys({"not": "a dict"}) == {"not": "a dict"}


class TestJsonLogger:
    """Test JSON logger functionality."""

    def test_basic_logging(self, capsys: pytest.CaptureFixture[str]) -> None:
        """Test basic JSON log output."""
        logger = get_json_logger("test_basic", "INFO")
        logger.info("Test message")

        captured = capsys.readouterr()
        log_line = captured.err.strip()
        log_data = json.loads(log_line)

        assert log_data["level"] == "INFO"
        assert log_data["logger"] == "test_basic"
        assert log_data["message"] == "Test message"
        assert "time" in log_data
        assert "module" in log_data
        assert "func" in log_data
        assert "line" in log_data
        assert "pid" in log_data
        assert "thread" in log_data

        # Verify timestamp format
        timestamp = log_data["time"]
        # Normalize Z to +00:00 for parsing
        if timestamp.endswith("Z"):
            timestamp = timestamp[:-1] + "+00:00"
        datetime.fromisoformat(timestamp)

    def test_logging_with_context(self, capsys: pytest.CaptureFixture[str]) -> None:
        """Test logging with extra context."""
        logger = get_json_logger("test_context", "INFO")
        logger.info("Test message", extra={"ctx": {"book": "demo", "chapter": 1}})

        captured = capsys.readouterr()
        log_line = captured.err.strip()
        log_data = json.loads(log_line)

        assert "ctx" in log_data
        assert log_data["ctx"]["book"] == "demo"
        assert log_data["ctx"]["chapter"] == 1

    def test_exception_logging(self, capsys: pytest.CaptureFixture[str]) -> None:
        """Test logging with exception info."""
        logger = get_json_logger("test_exception", "INFO")

        try:
            raise ValueError("Test exception")
        except ValueError:
            logger.exception("Error occurred")

        captured = capsys.readouterr()
        log_line = captured.err.strip()
        log_data = json.loads(log_line)

        assert log_data["exc_type"] == "ValueError"
        assert log_data["exc_message"] == "Test exception"
        assert "exc_traceback" in log_data
        assert len(log_data["exc_traceback"]) > 0

    def test_no_duplicate_handlers(self, capsys: pytest.CaptureFixture[str]) -> None:
        """Test that multiple calls don't create duplicate handlers."""
        logger1 = get_json_logger("test_duplicate", "INFO")
        logger2 = get_json_logger("test_duplicate", "INFO")

        logger1.info("Message 1")
        logger2.info("Message 2")

        captured = capsys.readouterr()
        log_lines = captured.err.strip().split("\n")

        # Should only have 2 lines, not 4 (no duplicate handlers)
        assert len(log_lines) == 2
        assert json.loads(log_lines[0])["message"] == "Message 1"
        assert json.loads(log_lines[1])["message"] == "Message 2"

    def test_string_level_conversion(self, capsys: pytest.CaptureFixture[str]) -> None:
        """Test string level conversion."""
        logger = get_json_logger("test_level", "DEBUG")
        logger.debug("Debug message")

        captured = capsys.readouterr()
        log_line = captured.err.strip()
        log_data = json.loads(log_line)

        assert log_data["level"] == "DEBUG"
        assert log_data["message"] == "Debug message"
