"""Shared test fixtures."""

import sys
from pathlib import Path

# Ensure the backend package root is on the path when tests are run from the repository root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
