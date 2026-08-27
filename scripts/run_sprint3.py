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
    run("-m", "unittest", "discover", "-s", "tests", "-v")
    run("automation/validar_sitio.py")
    run("scripts/test_ollama_connection.py")
    print("\nSPRINT 3 EJECUTADO CORRECTAMENTE.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
