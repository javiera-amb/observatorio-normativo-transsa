from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def run(script: str, *args: str) -> None:
    root = Path(__file__).resolve().parents[1]
    command = [sys.executable, str(root / "scripts" / script), *args]
    print("\n>", " ".join(command))
    subprocess.run(command, cwd=root, check=True)


def main() -> int:
    run("migrate_legacy_reports.py", "--reset")
    run("export_legacy_reports.py")
    run("validate_sprint1.py")
    print("\nSprint 1 ejecutado correctamente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
