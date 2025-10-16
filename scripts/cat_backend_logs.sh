#!/usr/bin/env bash
set -euo pipefail

SESSION="${TMUX_SESSION:-liriac}"
TARGET_POSITION=2
LINES="${LINES:-200}"

# Ensure the configured tmux session is available before pulling logs.
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session '$SESSION' not found" >&2
  exit 1
fi

pane_id=$(tmux list-panes -a -t "$SESSION" -F "#{pane_id}" | awk -v pos="$TARGET_POSITION" 'NR == pos { print; exit }')

if [[ -z "${pane_id:-}" ]]; then
  echo "Pane at position $TARGET_POSITION not found in session '$SESSION'" >&2
  exit 1
fi

pane_label=$(tmux display-message -p -t "$pane_id" '#{session_name}:#{window_index}.#{pane_index}')

echo "=== $pane_label ($pane_id) ==="
tmux capture-pane -pt "$pane_id" -S -$LINES
