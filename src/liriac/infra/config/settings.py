"""Configuration settings for the Liriac application."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Literal, TypeAlias

from pydantic import BaseModel, Field, field_validator, model_validator

ConfigDict: TypeAlias = dict[str, Any]


class AppSettings(BaseModel):
    """Application settings with type validation and defaults."""

    library_path: Path = Field(default_factory=Path.cwd)
    ai_provider: Literal["openai"] | None = "openai"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4"
    openai_base_url: str | None = None
    openai_max_tokens: int = Field(default=512, gt=0)
    openai_request_timeout: int = Field(default=120, gt=0)

    @field_validator("library_path", mode="before")
    @classmethod
    def resolve_library_path(cls, value: str | Path | None) -> Path:
        """Resolve library path to an absolute path."""
        if isinstance(value, str):
            value = Path(value)
        elif value is None:
            value = Path.cwd()
        return value.resolve()

    @model_validator(mode="after")
    def validate_settings(self) -> AppSettings:
        """Additional validation for settings consistency."""
        # If API key is not provided, warn but don't fail
        if self.ai_provider == "openai" and not self.openai_api_key:
            # Note: This is expected in testing scenarios
            pass

        return self


def get_default_config_path() -> Path:
    """Get the default configuration file path."""
    # Use XDG_CONFIG_HOME if set, otherwise ~/.config
    if xdg_config := os.environ.get("XDG_CONFIG_HOME"):
        config_dir = Path(xdg_config) / "liriac"
    else:
        config_dir = Path.home() / ".config" / "liriac"

    return config_dir / "config.toml"


def read_config_file(path: Path | None = None) -> ConfigDict:
    """Read configuration from TOML file.

    Args:
        path: Path to config file. If None, uses default path.

    Returns:
        Dictionary with configuration values. Empty if file doesn't exist.

    Raises:
        ValueError: If TOML is invalid.
    """
    if path is None:
        path = get_default_config_path()

    if not path.exists():
        return {}

    try:
        import tomllib

        with path.open("rb") as f:
            return tomllib.load(f)
    except (ImportError, FileNotFoundError):
        # If tomllib not available or file not found, return empty
        return {}
    except Exception as e:
        raise ValueError(f"Invalid TOML in {path}: {e}") from None


def _get_env_mapping() -> dict[str, str]:
    """Get environment variable to setting key mapping."""
    return {
        "LIRIAC_LIBRARY_DIR": "library_path",
        "LIRIAC_AI_PROVIDER": "ai_provider",
        "OPENAI_API_KEY": "openai_api_key",
        "OPENAI_MODEL": "openai_model",
        "OPENAI_BASE_URL": "openai_base_url",
        "OPENAI_MAX_TOKENS": "openai_max_tokens",
        "OPENAI_REQUEST_TIMEOUT": "openai_request_timeout",
    }


def _load_from_environment() -> ConfigDict:
    """Load configuration from environment variables."""
    env_mapping = _get_env_mapping()
    config: ConfigDict = {}

    for env_var, setting_key in env_mapping.items():
        if value := os.environ.get(env_var):
            # Convert to appropriate type for int fields
            if setting_key in ("openai_max_tokens", "openai_request_timeout"):
                try:
                    config[setting_key] = int(value)
                except ValueError:
                    # Let pydantic handle the validation error
                    config[setting_key] = value
            else:
                config[setting_key] = value

    return config


def _merge_configs(*configs: ConfigDict) -> ConfigDict:
    """Merge configuration dictionaries, later ones override earlier ones."""
    result: ConfigDict = {}
    for config in configs:
        result.update(config)
    return result


def load_settings(cli_overrides: ConfigDict | None = None) -> AppSettings:
    """Load application settings with proper precedence.

    Precedence order:
    1. CLI overrides (highest)
    2. Environment variables
    3. Configuration file
    4. Default values (lowest)

    Args:
        cli_overrides: Optional dictionary of CLI-provided overrides.

    Returns:
        Validated AppSettings instance.
    """
    # Load configurations in reverse precedence order
    file_config = read_config_file()
    env_config = _load_from_environment()

    # Merge with proper precedence
    merged_config = _merge_configs(file_config, env_config)

    if cli_overrides:
        merged_config.update(cli_overrides)

    # Create and validate settings
    return AppSettings(**merged_config)
