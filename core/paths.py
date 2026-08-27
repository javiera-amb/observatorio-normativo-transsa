from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ProjectPaths:
    """Rutas estándar del repositorio.

    Todas las rutas se calculan desde la raíz del proyecto para que los scripts
    funcionen igual en Windows, Linux y GitHub Actions.
    """

    root: Path

    @classmethod
    def discover(cls, start: Path | None = None) -> "ProjectPaths":
        current = (start or Path(__file__)).resolve()
        if current.is_file():
            current = current.parent

        for candidate in [current, *current.parents]:
            if (candidate / "data" / "reportes.js").exists() and (candidate / "index.html").exists():
                return cls(candidate)

        raise FileNotFoundError(
            "No fue posible localizar la raíz del proyecto. "
            "Se esperaba encontrar data/reportes.js e index.html."
        )

    @property
    def legacy_reports_js(self) -> Path:
        return self.root / "data" / "reportes.js"

    @property
    def web_events_js(self) -> Path:
        return self.root / "data" / "eventos.js"

    @property
    def database(self) -> Path:
        return self.root / "data" / "db" / "tui.sqlite3"

    @property
    def events_dir(self) -> Path:
        return self.root / "data" / "events"

    @property
    def inbox_dir(self) -> Path:
        return self.root / "data" / "inbox"

    @property
    def exports_dir(self) -> Path:
        return self.root / "data" / "exports"

    @property
    def logs_dir(self) -> Path:
        return self.root / "data" / "logs"

    def ensure_runtime_directories(self) -> None:
        for path in (
            self.database.parent,
            self.events_dir,
            self.inbox_dir,
            self.exports_dir,
            self.logs_dir,
        ):
            path.mkdir(parents=True, exist_ok=True)
