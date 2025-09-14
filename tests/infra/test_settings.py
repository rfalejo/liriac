"""Tests for configuration settings loading."""

from __future__ import annotations

from pathlib import Path

import pytest

from liriac.infra.config.settings import (
    AppSettings,
    get_default_config_path,
    load_settings,
    read_config_file,
)


@pytest.fixture
def temp_config_dir(tmp_path: Path) -> Path:
    """Create a temporary config directory."""
    return tmp_path / ".config" / "liriac"


@pytest.fixture
def xdg_config_dir(tmp_path: Path) -> Path:
    """Create a temporary XDG_CONFIG_HOME directory."""
    return tmp_path / "xdg_config"


class TestDefaultConfigPath:
    """Test default configuration path discovery."""

    def test_default_config_path_home(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """Test default path is ~/.config/liriac/config.toml."""
        monkeypatch.setattr("pathlib.Path.home", lambda: tmp_path)

        expected = tmp_path / ".config" / "liriac" / "config.toml"
        assert get_default_config_path() == expected

    def test_default_config_path_xdg(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """Test XDG_CONFIG_HOME path takes precedence."""
        xdg_dir = tmp_path / "xdg_config"
        monkeypatch.setenv("XDG_CONFIG_HOME", str(xdg_dir))

        expected = xdg_dir / "liriac" / "config.toml"
        assert get_default_config_path() == expected


class TestReadConfigFile:
    """Test reading configuration from TOML files."""

    def test_read_nonexistent_file(self, tmp_path: Path) -> None:
        """Test reading non-existent file returns empty dict."""
        config_path = tmp_path / "nonexistent.toml"
        assert read_config_file(config_path) == {}

    def test_read_empty_file(self, tmp_path: Path) -> None:
        """Test reading empty TOML file."""
        config_path = tmp_path / "empty.toml"
        config_path.write_text("")
        assert read_config_file(config_path) == {}

    def test_read_valid_toml(self, tmp_path: Path) -> None:
        """Test reading valid TOML configuration."""
        config_path = tmp_path / "config.toml"
        config_path.write_text(
            'library_path = "/path/to/books"\n'
            'ai_provider = "openai"\n'
            'openai_model = "gpt-4o-mini"\n'
            "openai_max_tokens = 1024\n"
            "openai_request_timeout = 90\n"
        )

        config = read_config_file(config_path)
        assert config == {
            "library_path": "/path/to/books",
            "ai_provider": "openai",
            "openai_model": "gpt-4o-mini",
            "openai_max_tokens": 1024,
            "openai_request_timeout": 90,
        }

    def test_read_invalid_toml(self, tmp_path: Path) -> None:
        """Test reading invalid TOML raises ValueError."""
        config_path = tmp_path / "invalid.toml"
        config_path.write_text("invalid toml content [unclosed")

        with pytest.raises(ValueError, match="Invalid TOML"):
            read_config_file(config_path)


class TestAppSettings:
    """Test AppSettings model validation."""

    def test_default_values(self) -> None:
        """Test default settings values."""
        settings = AppSettings()
        assert settings.library_path == Path.cwd()
        assert settings.ai_provider == "openai"
        assert settings.openai_api_key is None
        assert settings.openai_model == "gpt-4"
        assert settings.openai_base_url is None
        assert settings.openai_max_tokens == 512
        assert settings.openai_request_timeout == 120

    def test_library_path_resolution(self, tmp_path: Path) -> None:
        """Test library path is resolved to absolute path."""
        relative_path = Path("relative/path")
        settings = AppSettings(library_path=relative_path)
        assert settings.library_path == (Path.cwd() / relative_path).resolve()

    def test_positive_integer_validation(self) -> None:
        """Test positive integer validation for token and timeout fields."""
        # Valid values
        AppSettings(openai_max_tokens=1, openai_request_timeout=1)
        AppSettings(openai_max_tokens=999999, openai_request_timeout=999999)

        # Invalid values
        with pytest.raises(ValueError, match="greater than 0"):
            AppSettings(openai_max_tokens=0)
        with pytest.raises(ValueError, match="greater than 0"):
            AppSettings(openai_max_tokens=-1)
        with pytest.raises(ValueError, match="greater than 0"):
            AppSettings(openai_request_timeout=0)
        with pytest.raises(ValueError, match="greater than 0"):
            AppSettings(openai_request_timeout=-1)


class TestLoadSettings:
    """Test settings loading with precedence."""

    def test_load_default_settings(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading default settings with no config file or env vars."""
        # Ensure no config file exists
        monkeypatch.setattr("liriac.infra.config.settings.read_config_file", lambda: {})
        # Clear relevant env vars
        for env_var in [
            "LIRIAC_LIBRARY_DIR",
            "LIRIAC_AI_PROVIDER",
            "OPENAI_API_KEY",
            "OPENAI_MODEL",
            "OPENAI_BASE_URL",
            "OPENAI_MAX_TOKENS",
            "OPENAI_REQUEST_TIMEOUT",
        ]:
            monkeypatch.delenv(env_var, raising=False)

        settings = load_settings()
        assert settings.library_path == Path.cwd()
        assert settings.ai_provider == "openai"
        assert settings.openai_model == "gpt-4"
        assert settings.openai_max_tokens == 512
        assert settings.openai_request_timeout == 120

    def test_load_file_settings(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """Test loading settings from config file."""
        monkeypatch.setattr(
            "liriac.infra.config.settings.read_config_file",
            lambda: {
                "library_path": str(tmp_path / "mybooks"),
                "ai_provider": "openai",
                "openai_model": "gpt-4o-mini",
                "openai_max_tokens": 1024,
                "openai_request_timeout": 90,
            },
        )
        # Clear env vars
        for env_var in ["LIRIAC_LIBRARY_DIR", "OPENAI_MODEL", "OPENAI_MAX_TOKENS"]:
            monkeypatch.delenv(env_var, raising=False)

        settings = load_settings()
        assert settings.library_path == (tmp_path / "mybooks").resolve()
        assert settings.openai_model == "gpt-4o-mini"
        assert settings.openai_max_tokens == 1024
        assert settings.openai_request_timeout == 90

    def test_load_env_settings(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading settings from environment variables."""
        monkeypatch.setattr("liriac.infra.config.settings.read_config_file", lambda: {})

        env_vars = {
            "LIRIAC_LIBRARY_DIR": "/env/books",
            "OPENAI_MODEL": "gpt-4-turbo",
            "OPENAI_API_KEY": "test-key",
            "OPENAI_MAX_TOKENS": "2048",
            "OPENAI_REQUEST_TIMEOUT": "60",
        }
        for key, value in env_vars.items():
            monkeypatch.setenv(key, value)

        settings = load_settings()
        assert settings.library_path == Path("/env/books").resolve()
        assert settings.openai_model == "gpt-4-turbo"
        assert settings.openai_api_key == "test-key"
        assert settings.openai_max_tokens == 2048
        assert settings.openai_request_timeout == 60

    def test_env_integer_conversion(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test environment variables are properly converted to integers."""
        monkeypatch.setattr("liriac.infra.config.settings.read_config_file", lambda: {})
        monkeypatch.setenv("OPENAI_MAX_TOKENS", "1000")
        monkeypatch.setenv("OPENAI_REQUEST_TIMEOUT", "30")

        settings = load_settings()
        assert settings.openai_max_tokens == 1000
        assert settings.openai_request_timeout == 30

    def test_precedence_order(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test that CLI overrides have highest precedence."""
        # File settings (lowest precedence)
        monkeypatch.setattr(
            "liriac.infra.config.settings.read_config_file",
            lambda: {
                "library_path": "/file/books",
                "openai_model": "gpt-4",
                "openai_max_tokens": 512,
            },
        )

        # Env vars (middle precedence)
        monkeypatch.setenv("LIRIAC_LIBRARY_DIR", "/env/books")
        monkeypatch.setenv("OPENAI_MODEL", "gpt-4-turbo")
        monkeypatch.setenv("OPENAI_MAX_TOKENS", "1024")

        # CLI overrides (highest precedence)
        cli_overrides = {
            "library_path": "/cli/books",
            "openai_model": "gpt-4o",
            "openai_request_timeout": 300,
        }

        settings = load_settings(cli_overrides)

        # CLI should win
        assert settings.library_path == Path("/cli/books").resolve()
        assert settings.openai_model == "gpt-4o"
        assert settings.openai_request_timeout == 300

        # Env should win over file for non-overridden values
        assert settings.openai_max_tokens == 1024

    def test_invalid_env_integers(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test invalid integer environment variables are handled."""
        monkeypatch.setattr("liriac.infra.config.settings.read_config_file", lambda: {})
        monkeypatch.setenv("OPENAI_MAX_TOKENS", "invalid")

        with pytest.raises(ValueError, match="Input should be a valid integer"):
            load_settings()

    def test_invalid_config_file_values(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test invalid values in config file are handled."""
        monkeypatch.setattr(
            "liriac.infra.config.settings.read_config_file",
            lambda: {
                "openai_max_tokens": -1,
                "openai_request_timeout": 0,
            },
        )

        with pytest.raises(ValueError, match="greater than 0"):
            load_settings()

    def test_unknown_config_keys_ignored(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test unknown keys in config file are ignored."""
        monkeypatch.setattr(
            "liriac.infra.config.settings.read_config_file",
            lambda: {
                "unknown_key": "value",
                "another_unknown": {"nested": "value"},
                "openai_model": "gpt-4",  # This should be used
            },
        )

        settings = load_settings()
        assert settings.openai_model == "gpt-4"
        # Unknown keys should not cause errors


class TestIntegration:
    """Integration tests with real file system."""

    def test_config_file_integration(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """Test reading from real TOML file."""
        config_dir = tmp_path / ".config" / "liriac"
        config_dir.mkdir(parents=True)
        config_file = config_dir / "config.toml"

        config_file.write_text(
            'library_path = "/test/books"\n'
            'openai_model = "gpt-4o-mini"\n'
            "openai_max_tokens = 1024\n"
        )

        monkeypatch.setattr("pathlib.Path.home", lambda: tmp_path)
        monkeypatch.delenv("XDG_CONFIG_HOME", raising=False)

        # Clear env vars
        for env_var in ["LIRIAC_LIBRARY_DIR", "OPENAI_MODEL", "OPENAI_MAX_TOKENS"]:
            monkeypatch.delenv(env_var, raising=False)

        settings = load_settings()
        assert settings.library_path == Path("/test/books").resolve()
        assert settings.openai_model == "gpt-4o-mini"
        assert settings.openai_max_tokens == 1024

    def test_xdg_config_integration(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ) -> None:
        """Test XDG_CONFIG_HOME integration."""
        xdg_dir = tmp_path / "xdg_config"
        config_dir = xdg_dir / "liriac"
        config_dir.mkdir(parents=True)
        config_file = config_dir / "config.toml"

        config_file.write_text('openai_model = "gpt-4-turbo"')

        monkeypatch.setenv("XDG_CONFIG_HOME", str(xdg_dir))

        settings = load_settings()
        assert settings.openai_model == "gpt-4-turbo"
