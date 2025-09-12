"""Unit tests for StopPolicy value object.

This module tests the StopPolicy value object implementation according to
the requirements in L-03 ticket.
"""

import pytest

from liriac.domain import InvariantViolation, StopPolicy


class TestStopPolicyConstruction:
    """Test StopPolicy construction and validation."""

    def test_valid_single_sequence(self):
        """Test creating policy with single valid sequence."""
        policy = StopPolicy(sequences=("END",))
        assert policy.sequences == ("END",)

    def test_valid_multiple_sequences(self):
        """Test creating policy with multiple valid sequences."""
        sequences = ("END", "###", "---", "STOP")
        policy = StopPolicy(sequences=sequences)
        assert policy.sequences == sequences

    def test_whitespace_trimming(self):
        """Test that sequences are trimmed of whitespace."""
        policy = StopPolicy.from_sequences(("  END  ", "  STOP  "))
        assert policy.sequences == ("END", "STOP")

    def test_boundary_lengths(self):
        """Test boundary cases for sequence length."""
        # Test 1 character (minimum valid length)
        policy = StopPolicy(sequences=("A",))
        assert policy.sequences == ("A",)

        # Test maximum length (128 characters)
        long_seq = "A" * 128
        policy = StopPolicy(sequences=(long_seq,))
        assert policy.sequences == (long_seq,)

    def test_boundary_count(self):
        """Test boundary cases for sequence count."""
        # Test maximum count (8 sequences)
        sequences = tuple(f"SEQ{i}" for i in range(8))
        policy = StopPolicy(sequences=sequences)
        assert len(policy.sequences) == 8

    def test_empty_policy_raises_error(self):
        """Test that empty policy raises InvariantViolation."""
        with pytest.raises(InvariantViolation, match="must include at least 1 sequence"):
            StopPolicy(sequences=())

    def test_empty_sequence_raises_error(self):
        """Test that empty sequence raises InvariantViolation."""
        with pytest.raises(InvariantViolation, match="cannot be empty"):
            StopPolicy(sequences=("valid", ""))

    
    def test_too_long_sequence_raises_error(self):
        """Test that sequence exceeding max length raises InvariantViolation."""
        long_seq = "A" * 129  # One over the limit
        with pytest.raises(InvariantViolation, match="exceeds maximum length 128"):
            StopPolicy(sequences=(long_seq,))

    def test_too_many_sequences_raises_error(self):
        """Test that exceeding max sequence count raises InvariantViolation."""
        sequences = tuple(f"SEQ{i}" for i in range(9))  # One over the limit
        with pytest.raises(InvariantViolation, match="allows at most 8 sequences"):
            StopPolicy(sequences=sequences)

    def test_non_string_sequence_raises_error(self):
        """Test that non-string sequences raise InvariantViolation."""
        with pytest.raises(InvariantViolation, match="must be a string"):
            StopPolicy(sequences=(123,))  # type: ignore

        with pytest.raises(InvariantViolation, match="must be a string"):
            StopPolicy(sequences=("valid", None))  # type: ignore

    def test_from_sequences_with_list(self):
        """Test from_sequences classmethod with list input."""
        policy = StopPolicy.from_sequences(["END", "\n\n"])
        assert policy.sequences == ("END", "\n\n")

    def test_from_sequences_with_tuple(self):
        """Test from_sequences classmethod with tuple input."""
        policy = StopPolicy.from_sequences(("END", "\n\n"))
        assert policy.sequences == ("END", "\n\n")

    def test_from_sequences_with_set(self):
        """Test from_sequences classmethod with set input."""
        # Note: set iteration order is not guaranteed, but we accept it
        sequences = {"END", "\n\n"}
        policy = StopPolicy.from_sequences(sequences)
        assert set(policy.sequences) == sequences
        assert len(policy.sequences) == 2

    def test_from_sequences_normalizes_whitespace(self):
        """Test that from_sequences normalizes whitespace."""
        policy = StopPolicy.from_sequences(["  END  ", "  STOP  "])
        assert policy.sequences == ("END", "STOP")

    def test_whitespace_only_sequences_preserved(self):
        """Test that whitespace-only sequences are preserved exactly."""
        policy = StopPolicy.from_sequences(["\n\n", "  ", "\r\n"])
        assert policy.sequences == ("\n\n", "  ", "\r\n")


class TestStopPolicyImmutability:
    """Test StopPolicy immutability and value semantics."""

    def test_frozen_dataclass(self):
        """Test that StopPolicy is truly immutable."""
        policy = StopPolicy(sequences=("END",))
        
        # Should not be able to modify sequences
        with pytest.raises(AttributeError):
            policy.sequences = ("NEW",)  # type: ignore

    def test_tuple_storage(self):
        """Test that sequences are stored as immutable tuple."""
        policy = StopPolicy(sequences=("END",))
        assert isinstance(policy.sequences, tuple)

    def test_hashable(self):
        """Test that StopPolicy instances are hashable."""
        policy1 = StopPolicy(sequences=("END",))
        policy2 = StopPolicy(sequences=("\n\n",))
        
        # Should be able to use as dictionary keys
        mapping = {policy1: "first", policy2: "second"}
        assert mapping[policy1] == "first"
        assert mapping[policy2] == "second"


class TestStopPolicyEquality:
    """Test StopPolicy equality and comparison."""

    def test_equal_same_sequences(self):
        """Test that policies with same sequences are equal."""
        policy1 = StopPolicy(sequences=("END", "\n\n"))
        policy2 = StopPolicy(sequences=("END", "\n\n"))
        assert policy1 == policy2
        assert hash(policy1) == hash(policy2)

    def test_not_equal_different_sequences(self):
        """Test that policies with different sequences are not equal."""
        policy1 = StopPolicy(sequences=("END",))
        policy2 = StopPolicy(sequences=("\n\n",))
        assert policy1 != policy2
        assert hash(policy1) != hash(policy2)

    def test_order_matters(self):
        """Test that sequence order affects equality."""
        policy1 = StopPolicy(sequences=("END", "\n\n"))
        policy2 = StopPolicy(sequences=("\n\n", "END"))
        assert policy1 != policy2

    def test_not_equal_other_type(self):
        """Test that StopPolicy is not equal to other types."""
        policy = StopPolicy(sequences=("END",))
        assert policy != "END"
        assert policy != ("END",)
        assert policy != ["END"]


class TestStopPolicyRepresentation:
    """Test StopPolicy string representations."""

    def test_str_single_sequence(self):
        """Test string representation with single sequence."""
        policy = StopPolicy(sequences=("\n\n",))
        assert str(policy) == "StopPolicy['\\n\\n']"

    def test_str_multiple_sequences(self):
        """Test string representation with multiple sequences."""
        policy = StopPolicy(sequences=("END", "\n\n"))
        expected = "StopPolicy('END', '\\n\\n')"
        assert str(policy) == expected

    def test_repr(self):
        """Test repr representation."""
        policy = StopPolicy(sequences=("END", "\n\n"))
        expected = "StopPolicy(sequences=('END', '\\n\\n'))"
        assert repr(policy) == expected


class TestStopPolicyEdgeCases:
    """Test edge cases and special scenarios."""

    def test_newline_sequences(self):
        """Test that newline sequences are handled correctly."""
        policy = StopPolicy.from_sequences(("\n", "\n\n", "\r\n"))
        assert policy.sequences == ("\n", "\n\n", "\r\n")

    def test_special_characters(self):
        """Test that special characters are allowed."""
        policy = StopPolicy(sequences=("### END ###", "===STOP===", "🔚"))
        assert policy.sequences == ("### END ###", "===STOP===", "🔚")

    def test_unicode_characters(self):
        """Test that Unicode characters are handled."""
        policy = StopPolicy(sequences=("終わり", "fin", "ende"))
        assert policy.sequences == ("終わり", "fin", "ende")

    def test_case_sensitivity(self):
        """Test that sequences are case-sensitive."""
        policy = StopPolicy(sequences=("END", "end"))
        assert policy.sequences == ("END", "end")

    def test_no_automatic_deduplication(self):
        """Test that duplicates are preserved (no auto-dedup)."""
        policy = StopPolicy(sequences=("END", "END"))
        assert policy.sequences == ("END", "END")

    def test_sequences_with_internal_whitespace(self):
        """Test that internal whitespace is preserved."""
        policy = StopPolicy.from_sequences(("  END OF SECTION  ",))
        # Only external whitespace should be trimmed
        assert policy.sequences == ("END OF SECTION",)


class TestStopPolicyErrorMessages:
    """Test that error messages are helpful and specific."""

    def test_empty_policy_message(self):
        """Test empty policy error message."""
        with pytest.raises(InvariantViolation, match="must include at least 1 sequence"):
            StopPolicy(sequences=())

    def test_empty_sequence_message(self):
        """Test empty sequence error message."""
        with pytest.raises(InvariantViolation, match="cannot be empty"):
            StopPolicy(sequences=("valid", ""))

    def test_too_long_sequence_message_includes_length(self):
        """Test that too long sequence message includes actual length."""
        long_seq = "A" * 150
        with pytest.raises(InvariantViolation, match="got 150"):
            StopPolicy(sequences=(long_seq,))

    def test_too_many_sequences_message_includes_count(self):
        """Test that too many sequences message includes actual count."""
        sequences = tuple(f"SEQ{i}" for i in range(10))
        with pytest.raises(InvariantViolation, match="got 10"):
            StopPolicy(sequences=sequences)

    def test_non_string_message_includes_type(self):
        """Test that non-string message includes the actual type."""
        with pytest.raises(InvariantViolation, match="got int"):
            StopPolicy(sequences=(123,))  # type: ignore

        with pytest.raises(InvariantViolation, match="got NoneType"):
            StopPolicy(sequences=(None,))  # type: ignore


class TestStopPolicyWithFromSequences:
    """Test specific behaviors of the from_sequences factory method."""

    def test_from_sequences_empty_iterable(self):
        """Test from_sequences with empty iterable."""
        with pytest.raises(InvariantViolation, match="must include at least 1 sequence"):
            StopPolicy.from_sequences([])

    def test_from_sequences_preserves_order(self):
        """Test that from_sequences preserves order."""
        sequences = ["first", "second", "third"]
        policy = StopPolicy.from_sequences(sequences)
        assert policy.sequences == ("first", "second", "third")

    def test_from_sequences_with_generator(self):
        """Test from_sequences with generator expression."""
        def generate_sequences():
            yield "END"
            yield "STOP"
        
        policy = StopPolicy.from_sequences(generate_sequences())
        assert policy.sequences == ("END", "STOP")