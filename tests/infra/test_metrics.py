"""Tests for local metrics adapter."""

import json
from pathlib import Path

import pytest

from liriac.infra.metrics import MetricsRecorder


class TestMetricsRecorder:
    """Test metrics recorder functionality."""

    def test_increment_counter(self, tmp_path: Path) -> None:
        """Test counter increment."""
        recorder = MetricsRecorder(tmp_path)
        recorder.increment("suggestions_total")
        recorder.increment("suggestions_total", 2)

        snapshot = recorder.snapshot()
        assert snapshot["counters"]["suggestions_total"] == 3

    def test_observe_timing(self, tmp_path: Path) -> None:
        """Test timing observation."""
        recorder = MetricsRecorder(tmp_path)
        recorder.observe("suggestion_seconds", 0.1)
        recorder.observe("suggestion_seconds", 0.2)
        recorder.observe("suggestion_seconds", 0.3)

        snapshot = recorder.snapshot()
        timer_data = snapshot["timers"]["suggestion_seconds"]

        assert timer_data["count"] == 3
        assert timer_data["min"] == 0.1
        assert timer_data["max"] == 0.3
        assert abs(timer_data["avg"] - 0.2) < 1e-10  # Use approximate comparison

    def test_flush_writes_file(self, tmp_path: Path) -> None:
        """Test that flush writes metrics to file."""
        recorder = MetricsRecorder(tmp_path)
        recorder.increment("test_counter", 5)
        recorder.observe("test_timer", 0.15)

        recorder.flush()

        metrics_file = tmp_path / ".liriac" / "metrics.json"
        assert metrics_file.exists()

        with metrics_file.open() as f:
            data = json.load(f)

        assert data["version"] == 1
        assert data["counters"]["test_counter"] == 5
        assert data["timers"]["test_timer"]["count"] == 1
        assert "updated_at" in data

    def test_atomic_write_no_temp_files(self, tmp_path: Path) -> None:
        """Test that atomic write doesn't leave temp files."""
        recorder = MetricsRecorder(tmp_path)
        recorder.increment("test_counter")
        recorder.flush()

        # Check no temp files left behind
        temp_files = list(tmp_path.glob("**/*.tmp"))
        assert len(temp_files) == 0

        # Check final file exists
        metrics_file = tmp_path / ".liriac" / "metrics.json"
        assert metrics_file.exists()

    def test_multiple_flushes(self, tmp_path: Path) -> None:
        """Test multiple flushes accumulate properly."""
        recorder = MetricsRecorder(tmp_path)
        recorder.increment("counter1", 1)
        recorder.flush()

        first_updated = recorder.snapshot()["updated_at"]

        recorder.increment("counter1", 2)
        recorder.increment("counter2", 3)
        recorder.observe("timer1", 0.1)
        recorder.flush()

        second_updated = recorder.snapshot()["updated_at"]

        # Updated timestamp should change
        assert first_updated != second_updated

        # Check final file contains all data
        metrics_file = tmp_path / ".liriac" / "metrics.json"
        with metrics_file.open() as f:
            data = json.load(f)

        assert data["counters"]["counter1"] == 3
        assert data["counters"]["counter2"] == 3
        assert data["timers"]["timer1"]["count"] == 1

    def test_timer_single_observation(self, tmp_path: Path) -> None:
        """Test timer with single observation."""
        recorder = MetricsRecorder(tmp_path)
        recorder.observe("single_timer", 0.5)

        snapshot = recorder.snapshot()
        timer_data = snapshot["timers"]["single_timer"]

        assert timer_data["count"] == 1
        assert timer_data["min"] == 0.5
        assert timer_data["max"] == 0.5
        assert timer_data["avg"] == 0.5

    def test_timer_no_observations(self, tmp_path: Path) -> None:
        """Test timer with no observations."""
        recorder = MetricsRecorder(tmp_path)

        snapshot = recorder.snapshot()
        assert len(snapshot["timers"]) == 0

    def test_increment_type_validation(self, tmp_path: Path) -> None:
        """Test that increment validates value type."""
        recorder = MetricsRecorder(tmp_path)

        with pytest.raises(TypeError):
            recorder.increment("test", "not an int")  # type: ignore

    def test_observe_type_validation(self, tmp_path: Path) -> None:
        """Test that observe validates seconds type."""
        recorder = MetricsRecorder(tmp_path)

        with pytest.raises(TypeError):
            recorder.observe("test", "not a number")  # type: ignore

    def test_directory_creation(self, tmp_path: Path) -> None:
        """Test that flush creates necessary directories."""
        recorder = MetricsRecorder(tmp_path)
        recorder.increment("test_counter")

        # .liriac directory shouldn't exist yet
        liriac_dir = tmp_path / ".liriac"
        assert not liriac_dir.exists()

        recorder.flush()

        # Directory should now exist
        assert liriac_dir.exists()
        assert liriac_dir.is_dir()

    def test_file_ends_with_newline(self, tmp_path: Path) -> None:
        """Test that metrics file ends with newline."""
        recorder = MetricsRecorder(tmp_path)
        recorder.increment("test_counter")
        recorder.flush()

        metrics_file = tmp_path / ".liriac" / "metrics.json"
        content = metrics_file.read_text()

        assert content.endswith("\n")
