"""Tests for autosave service functionality.

Comprehensive test suite covering scheduler behavior, idempotent hashing,
snapshots, and integration with the filesystem repository.
"""

from __future__ import annotations

import time
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from unittest.mock import Mock

import pytest

from liriac.domain.types import BookId, ChapterId
from liriac.domain.value_objects import ChapterRef
from liriac.infra.fs.library import FilesystemLibraryRepository
from liriac.services.autosave.scheduler import AutosaveScheduler
from liriac.services.autosave.snapshots import write_snapshot
from liriac.services.autosave.writer import content_hash, normalize_text


class TestWriter:
    """Test content normalization and hashing utilities."""

    def test_normalize_text_adds_single_newline(self) -> None:
        """Test that normalize_text ensures exactly one trailing newline."""
        # No newline
        assert normalize_text("hello") == "hello\n"

        # Single newline
        assert normalize_text("hello\n") == "hello\n"

        # Multiple newlines
        assert normalize_text("hello\n\n\n") == "hello\n"

        # Empty string
        assert normalize_text("") == "\n"

    def test_content_hash_consistent(self) -> None:
        """Test that content_hash returns consistent values for same normalized content."""
        text1 = "hello"
        text2 = "hello\n"
        text3 = "hello\n\n"

        # All should produce the same hash since they normalize to the same content
        hash1 = content_hash(text1)
        hash2 = content_hash(text2)
        hash3 = content_hash(text3)

        assert hash1 == hash2 == hash3
        assert len(hash1) == 64  # SHA256 hex length

    def test_content_hash_different_for_different_content(self) -> None:
        """Test that different content produces different hashes."""
        hash1 = content_hash("hello")
        hash2 = content_hash("world")

        assert hash1 != hash2


class TestSnapshots:
    """Test snapshot functionality."""

    def test_write_snapshot_creates_file(self, tmp_path: Path) -> None:
        """Test that write_snapshot creates a file with correct content."""
        book_id = BookId("test-book")
        ref = ChapterRef(
            book_id=book_id,
            relative_path=PurePosixPath("chapters/01-test.md"),
        )
        content = "Test chapter content"
        now = datetime.now(UTC)

        # Create book directory
        book_dir = tmp_path / book_id
        book_dir.mkdir()

        snapshot_path = write_snapshot(tmp_path, ref, content, now)

        # Check that file was created
        assert snapshot_path.exists()
        assert snapshot_path.parent.name == "versions"

        # Check filename format
        timestamp_str = now.strftime("%Y-%m-%dT%H-%M-%SZ")
        expected_name = f"{timestamp_str}-01-test.md"
        assert snapshot_path.name == expected_name

        # Check content
        assert snapshot_path.read_text(encoding="utf-8") == "Test chapter content\n"

    def test_write_snapshot_creates_directories(self, tmp_path: Path) -> None:
        """Test that write_snapshot creates necessary directories."""
        book_id = BookId("test-book")
        ref = ChapterRef(
            book_id=book_id,
            relative_path=PurePosixPath("chapters/01-test.md"),
        )
        content = "Test content"
        now = datetime.now(UTC)

        # Don't create any directories beforehand
        snapshot_path = write_snapshot(tmp_path, ref, content, now)

        # Check that all directories were created
        assert snapshot_path.exists()
        assert (tmp_path / book_id / ".liriac" / "versions").exists()

    def test_write_snapshot_no_temp_files_left(self, tmp_path: Path) -> None:
        """Test that write_snapshot doesn't leave temporary files behind."""
        book_id = BookId("test-book")
        ref = ChapterRef(
            book_id=book_id,
            relative_path=PurePosixPath("chapters/01-test.md"),
        )
        content = "Test content"
        now = datetime.now(UTC)

        snapshot_path = write_snapshot(tmp_path, ref, content, now)

        # Check no .tmp files exist in the versions directory
        versions_dir = snapshot_path.parent
        tmp_files = list(versions_dir.glob("*.tmp"))
        assert len(tmp_files) == 0


class TestAutosaveScheduler:
    """Test autosave scheduler functionality."""

    @pytest.fixture
    def mock_repo(self) -> Mock:
        """Create a mock chapter repository."""
        repo = Mock()
        repo.write_chapter = Mock()
        return repo

    @pytest.fixture
    def scheduler(self, tmp_path: Path, mock_repo: Mock) -> AutosaveScheduler:
        """Create an autosave scheduler with test configuration."""
        return AutosaveScheduler(
            library_path=tmp_path,
            repo=mock_repo,
            debounce_seconds=0.1,  # Short debounce for tests
            snapshot_threshold=10,  # Low threshold for tests
        )

    @pytest.fixture
    def test_ref(self) -> ChapterRef:
        """Create a test chapter reference."""
        return ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapters/01-test.md"),
        )

    def test_schedule_does_not_write_immediately(
        self, scheduler: AutosaveScheduler, mock_repo: Mock, test_ref: ChapterRef
    ) -> None:
        """Test that schedule() does not trigger immediate writes."""
        scheduler.schedule(test_ref, "Test content")

        # No write should have occurred yet
        mock_repo.write_chapter.assert_not_called()

    def test_flush_executes_pending_save(
        self, scheduler: AutosaveScheduler, mock_repo: Mock, test_ref: ChapterRef
    ) -> None:
        """Test that flush() executes pending saves."""
        content = "Test content"
        scheduler.schedule(test_ref, content)
        scheduler.flush(test_ref)

        # Write should have been called
        mock_repo.write_chapter.assert_called_once()

        # Check the chapter that was written
        call_args = mock_repo.write_chapter.call_args
        written_chapter = call_args[0][1]  # Second argument is the chapter
        assert written_chapter.text == normalize_text(content)
        assert written_chapter.id == ChapterId("01-test")
        assert written_chapter.title == "01-test"

    def test_multiple_schedules_coalesce(
        self, scheduler: AutosaveScheduler, mock_repo: Mock, test_ref: ChapterRef
    ) -> None:
        """Test that multiple schedule() calls are coalesced."""
        scheduler.schedule(test_ref, "First content")
        scheduler.schedule(test_ref, "Second content")
        scheduler.schedule(test_ref, "Final content")

        scheduler.flush(test_ref)

        # Only one write should occur with the final content
        mock_repo.write_chapter.assert_called_once()
        call_args = mock_repo.write_chapter.call_args
        written_chapter = call_args[0][1]
        assert written_chapter.text == normalize_text("Final content")

    def test_idempotent_hash_skips_unchanged_content(
        self, scheduler: AutosaveScheduler, mock_repo: Mock, test_ref: ChapterRef
    ) -> None:
        """Test that identical normalized content doesn't trigger writes."""
        content1 = "Test content"
        content2 = "Test content\n"  # Same after normalization

        scheduler.schedule(test_ref, content1)
        scheduler.flush(test_ref)

        # Reset mock
        mock_repo.reset_mock()

        # Schedule identical content
        scheduler.schedule(test_ref, content2)
        scheduler.flush(test_ref)

        # No second write should occur
        mock_repo.write_chapter.assert_not_called()

    def test_flush_all_refs(
        self, scheduler: AutosaveScheduler, mock_repo: Mock
    ) -> None:
        """Test that flush(None) executes all pending saves."""
        ref1 = ChapterRef(
            book_id=BookId("book1"),
            relative_path=PurePosixPath("chapters/01-test.md"),
        )
        ref2 = ChapterRef(
            book_id=BookId("book2"),
            relative_path=PurePosixPath("chapters/02-test.md"),
        )

        scheduler.schedule(ref1, "Content 1")
        scheduler.schedule(ref2, "Content 2")

        scheduler.flush()  # Flush all

        # Both writes should have occurred
        assert mock_repo.write_chapter.call_count == 2

    def test_shutdown_cancels_timers(
        self, scheduler: AutosaveScheduler, mock_repo: Mock, test_ref: ChapterRef
    ) -> None:
        """Test that shutdown(flush=False) cancels pending saves."""
        scheduler.schedule(test_ref, "Test content")
        scheduler.shutdown(flush=False)

        # Wait a bit to ensure timer would have fired
        time.sleep(0.2)

        # No write should have occurred
        mock_repo.write_chapter.assert_not_called()

    def test_shutdown_with_flush(
        self, scheduler: AutosaveScheduler, mock_repo: Mock, test_ref: ChapterRef
    ) -> None:
        """Test that shutdown(flush=True) executes pending saves."""
        scheduler.schedule(test_ref, "Test content")
        scheduler.shutdown(flush=True)

        # Write should have occurred
        mock_repo.write_chapter.assert_called_once()


class TestAutosaveIntegration:
    """Integration tests with filesystem repository."""

    @pytest.fixture
    def library_path(self, tmp_path: Path) -> Path:
        """Create a test library with a book."""
        book_id = BookId("test-book")
        book_dir = tmp_path / book_id
        book_dir.mkdir()

        # Create chapters directory
        chapters_dir = book_dir / "chapters"
        chapters_dir.mkdir()

        # Create book.toml
        book_toml = book_dir / "book.toml"
        book_toml.write_text(
            'title = "Test Book"\n'
            'created_at = "2024-01-01"\n'
            'chapters = ["01-test.md"]\n',
            encoding="utf-8",
        )

        # Create initial chapter
        chapter_file = chapters_dir / "01-test.md"
        chapter_file.write_text("Initial content\n", encoding="utf-8")

        return tmp_path

    @pytest.fixture
    def repo(self) -> FilesystemLibraryRepository:
        """Create a filesystem repository."""
        return FilesystemLibraryRepository()

    @pytest.fixture
    def scheduler_with_repo(
        self, library_path: Path, repo: FilesystemLibraryRepository
    ) -> AutosaveScheduler:
        """Create scheduler with real filesystem repository."""
        return AutosaveScheduler(
            library_path=library_path,
            repo=repo,
            debounce_seconds=0.1,
            snapshot_threshold=5,  # Low threshold for testing
        )

    def test_full_autosave_cycle(
        self,
        scheduler_with_repo: AutosaveScheduler,
        library_path: Path,
    ) -> None:
        """Test complete autosave cycle with real filesystem operations."""
        ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapters/01-test.md"),
        )

        new_content = "Updated chapter content with more text"

        # Schedule save
        scheduler_with_repo.schedule(ref, new_content)
        scheduler_with_repo.flush(ref)

        # Check that file was updated
        chapter_file = library_path / "test-book" / "chapters" / "01-test.md"
        assert chapter_file.read_text(encoding="utf-8") == new_content + "\n"

    def test_snapshot_creation_on_large_change(
        self,
        scheduler_with_repo: AutosaveScheduler,
        library_path: Path,
    ) -> None:
        """Test that snapshots are created when changes exceed threshold."""
        ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapters/01-test.md"),
        )

        # Initial save to establish baseline
        initial_content = "Short"
        scheduler_with_repo.schedule(ref, initial_content)
        scheduler_with_repo.flush(ref)

        # Make a large change that exceeds threshold (5 chars)
        large_content = "This is a much longer content that exceeds the threshold"
        scheduler_with_repo.schedule(ref, large_content)
        scheduler_with_repo.flush(ref)

        # Check that snapshot was created
        versions_dir = library_path / "test-book" / ".liriac" / "versions"
        assert versions_dir.exists()

        snapshot_files = list(versions_dir.glob("*-01-test.md"))
        assert len(snapshot_files) == 1

        # Check snapshot content
        snapshot_content = snapshot_files[0].read_text(encoding="utf-8")
        assert snapshot_content == large_content + "\n"

    def test_no_snapshot_on_small_change(
        self,
        scheduler_with_repo: AutosaveScheduler,
        library_path: Path,
    ) -> None:
        """Test that snapshots are not created for small changes."""
        ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapters/01-test.md"),
        )

        # Initial save
        initial_content = "Hello"
        scheduler_with_repo.schedule(ref, initial_content)
        scheduler_with_repo.flush(ref)

        # Small change (below 5 char threshold)
        small_change = "Hi"
        scheduler_with_repo.schedule(ref, small_change)
        scheduler_with_repo.flush(ref)

        # No snapshot should be created
        versions_dir = library_path / "test-book" / ".liriac" / "versions"
        if versions_dir.exists():
            snapshot_files = list(versions_dir.glob("*-01-test.md"))
            assert len(snapshot_files) == 0

    def test_atomic_writes_no_temp_files(
        self,
        scheduler_with_repo: AutosaveScheduler,
        library_path: Path,
    ) -> None:
        """Test that no temporary files are left behind after saves."""
        ref = ChapterRef(
            book_id=BookId("test-book"),
            relative_path=PurePosixPath("chapters/01-test.md"),
        )

        content = "Test content for atomic writes"

        scheduler_with_repo.schedule(ref, content)
        scheduler_with_repo.flush(ref)

        # Check no .tmp files in chapters directory
        chapters_dir = library_path / "test-book" / "chapters"
        tmp_files = list(chapters_dir.glob("*.tmp"))
        assert len(tmp_files) == 0

        # Check no .tmp files in versions directory (if it exists)
        versions_dir = library_path / "test-book" / ".liriac" / "versions"
        if versions_dir.exists():
            tmp_files = list(versions_dir.glob("*.tmp"))
            assert len(tmp_files) == 0
