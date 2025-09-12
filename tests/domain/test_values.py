"""Unit tests for domain value objects and identifiers.

Tests cover validation, error handling, formatting, and type safety
as specified in L-02 ticket.
"""

import pytest
from liriac.domain.errors import InvariantViolation, SlugInvalid
from liriac.domain.values import (
    book_id,
    make_chapter_id,
    parse_chapter_id,
    slug,
    title,
    markdown,
    token_count,
    timestamp,
)


class TestBookId:
    """Test BookId value object behavior."""

    def test_create_valid_book_id(self) -> None:
        """Should accept valid non-empty strings."""
        result = book_id("my-fantasy-novel")
        # NewType doesn't create runtime type, but we can check it's the right type hint
        assert isinstance(result, str)
        assert result == "my-fantasy-novel"

    def test_create_with_whitespace(self) -> None:
        """Should trim whitespace from input."""
        result = book_id("  my-book  ")
        assert result == "my-book"

    def test_empty_string_raises_error(self) -> None:
        """Should reject empty strings."""
        with pytest.raises(InvariantViolation, match="BookId cannot be empty"):
            book_id("")

    def test_whitespace_only_raises_error(self) -> None:
        """Should reject whitespace-only strings."""
        with pytest.raises(InvariantViolation, match="BookId cannot be empty"):
            book_id("   ")

    def test_type_safety_behavior(self) -> None:
        """Should maintain type safety with NewType (compile-time only)."""
        result = book_id("test-book")
        # NewType provides compile-time type safety, runtime is still str
        assert isinstance(result, str)
        # At runtime, it behaves like the underlying type
        plain_str = "test-book"
        assert result == plain_str  # Runtime equality works


class TestChapterId:
    """Test ChapterId creation and parsing."""

    def test_make_chapter_id_single_digit(self) -> None:
        """Should zero-pad single digit numbers."""
        result = make_chapter_id(1)
        # NewType doesn't create runtime type, but we can check it's the right format
        assert isinstance(result, str)
        assert result == "ch_01"

    def test_make_chapter_id_double_digit(self) -> None:
        """Should format double digit numbers correctly."""
        result = make_chapter_id(12)
        assert result == "ch_12"

    def test_make_chapter_id_boundary(self) -> None:
        """Should handle boundary cases correctly."""
        assert make_chapter_id(99) == "ch_99"
        assert make_chapter_id(10) == "ch_10"

    def test_make_chapter_id_negative_raises_error(self) -> None:
        """Should reject negative numbers."""
        with pytest.raises(InvariantViolation, match="Chapter number must be positive"):
            make_chapter_id(-1)

    def test_make_chapter_id_zero_raises_error(self) -> None:
        """Should reject zero."""
        with pytest.raises(InvariantViolation, match="Chapter number must be positive"):
            make_chapter_id(0)

    def test_parse_chapter_id_valid(self) -> None:
        """Should parse valid chapter IDs correctly."""
        number, chapter_id = parse_chapter_id("ch_03")
        assert number == 3
        assert chapter_id == "ch_03"
        assert isinstance(chapter_id, str)

    def test_parse_chapter_id_normalizes_format(self) -> None:
        """Should return normalized zero-padded format."""
        number, chapter_id = parse_chapter_id("ch_3")  # Non-padded input
        assert number == 3
        assert chapter_id == "ch_03"  # Normalized output

    def test_parse_chapter_id_invalid_prefix(self) -> None:
        """Should reject invalid prefixes."""
        with pytest.raises(InvariantViolation, match="must start with 'ch_'"):
            parse_chapter_id("chapter_01")

    def test_parse_chapter_id_non_numeric_suffix(self) -> None:
        """Should reject non-numeric suffixes."""
        with pytest.raises(InvariantViolation, match="must have numeric suffix"):
            parse_chapter_id("ch_abc")

    def test_parse_chapter_id_negative_number(self) -> None:
        """Should reject negative numbers in suffix."""
        with pytest.raises(InvariantViolation, match="must have numeric suffix"):
            parse_chapter_id("ch_-1")

    def test_parse_chapter_id_zero_number(self) -> None:
        """Should reject zero in suffix."""
        with pytest.raises(InvariantViolation, match="must have positive number"):
            parse_chapter_id("ch_00")

    def test_round_trip_conversion(self) -> None:
        """Should maintain consistency between make and parse."""
        original_number = 7
        chapter_id = make_chapter_id(original_number)
        parsed_number, parsed_id = parse_chapter_id(chapter_id)

        assert parsed_number == original_number
        assert parsed_id == chapter_id

    def test_type_safety_behavior(self) -> None:
        """Should maintain type safety with NewType (compile-time only)."""
        result = make_chapter_id(5)
        # NewType provides compile-time type safety, runtime is still str
        assert isinstance(result, str)
        # At runtime, it behaves like the underlying type
        plain_str = "ch_05"
        assert result == plain_str  # Runtime equality works


class TestSlug:
    """Test slug validation and normalization."""

    @pytest.mark.parametrize(
        "valid_slug",
        [
            "my-book",
            "book2",
            "a",
            "my-fantasy-novel-2024",
            "123-book",
            "book-123",
        ],
    )
    def test_valid_slugs_accepted(self, valid_slug: str) -> None:
        """Should accept properly formatted slugs."""
        result = slug(valid_slug)
        assert result == valid_slug

    def test_slug_trims_whitespace(self) -> None:
        """Should trim surrounding whitespace."""
        result = slug("  my-book  ")
        assert result == "my-book"

    def test_empty_slug_raises_error(self) -> None:
        """Should reject empty strings."""
        with pytest.raises(SlugInvalid, match="Slug cannot be empty"):
            slug("")

    def test_whitespace_only_slug_raises_error(self) -> None:
        """Should reject whitespace-only strings."""
        with pytest.raises(SlugInvalid, match="Slug cannot be whitespace"):
            slug("   ")

    @pytest.mark.parametrize(
        "invalid_slug,expected_error",
        [
            ("My Book", "must be lowercase-hyphenated"),
            ("my_book", "must be lowercase-hyphenated"),
            ("my book", "must be lowercase-hyphenated"),
            ("MyBook", "must be lowercase-hyphenated"),
            ("BOOK", "must be lowercase-hyphenated"),
        ],
    )
    def test_invalid_characters_rejected(
        self, invalid_slug: str, expected_error: str
    ) -> None:
        """Should reject slugs with invalid characters."""
        with pytest.raises(SlugInvalid, match=expected_error):
            slug(invalid_slug)

    @pytest.mark.parametrize(
        "invalid_slug,expected_error",
        [
            ("-my-book", "cannot start or end with hyphen"),
            ("my-book-", "cannot start or end with hyphen"),
            ("-", "cannot start or end with hyphen"),
        ],
    )
    def test_leading_trailing_hyphens_rejected(
        self, invalid_slug: str, expected_error: str
    ) -> None:
        """Should reject slugs with leading or trailing hyphens."""
        with pytest.raises(SlugInvalid, match=expected_error):
            slug(invalid_slug)

    def test_consecutive_hyphens_rejected(self) -> None:
        """Should reject slugs with consecutive hyphens."""
        with pytest.raises(SlugInvalid, match="cannot contain consecutive hyphens"):
            slug("my--book")

    def test_long_slug_rejected(self) -> None:
        """Should reject overly long slugs."""
        long_slug = "a" * 65  # Exceeds 64 character limit
        with pytest.raises(SlugInvalid, match="exceeds maximum length"):
            slug(long_slug)

    def test_boundary_length_accepted(self) -> None:
        """Should accept slugs at boundary lengths."""
        # Exactly 64 characters
        boundary_slug = "a" * 64
        result = slug(boundary_slug)
        assert result == boundary_slug

    def test_error_includes_invalid_value(self) -> None:
        """Error messages should include the invalid slug value."""
        invalid_slug = "My Invalid Slug"
        with pytest.raises(SlugInvalid) as exc_info:
            slug(invalid_slug)

        error_message = str(exc_info.value)
        assert invalid_slug in error_message
        assert "lowercase-hyphenated" in error_message

    def test_specialized_exception_type(self) -> None:
        """Should raise SlugInvalid which inherits from InvariantViolation."""
        with pytest.raises(SlugInvalid) as exc_info:
            slug("Invalid!")

        assert isinstance(exc_info.value, SlugInvalid)
        assert isinstance(exc_info.value, InvariantViolation)


class TestTitle:
    """Test title validation."""

    def test_valid_title_accepted(self) -> None:
        """Should accept valid non-empty titles."""
        result = title("The Great Novel")
        assert result == "The Great Novel"

    def test_title_trims_whitespace(self) -> None:
        """Should trim surrounding whitespace."""
        result = title("  The Great Novel  ")
        assert result == "The Great Novel"

    def test_empty_title_raises_error(self) -> None:
        """Should reject empty strings."""
        with pytest.raises(InvariantViolation, match="Title cannot be empty"):
            title("")

    def test_whitespace_only_title_raises_error(self) -> None:
        """Should reject whitespace-only strings."""
        with pytest.raises(InvariantViolation, match="Title cannot be whitespace"):
            title("   ")

    def test_long_title_rejected(self) -> None:
        """Should reject overly long titles."""
        long_title = "A" * 201  # Exceeds 200 character limit
        with pytest.raises(InvariantViolation, match="exceeds maximum length"):
            title(long_title)

    def test_boundary_length_accepted(self) -> None:
        """Should accept titles at boundary length."""
        boundary_title = "A" * 200
        result = title(boundary_title)
        assert result == boundary_title

    def test_special_characters_in_title(self) -> None:
        """Should accept titles with special characters."""
        special_title = "The Novel: A Story of 'Hope' & Despair"
        result = title(special_title)
        assert result == special_title


class TestMarkdown:
    """Test markdown text wrapper."""

    def test_valid_markdown_accepted(self) -> None:
        """Should accept any non-None string."""
        content = "# Chapter 1\n\nThis is the beginning..."
        result = markdown(content)
        assert result == content

    def test_empty_string_accepted(self) -> None:
        """Should accept empty strings."""
        result = markdown("")
        assert result == ""

    def test_whitespace_accepted(self) -> None:
        """Should accept whitespace-only strings."""
        whitespace = "   \n  \t  "
        result = markdown(whitespace)
        assert result == whitespace

    def test_none_raises_error(self) -> None:
        """Should reject None values."""
        with pytest.raises(InvariantViolation, match="Markdown cannot be None"):
            markdown(None)  # type: ignore

    def test_wrapper_semantics_only(self) -> None:
        """Should act as a wrapper with minimal validation."""
        original = "Some markdown **text**"
        result = markdown(original)
        assert result is original  # Should return same object (identity check)


class TestTokenCount:
    """Test token count validation."""

    def test_valid_token_count_accepted(self) -> None:
        """Should accept non-negative integers."""
        result = token_count(1000)
        # NewType doesn't create runtime type, but we can check it's the right type
        assert isinstance(result, int)
        assert result == 1000

    def test_zero_accepted(self) -> None:
        """Should accept zero tokens."""
        result = token_count(0)
        assert result == 0

    def test_negative_count_raises_error(self) -> None:
        """Should reject negative values."""
        with pytest.raises(InvariantViolation, match="Token count cannot be negative"):
            token_count(-1)

    def test_large_count_accepted(self) -> None:
        """Should accept large positive values."""
        large_count = 1_000_000
        result = token_count(large_count)
        assert result == large_count

    def test_type_safety_behavior(self) -> None:
        """Should maintain type safety with NewType (compile-time only)."""
        result = token_count(500)
        # NewType provides compile-time type safety, runtime is still int
        assert isinstance(result, int)
        # At runtime, it behaves like the underlying type
        plain_int = 500
        assert result == plain_int  # Runtime equality works


class TestTimestamp:
    """Test timestamp wrapper."""

    def test_valid_timestamp_accepted(self) -> None:
        """Should accept non-empty strings."""
        iso_timestamp = "2024-01-01T12:00:00Z"
        result = timestamp(iso_timestamp)
        # NewType doesn't create runtime type, but we can check it's the right type
        assert isinstance(result, str)
        assert result == iso_timestamp

    def test_timestamp_trims_whitespace(self) -> None:
        """Should trim surrounding whitespace."""
        result = timestamp("  2024-01-01T12:00:00Z  ")
        assert result == "2024-01-01T12:00:00Z"

    def test_empty_timestamp_raises_error(self) -> None:
        """Should reject empty strings."""
        with pytest.raises(InvariantViolation, match="Timestamp cannot be empty"):
            timestamp("")

    def test_whitespace_only_timestamp_raises_error(self) -> None:
        """Should reject whitespace-only strings."""
        with pytest.raises(InvariantViolation, match="Timestamp cannot be empty"):
            timestamp("   ")

    def test_non_iso_format_accepted_in_mvp(self) -> None:
        """Should accept any non-empty string in MVP (minimal validation)."""
        non_iso = "some timestamp string"
        result = timestamp(non_iso)
        assert result == non_iso


class TestValueObjectImmutability:
    """Test immutability and value semantics where applicable."""

    def test_newtypes_are_immutable(self) -> None:
        """NewType instances should be immutable."""
        book_id_val = book_id("test-book")
        chapter_id_val = make_chapter_id(1)
        token_count_val = token_count(100)
        timestamp_val = timestamp("2024-01-01")

        # These are type aliases, so they inherit immutability from str/int
        # We can't actually test mutation since they're built-in types
        assert isinstance(book_id_val, str)
        assert isinstance(chapter_id_val, str)
        assert isinstance(token_count_val, int)
        assert isinstance(timestamp_val, str)

    def test_string_vos_return_new_objects(self) -> None:
        """String-based VOs should return new normalized objects."""
        original = "  my-book  "
        result = slug(original)

        # Should be different object (trimmed)
        assert result is not original
        assert result == "my-book"


class TestErrorMessageQuality:
    """Test that error messages are clear and actionable."""

    def test_slug_error_messages_are_actionable(self) -> None:
        """Slug error messages should guide users to correct format."""
        error_cases = [
            ("My Book", "lowercase-hyphenated"),
            ("my_book", "lowercase-hyphenated"),
            ("-my-book", "start or end with hyphen"),
            ("my--book", "consecutive hyphens"),
        ]

        for invalid_slug, expected_guidance in error_cases:
            with pytest.raises(SlugInvalid) as exc_info:
                slug(invalid_slug)

            message = str(exc_info.value).lower()
            assert invalid_slug.lower() in message
            assert expected_guidance in message

    def test_chapter_id_error_includes_problematic_value(self) -> None:
        """Chapter ID errors should include the invalid value."""
        with pytest.raises(InvariantViolation) as exc_info:
            parse_chapter_id("invalid_ch_01")

        message = str(exc_info.value)
        assert "invalid_ch_01" in message

    def test_title_error_includes_length_info(self) -> None:
        """Title length errors should include length information."""
        long_title = "A" * 250
        with pytest.raises(InvariantViolation) as exc_info:
            title(long_title)

        message = str(exc_info.value)
        assert "200" in message  # Maximum length

    def test_token_count_error_includes_negative_value(self) -> None:
        """Token count errors should include the negative value."""
        with pytest.raises(InvariantViolation) as exc_info:
            token_count(-5)

        message = str(exc_info.value)
        assert "-5" in message


class TestIntegrationScenarios:
    """Test real-world usage scenarios."""

    def test_create_book_with_chapters(self) -> None:
        """Scenario: Create a book and multiple chapters."""
        _ = book_id("fantasy-novel")  # Book created but not used in this test

        chapter_ids = []
        for i in range(1, 4):
            chapter_id = make_chapter_id(i)
            chapter_ids.append(chapter_id)
            # Verify we can parse it back
            number, parsed_id = parse_chapter_id(chapter_id)
            assert number == i
            assert parsed_id == chapter_id

        assert len(chapter_ids) == 3
        assert chapter_ids[0] == "ch_01"
        assert chapter_ids[1] == "ch_02"
        assert chapter_ids[2] == "ch_03"

    def test_chapter_metadata_creation(self) -> None:
        """Scenario: Create complete chapter metadata."""
        chapter_id = make_chapter_id(1)
        chapter_title = title("The Beginning")
        chapter_slug = slug("the-beginning")
        word_count = token_count(1500)
        created_at = timestamp("2024-01-01T10:00:00Z")
        content = markdown("# The Beginning\n\nIt was a dark and stormy night...")

        # All should be valid types
        assert isinstance(chapter_id, str)  # ChapterId is NewType(str)
        assert isinstance(chapter_title, str)
        assert isinstance(chapter_slug, str)
        assert isinstance(word_count, int)  # TokenCount is NewType(int)
        assert isinstance(created_at, str)  # Timestamp is NewType(str)
        assert isinstance(content, str)

    def test_error_recovery_patterns(self) -> None:
        """Scenario: Handle common user input errors gracefully."""
        # User provides uppercase book title
        try:
            title("")  # Empty title
        except InvariantViolation:
            pass  # Expected

        # User provides invalid slug
        try:
            slug("My Novel")  # Uppercase with space
        except SlugInvalid:
            pass  # Expected

        # User provides invalid chapter ID format
        try:
            parse_chapter_id("chapter-1")  # Wrong format
        except InvariantViolation:
            pass  # Expected

        # These errors should be catchable as base DomainError
        for func, bad_arg in [(slug, "Bad Slug"), (title, ""), (token_count, -1)]:
            try:
                func(bad_arg)
            except InvariantViolation:
                pass  # Expected and catchable
