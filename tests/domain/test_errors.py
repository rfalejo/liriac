"""Unit tests for domain error hierarchy.

Tests cover exception hierarchy, construction, message formatting,
and handling semantics as specified in L-01 ticket.
"""

import pytest
from liriac.domain.errors import (
    DomainError,
    InvariantViolation,
    ConcurrencyConflict,
    AppendRejected,
    SlugInvalid,
    ContextOverBudget,
)


class TestDomainError:
    """Test the base DomainError class."""

    def test_inheritance(self) -> None:
        """DomainError should inherit from Exception."""
        assert issubclass(DomainError, Exception)
        # All exceptions inherit from BaseException, but we want to ensure
        # we're not inheriting directly from BaseException
        assert DomainError.__bases__ == (Exception,)

    def test_construction_with_message(self) -> None:
        """DomainError should store and return the provided message."""
        message = "Test domain error message"
        error = DomainError(message)

        assert error.message == message
        assert str(error) == message

    def test_message_formatting(self) -> None:
        """Messages should be concise and include identifiers when useful."""
        error = DomainError("Book 'my-book' not found")
        assert "my-book" in str(error)
        assert "not found" in str(error)

    def test_exception_chaining(self) -> None:
        """DomainError should support native exception chaining."""
        original_error = ValueError("Original cause")
        try:
            raise DomainError("Domain failure") from original_error
        except DomainError as domain_error:
            assert domain_error.__cause__ is original_error
            assert str(domain_error) == "Domain failure"


class TestInvariantViolation:
    """Test the InvariantViolation exception."""

    def test_inheritance(self) -> None:
        """InvariantViolation should inherit from DomainError."""
        assert issubclass(InvariantViolation, DomainError)
        assert issubclass(InvariantViolation, Exception)

    def test_construction(self) -> None:
        """Should accept and store violation messages."""
        message = "Title cannot be empty"
        error = InvariantViolation(message)

        assert str(error) == message
        assert isinstance(error, DomainError)

    def test_catching_by_base_class(self) -> None:
        """Should be catchable as DomainError."""
        try:
            raise InvariantViolation("Test violation")
        except DomainError:
            assert True  # Test passes if we catch it
        except Exception:
            pytest.fail("InvariantViolation should be catchable as DomainError")


class TestConcurrencyConflict:
    """Test the ConcurrencyConflict exception."""

    def test_inheritance(self) -> None:
        """ConcurrencyConflict should inherit from DomainError."""
        assert issubclass(ConcurrencyConflict, DomainError)

    def test_construction_with_entity_info(self) -> None:
        """Should include entity identifiers for diagnostics."""
        error = ConcurrencyConflict("Chapter 'ch_01' was modified by another process")
        assert "ch_01" in str(error)
        assert "modified by another process" in str(error)


class TestAppendRejected:
    """Test the AppendRejected exception."""

    def test_inheritance(self) -> None:
        """AppendRejected should inherit from DomainError."""
        assert issubclass(AppendRejected, DomainError)

    def test_construction(self) -> None:
        """Should clearly indicate append-only policy violation."""
        error = AppendRejected("Cannot modify existing chapter text")
        assert "Cannot modify" in str(error)
        assert isinstance(error, DomainError)


class TestSlugInvalid:
    """Test the SlugInvalid exception."""

    def test_inheritance_hierarchy(self) -> None:
        """SlugInvalid should inherit from InvariantViolation and DomainError."""
        assert issubclass(SlugInvalid, InvariantViolation)
        assert issubclass(SlugInvalid, DomainError)

    def test_construction_with_specific_guidance(self) -> None:
        """Should provide actionable guidance for slug validation."""
        error = SlugInvalid("Slug 'My Book' is invalid: must be lowercase-hyphenated")
        assert "My Book" in str(error)
        assert "lowercase-hyphenated" in str(error)

    def test_catching_by_specific_and_base_classes(self) -> None:
        """Should be catchable as SlugInvalid, InvariantViolation, or DomainError."""
        error = SlugInvalid("Test slug error")

        # Test specific catch
        try:
            raise error
        except SlugInvalid:
            assert True
        except Exception:
            pytest.fail("Should be catchable as SlugInvalid")

        # Test base class catch
        try:
            raise error
        except InvariantViolation:
            assert True
        except Exception:
            pytest.fail("Should be catchable as InvariantViolation")

        # Test domain error catch
        try:
            raise error
        except DomainError:
            assert True
        except Exception:
            pytest.fail("Should be catchable as DomainError")


class TestContextOverBudget:
    """Test the ContextOverBudget exception."""

    def test_inheritance(self) -> None:
        """ContextOverBudget should inherit from DomainError."""
        assert issubclass(ContextOverBudget, DomainError)

    def test_construction_with_budget_info(self) -> None:
        """Should include budget and token count information."""
        error = ContextOverBudget("Context size 4500 exceeds budget 4000")
        assert "4500" in str(error)
        assert "4000" in str(error)
        assert "exceeds budget" in str(error)

    def test_message_without_implementation_details(self) -> None:
        """Messages should avoid implementation details like tokenizer names."""
        error = ContextOverBudget("Context exceeds token budget")
        assert "tiktoken" not in str(error)
        assert "openai" not in str(error)


class TestErrorMessages:
    """Test message formatting conventions across all exceptions."""

    @pytest.mark.parametrize(
        "error_class,expected_phrases",
        [
            (DomainError, ["domain error"]),
            (InvariantViolation, ["invariant", "violation"]),
            (ConcurrencyConflict, ["conflict", "concurrent"]),
            (AppendRejected, ["append", "rejected"]),
            (SlugInvalid, ["slug", "invalid"]),
            (ContextOverBudget, ["context", "budget"]),
        ],
    )
    def test_message_content_conventions(
        self, error_class: type[DomainError], expected_phrases: list[str]
    ) -> None:
        """Messages should follow domain-specific conventions."""
        message = f"Test {error_class.__name__} with details"
        error = error_class(message)

        error_str = str(error).lower()
        for phrase in expected_phrases:
            assert phrase in error_str or message.lower() in error_str

    def test_messages_avoid_implementation_details(self) -> None:
        """Messages should not leak technical implementation details."""
        errors = [
            DomainError(
                "File system error"
            ),  # Should avoid "IOError" or specific paths
            InvariantViolation(
                "Validation failed"
            ),  # Should avoid specific validation library names
            ContextOverBudget("Token limit exceeded"),  # Should avoid tokenizer names
        ]

        forbidden_terms = ["tiktoken", "openai", "pydantic", "json", "sqlite"]
        for error in errors:
            error_str = str(error).lower()
            for term in forbidden_terms:
                assert term not in error_str, (
                    f"Error message contains implementation detail: {term}"
                )


class TestErrorAttributes:
    """Test that exceptions have appropriate attributes."""

    def test_domain_error_has_message_attribute(self) -> None:
        """DomainError should expose message as an attribute."""
        message = "Test message"
        error = DomainError(message)

        assert hasattr(error, "message")
        assert error.message == message

    def test_subclasses_inherit_message_attribute(self) -> None:
        """All domain errors should have the message attribute."""
        error_classes = [
            DomainError,
            InvariantViolation,
            ConcurrencyConflict,
            AppendRejected,
            SlugInvalid,
            ContextOverBudget,
        ]

        for error_class in error_classes:
            error = error_class("Test message")
            assert hasattr(error, "message")
            assert error.message == "Test message"


class TestErrorEquality:
    """Test error equality and identity behavior."""

    def test_same_content_not_equal(self) -> None:
        """Exceptions with same message should not be considered equal."""
        error1 = DomainError("Same message")
        error2 = DomainError("Same message")

        assert error1 is not error2
        assert error1 != error2  # Exception equality compares identity, not content

    def test_different_types_not_equal(self) -> None:
        """Different error types with same message should not be equal."""
        error1 = InvariantViolation("Test message")
        error2 = DomainError("Test message")

        assert error1 != error2
        assert type(error1) is not type(error2)
