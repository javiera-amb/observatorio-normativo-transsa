from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable, Iterator

from .ids import actor_id, project_id, segment_id, territory_id, topic_id
from .models import CanonicalEvent, TerritoryReference

SCHEMA_VERSION = 2

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
    source_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'official',
    base_url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    collection_method TEXT,
    reliability_level TEXT NOT NULL DEFAULT 'primary',
    terms_notes TEXT
);

CREATE TABLE IF NOT EXISTS source_documents (
    document_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    external_id TEXT,
    title TEXT NOT NULL,
    published_at TEXT,
    captured_at TEXT NOT NULL,
    url TEXT,
    local_path TEXT,
    mime_type TEXT,
    sha256 TEXT,
    raw_text_path TEXT,
    status TEXT NOT NULL DEFAULT 'migrated',
    error_message TEXT,
    edition TEXT,
    document_type TEXT,
    document_number TEXT,
    FOREIGN KEY (source_id) REFERENCES sources(source_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_source_documents_url
ON source_documents(url) WHERE url IS NOT NULL AND url <> '';

CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    published_at TEXT,
    summary TEXT NOT NULL,
    why_it_matters TEXT,
    practical_implications TEXT,
    impacted_parties TEXT,
    recommended_action TEXT,
    recommended_action_code TEXT NOT NULL DEFAULT 'other',
    requires_review_reason TEXT,
    relevance_level TEXT NOT NULL,
    impact_level TEXT,
    confidence REAL,
    review_status TEXT NOT NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    validated_at TEXT,
    validated_by TEXT,
    legacy_payload_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_review ON events(review_status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_relevance ON events(relevance_level);

CREATE TABLE IF NOT EXISTS event_documents (
    event_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'primary',
    PRIMARY KEY (event_id, document_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES source_documents(document_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS territories (
    territory_id TEXT PRIMARY KEY,
    territory_type TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT,
    codigo_ine TEXT,
    codigo_sii TEXT,
    geometry_ref TEXT,
    UNIQUE (territory_type, name, parent_id),
    FOREIGN KEY (parent_id) REFERENCES territories(territory_id)
);

CREATE TABLE IF NOT EXISTS event_territories (
    event_id TEXT NOT NULL,
    territory_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'direct',
    is_primary INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, territory_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (territory_id) REFERENCES territories(territory_id)
);

CREATE TABLE IF NOT EXISTS topics (
    topic_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    family TEXT
);

CREATE TABLE IF NOT EXISTS event_topics (
    event_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    confidence REAL,
    assigned_by TEXT NOT NULL DEFAULT 'manual',
    PRIMARY KEY (event_id, topic_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
);

CREATE TABLE IF NOT EXISTS market_segments (
    segment_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS event_market_segments (
    event_id TEXT NOT NULL,
    segment_id TEXT NOT NULL,
    PRIMARY KEY (event_id, segment_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES market_segments(segment_id)
);

CREATE TABLE IF NOT EXISTS actors (
    actor_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    actor_type TEXT
);

CREATE TABLE IF NOT EXISTS event_actors (
    event_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'mentioned',
    PRIMARY KEY (event_id, actor_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id)
);

CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_territory TEXT,
    UNIQUE(name, primary_territory)
);

CREATE TABLE IF NOT EXISTS event_projects (
    event_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'mentioned',
    PRIMARY KEY (event_id, project_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE IF NOT EXISTS event_tags (
    event_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (event_id, tag),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_relations (
    from_event_id TEXT NOT NULL,
    to_event_id TEXT NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'related',
    PRIMARY KEY (from_event_id, to_event_id, relation_type),
    FOREIGN KEY (from_event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    report_id TEXT PRIMARY KEY,
    report_type TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT,
    word_path TEXT,
    markdown_path TEXT,
    json_path TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    validated_at TEXT
);

CREATE TABLE IF NOT EXISTS report_events (
    report_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (report_id, event_id),
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS review_history (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    notes TEXT,
    snapshot_json TEXT,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id TEXT PRIMARY KEY,
    pipeline_name TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    documents_discovered INTEGER NOT NULL DEFAULT 0,
    events_created INTEGER NOT NULL DEFAULT 0,
    events_updated INTEGER NOT NULL DEFAULT 0,
    errors_count INTEGER NOT NULL DEFAULT 0,
    rules_version TEXT,
    model_name TEXT,
    commit_hash TEXT,
    details_json TEXT
);
"""


@contextmanager
def connect(database_path: Path) -> Iterator[sqlite3.Connection]:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _column_names(conn: sqlite3.Connection, table: str) -> set[str]:
    return {str(row[1]) for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    if column not in _column_names(conn, table):
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def initialize_database(database_path: Path) -> None:
    with connect(database_path) as conn:
        conn.executescript(SCHEMA_SQL)
        # Migración no destructiva desde el esquema v1.
        _ensure_column(conn, "events", "recommended_action_code", "TEXT NOT NULL DEFAULT 'other'")
        _ensure_column(conn, "events", "requires_review_reason", "TEXT")
        conn.execute(
            "INSERT OR REPLACE INTO schema_meta(key, value) VALUES('schema_version', ?)",
            (str(SCHEMA_VERSION),),
        )


def _upsert_territory(
    conn: sqlite3.Connection,
    territory_type: str,
    name: str,
    parent_id: str | None,
    codigo_ine: str = "",
    codigo_sii: str = "",
) -> str:
    tid = territory_id(territory_type, name, parent_id or "")
    conn.execute(
        """
        INSERT INTO territories(territory_id, territory_type, name, parent_id, codigo_ine, codigo_sii)
        VALUES(?, ?, ?, ?, ?, ?)
        ON CONFLICT(territory_id) DO UPDATE SET
          territory_type=excluded.territory_type,
          name=excluded.name,
          parent_id=excluded.parent_id,
          codigo_ine=CASE WHEN excluded.codigo_ine <> '' THEN excluded.codigo_ine ELSE territories.codigo_ine END,
          codigo_sii=CASE WHEN excluded.codigo_sii <> '' THEN excluded.codigo_sii ELSE territories.codigo_sii END
        """,
        (tid, territory_type, name, parent_id, codigo_ine, codigo_sii),
    )
    return tid


def _territory_leaf(conn: sqlite3.Connection, territory: TerritoryReference) -> str:
    parent = _upsert_territory(conn, "country", territory.country or "Chile", None)
    leaf = parent
    if territory.region:
        leaf = _upsert_territory(conn, "region", territory.region, parent)
        parent = leaf
    if territory.province:
        leaf = _upsert_territory(conn, "province", territory.province, parent)
        parent = leaf
    if territory.commune:
        leaf = _upsert_territory(
            conn,
            "commune",
            territory.commune,
            parent,
            territory.codigo_ine,
            territory.codigo_sii,
        )
        parent = leaf
    if territory.locality:
        leaf = _upsert_territory(conn, "locality", territory.locality, parent)
    return leaf


def _primary_territory_name(event: CanonicalEvent) -> str:
    territory = event.territory
    return territory.commune or territory.province or territory.region or territory.country


def _reuse_existing_document_identity(
    conn: sqlite3.Connection, event: CanonicalEvent
) -> None:
    """Reutiliza la identidad existente de un documento al reprocesarlo.

    ``source_documents.url`` es única. El análisis puede mejorar entre versiones
    y cambiar campos descriptivos usados para construir ``document_id`` (por
    ejemplo, pasar de la fuente de publicación al organismo emisor). Cuando la
    URL oficial ya existe, el documento es el mismo y debe conservar su
    ``document_id`` histórico.

    Como respaldo, también se reutiliza un ``external_id`` cuando identifica de
    forma inequívoca a un único documento. Esto hace el reprocesamiento
    idempotente sin borrar ni duplicar registros.
    """
    url = (event.source.url or "").strip()
    existing_document_id = ""

    if url:
        row = conn.execute(
            "SELECT document_id FROM source_documents WHERE url = ?",
            (url,),
        ).fetchone()
        if row:
            existing_document_id = str(row["document_id"])

    if not existing_document_id:
        external_id = (event.source.external_id or "").strip()
        if external_id:
            rows = conn.execute(
                "SELECT document_id FROM source_documents WHERE external_id = ? LIMIT 2",
                (external_id,),
            ).fetchall()
            if len(rows) == 1:
                existing_document_id = str(rows[0]["document_id"])

    if existing_document_id:
        event.source.document_id = existing_document_id


def upsert_event(conn: sqlite3.Connection, event: CanonicalEvent) -> None:
    _reuse_existing_document_identity(conn, event)

    conn.execute(
        """
        INSERT INTO sources(
          source_id, name, source_type, base_url, active,
          collection_method, reliability_level
        ) VALUES(?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(source_id) DO UPDATE SET
          name=excluded.name,
          source_type=excluded.source_type,
          base_url=excluded.base_url,
          collection_method=excluded.collection_method,
          reliability_level=excluded.reliability_level
        """,
        (
            event.source.source_id,
            event.source.source_name,
            event.source.source_type,
            event.source.base_url or None,
            event.source.collection_method,
            event.source.reliability_level,
        ),
    )

    conn.execute(
        """
        INSERT INTO source_documents(
          document_id, source_id, external_id, title, published_at, captured_at,
          url, local_path, mime_type, raw_text_path, status, edition,
          document_type, document_number
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processed', ?, ?, ?)
        ON CONFLICT(document_id) DO UPDATE SET
          source_id=excluded.source_id,
          external_id=excluded.external_id,
          title=excluded.title,
          published_at=excluded.published_at,
          captured_at=excluded.captured_at,
          url=excluded.url,
          local_path=excluded.local_path,
          mime_type=excluded.mime_type,
          raw_text_path=excluded.raw_text_path,
          edition=excluded.edition,
          document_type=excluded.document_type,
          document_number=excluded.document_number
        """,
        (
            event.source.document_id,
            event.source.source_id,
            event.source.external_id,
            event.source.title,
            event.source.published_at,
            event.source.captured_at,
            event.source.url or None,
            event.source.local_path or None,
            event.source.mime_type or None,
            event.source.raw_text_path or None,
            event.source.edition,
            event.source.document_type,
            event.source.document_number,
        ),
    )

    conn.execute(
        """
        INSERT INTO events(
          event_id, event_type, title, event_date, published_at, summary,
          why_it_matters, practical_implications, impacted_parties,
          recommended_action, recommended_action_code, requires_review_reason,
          relevance_level, impact_level, confidence, review_status, is_featured,
          category, version, created_at, updated_at, validated_at, validated_by,
          legacy_payload_json
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_id) DO UPDATE SET
          event_type=excluded.event_type,
          title=excluded.title,
          event_date=excluded.event_date,
          published_at=excluded.published_at,
          summary=excluded.summary,
          why_it_matters=excluded.why_it_matters,
          practical_implications=excluded.practical_implications,
          impacted_parties=excluded.impacted_parties,
          recommended_action=excluded.recommended_action,
          recommended_action_code=excluded.recommended_action_code,
          requires_review_reason=excluded.requires_review_reason,
          relevance_level=excluded.relevance_level,
          impact_level=excluded.impact_level,
          confidence=excluded.confidence,
          review_status=excluded.review_status,
          is_featured=excluded.is_featured,
          category=excluded.category,
          version=excluded.version,
          updated_at=excluded.updated_at,
          validated_at=excluded.validated_at,
          validated_by=excluded.validated_by,
          legacy_payload_json=excluded.legacy_payload_json
        """,
        (
            event.event_id,
            event.event_type,
            event.title,
            event.event_date,
            event.published_at,
            event.summary,
            event.why_it_matters,
            event.practical_implications,
            event.impacted_parties,
            event.recommended_action,
            event.recommended_action_code,
            event.requires_review_reason,
            event.relevance_level,
            event.impact_level,
            event.confidence,
            event.review_status,
            int(event.is_featured),
            event.category,
            event.version,
            event.created_at,
            event.updated_at,
            event.validated_at,
            event.validated_by,
            json.dumps(event.legacy_payload, ensure_ascii=False),
        ),
    )

    conn.execute(
        "INSERT OR REPLACE INTO event_documents(event_id, document_id, relationship_type) VALUES(?, ?, 'primary')",
        (event.event_id, event.source.document_id),
    )

    # Las asociaciones derivadas se reconstruyen en cada importación para evitar residuos.
    for table in (
        "event_territories",
        "event_topics",
        "event_market_segments",
        "event_actors",
        "event_projects",
        "event_tags",
    ):
        conn.execute(f"DELETE FROM {table} WHERE event_id = ?", (event.event_id,))
    conn.execute("DELETE FROM event_relations WHERE from_event_id = ?", (event.event_id,))

    territories = event.all_territories()
    for index, territory in enumerate(territories):
        leaf_id = _territory_leaf(conn, territory)
        is_primary = territory.is_primary or index == 0
        conn.execute(
            """
            INSERT OR REPLACE INTO event_territories(
              event_id, territory_id, relationship_type, is_primary
            ) VALUES(?, ?, ?, ?)
            """,
            (event.event_id, leaf_id, territory.relationship_type, int(is_primary)),
        )

    topics = event.topics or [event.category]
    for topic in dict.fromkeys(item for item in topics if item):
        tid = topic_id(topic)
        family = event.topic_families.get(topic, "otros")
        assigned_by = "migration" if event.legacy_payload else "manual"
        conn.execute(
            "INSERT INTO topics(topic_id, name, family) VALUES(?, ?, ?) ON CONFLICT(topic_id) DO UPDATE SET name=excluded.name, family=excluded.family",
            (tid, topic, family),
        )
        conn.execute(
            "INSERT OR REPLACE INTO event_topics(event_id, topic_id, confidence, assigned_by) VALUES(?, ?, ?, ?)",
            (event.event_id, tid, event.confidence, assigned_by),
        )

    for segment in dict.fromkeys(event.market_segments):
        sid = segment_id(segment)
        conn.execute(
            "INSERT INTO market_segments(segment_id, name) VALUES(?, ?) ON CONFLICT(segment_id) DO UPDATE SET name=excluded.name",
            (sid, segment),
        )
        conn.execute(
            "INSERT OR REPLACE INTO event_market_segments(event_id, segment_id) VALUES(?, ?)",
            (event.event_id, sid),
        )

    for actor in dict.fromkeys(event.actors):
        aid = actor_id(actor)
        conn.execute(
            "INSERT INTO actors(actor_id, name) VALUES(?, ?) ON CONFLICT(actor_id) DO UPDATE SET name=excluded.name",
            (aid, actor),
        )
        conn.execute(
            "INSERT OR REPLACE INTO event_actors(event_id, actor_id, relationship_type) VALUES(?, ?, 'mentioned')",
            (event.event_id, aid),
        )

    primary_territory = _primary_territory_name(event)
    for project in dict.fromkeys(event.projects):
        pid = project_id(project, primary_territory)
        conn.execute(
            "INSERT INTO projects(project_id, name, primary_territory) VALUES(?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET name=excluded.name, primary_territory=excluded.primary_territory",
            (pid, project, primary_territory),
        )
        conn.execute(
            "INSERT OR REPLACE INTO event_projects(event_id, project_id, relationship_type) VALUES(?, ?, 'mentioned')",
            (event.event_id, pid),
        )

    for tag in dict.fromkeys(event.tags):
        conn.execute(
            "INSERT OR REPLACE INTO event_tags(event_id, tag) VALUES(?, ?)",
            (event.event_id, tag),
        )

    # Se registran solo relaciones cuyo evento destino ya existe. Las restantes
    # permanecen en el JSON canónico y se podrán resolver en una pasada posterior.
    for related_id in dict.fromkeys(event.related_event_ids):
        if conn.execute("SELECT 1 FROM events WHERE event_id = ?", (related_id,)).fetchone():
            conn.execute(
                "INSERT OR REPLACE INTO event_relations(from_event_id, to_event_id, relation_type) VALUES(?, ?, 'related')",
                (event.event_id, related_id),
            )


def upsert_events(database_path: Path, events: Iterable[CanonicalEvent]) -> tuple[int, int]:
    created = 0
    updated = 0
    with connect(database_path) as conn:
        for event in events:
            exists = conn.execute(
                "SELECT 1 FROM events WHERE event_id = ?", (event.event_id,)
            ).fetchone()
            upsert_event(conn, event)
            if exists:
                updated += 1
            else:
                created += 1
    return created, updated


def load_legacy_payloads(database_path: Path) -> list[dict]:
    with connect(database_path) as conn:
        rows = conn.execute(
            """
            SELECT legacy_payload_json
            FROM events
            WHERE legacy_payload_json IS NOT NULL
              AND legacy_payload_json <> '{}'
            ORDER BY event_date DESC, rowid ASC
            """
        ).fetchall()
    return [json.loads(row["legacy_payload_json"]) for row in rows]


def fetch_web_events(database_path: Path) -> list[dict]:
    """Entrega eventos listos para el portal sin exponer detalles internos de SQLite."""
    with connect(database_path) as conn:
        rows = conn.execute(
            """
            SELECT
              e.event_id, e.event_type, e.title, e.event_date, e.published_at,
              e.summary, e.why_it_matters, e.practical_implications,
              e.impacted_parties, e.recommended_action,
              e.recommended_action_code, e.requires_review_reason,
              e.relevance_level, e.impact_level, e.confidence,
              e.review_status, e.is_featured, e.category, e.version,
              s.name AS source_name, s.source_type,
              d.url AS source_url, d.document_type, d.document_number
            FROM events e
            LEFT JOIN event_documents ed ON ed.event_id = e.event_id AND ed.relationship_type = 'primary'
            LEFT JOIN source_documents d ON d.document_id = ed.document_id
            LEFT JOIN sources s ON s.source_id = d.source_id
            ORDER BY e.event_date DESC, e.is_featured DESC, e.title ASC
            """
        ).fetchall()

        result: list[dict] = []
        for row in rows:
            event_id = row["event_id"]
            territories = [
                dict(item)
                for item in conn.execute(
                    """
                    SELECT t.territory_type, t.name, et.relationship_type, et.is_primary
                    FROM event_territories et
                    JOIN territories t ON t.territory_id = et.territory_id
                    WHERE et.event_id = ?
                    ORDER BY et.is_primary DESC, t.territory_type
                    """,
                    (event_id,),
                ).fetchall()
            ]
            topics = [
                item[0]
                for item in conn.execute(
                    "SELECT t.name FROM event_topics et JOIN topics t ON t.topic_id=et.topic_id WHERE et.event_id=? ORDER BY t.name",
                    (event_id,),
                ).fetchall()
            ]
            segments = [
                item[0]
                for item in conn.execute(
                    "SELECT s.name FROM event_market_segments es JOIN market_segments s ON s.segment_id=es.segment_id WHERE es.event_id=? ORDER BY s.name",
                    (event_id,),
                ).fetchall()
            ]
            actors = [
                item[0]
                for item in conn.execute(
                    "SELECT a.name FROM event_actors ea JOIN actors a ON a.actor_id=ea.actor_id WHERE ea.event_id=? ORDER BY a.name",
                    (event_id,),
                ).fetchall()
            ]
            projects = [
                item[0]
                for item in conn.execute(
                    "SELECT p.name FROM event_projects ep JOIN projects p ON p.project_id=ep.project_id WHERE ep.event_id=? ORDER BY p.name",
                    (event_id,),
                ).fetchall()
            ]
            tags = [
                item[0]
                for item in conn.execute(
                    "SELECT tag FROM event_tags WHERE event_id=? ORDER BY tag",
                    (event_id,),
                ).fetchall()
            ]
            item = dict(row)
            item["is_featured"] = bool(item["is_featured"])
            item["territories"] = territories
            item["topics"] = topics
            item["market_segments"] = segments
            item["actors"] = actors
            item["projects"] = projects
            item["tags"] = tags
            result.append(item)
        return result


def count_records(database_path: Path, table: str) -> int:
    allowed = {
        "sources", "source_documents", "events", "event_documents", "territories",
        "event_territories", "topics", "event_topics", "market_segments",
        "event_market_segments", "actors", "event_actors", "projects",
        "event_projects", "event_tags", "event_relations", "reports",
        "report_events", "review_history", "pipeline_runs",
    }
    if table not in allowed:
        raise ValueError(f"Tabla no permitida: {table}")
    with connect(database_path) as conn:
        return int(conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])
