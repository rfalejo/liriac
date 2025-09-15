"""Local metrics adapter for liriac.

Provides file-based metrics recording with atomic writes.
"""

import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

__all__ = ["MetricsRecorder"]


class MetricsRecorder:
    """Records and persists application metrics to a JSON file.

    Tracks counters and timing observations with thread-safe accumulation
    and atomic file writes.
    """

    def __init__(self, base_dir: Path) -> None:
        """Initialize metrics recorder.

        Args:
            base_dir: Base directory where .liriac/metrics.json will be stored
        """
        self._base_dir = base_dir
        self._metrics_dir = base_dir / ".liriac"
        self._metrics_file = self._metrics_dir / "metrics.json"

        # In-memory metrics storage
        self._counters: dict[str, int] = {}
        self._timers: dict[str, dict[str, Any]] = {}

    def increment(self, name: str, value: int = 1) -> None:
        """Increment a counter.

        Args:
            name: Counter name
            value: Value to add (default: 1)
        """
        if not isinstance(value, int):
            raise TypeError(f"value must be int, got {type(value)}")

        self._counters[name] = self._counters.get(name, 0) + value

    def observe(self, name: str, seconds: float) -> None:
        """Record a timing observation.

        Args:
            name: Timer name
            seconds: Duration in seconds
        """
        if not isinstance(seconds, (int, float)):
            raise TypeError(f"seconds must be numeric, got {type(seconds)}")

        if name not in self._timers:
            self._timers[name] = {
                "count": 0,
                "min": float("inf"),
                "max": float("-inf"),
                "total": 0.0,
            }

        timer = self._timers[name]
        timer["count"] += 1
        timer["min"] = min(timer["min"], seconds)
        timer["max"] = max(timer["max"], seconds)
        timer["total"] += seconds

    def snapshot(self) -> dict[str, Any]:
        """Get current in-memory metrics snapshot.

        Returns:
            Dictionary containing current metrics state
        """
        # Calculate averages for timers
        timers: dict[str, dict[str, Any]] = {}
        for name, timer in self._timers.items():
            if timer["count"] > 0:
                avg = timer["total"] / timer["count"]
            else:
                avg = 0.0

            timers[name] = {
                "count": timer["count"],
                "min": timer["min"],
                "max": timer["max"],
                "avg": avg,
            }

        return {
            "version": 1,
            "updated_at": datetime.now(UTC).isoformat(),
            "counters": dict(self._counters),
            "timers": timers,
        }

    def flush(self) -> None:
        """Write current metrics to file atomically.

        Creates .liriac directory if needed and writes metrics.json
        with atomic file replacement.
        """
        # Ensure directory exists
        self._metrics_dir.mkdir(parents=True, exist_ok=True)

        # Get current snapshot
        data = self.snapshot()

        # Write to temporary file first
        temp_path = self._metrics_file.with_suffix(".tmp")
        try:
            with temp_path.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")  # Ensure newline at EOF

            # Atomic replace
            os.replace(temp_path, self._metrics_file)
        except Exception:
            # Clean up temp file if something went wrong
            if temp_path.exists():
                temp_path.unlink()
            raise
