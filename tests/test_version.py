"""Test version import and validation."""

from liriac import __version__


def test_version_imports() -> None:
    """Test that __version__ can be imported and is a non-empty string."""
    assert isinstance(__version__, str)
    assert len(__version__) > 0
    assert __version__.count(".") >= 2  # Basic semantic version format check
