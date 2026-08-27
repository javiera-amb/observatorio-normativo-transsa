from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


def run(*args: str) -> None:
    command = [PYTHON, *args]
    print(">", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    run("scripts/init_database.py")
    run("scripts/export_web_events.py")
    run("scripts/validate_event.py", "nuevo_evento_universal_ejemplo.json")
    run("-m", "unittest", "discover", "-s", "tests", "-v")
    run("automation/validar_sitio.py")
    print("\nSPRINT 2 EJECUTADO CORRECTAMENTE.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
