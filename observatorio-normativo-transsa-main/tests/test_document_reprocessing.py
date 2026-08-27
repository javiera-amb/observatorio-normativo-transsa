from __future__ import annotations

import copy
import sqlite3
import tempfile
import unittest
from pathlib import Path

from core.database import initialize_database, upsert_events
from core.ingest import build_events


BASE_EVENT = {
    "event_type": "environmental_assessment",
    "title": "Participación ciudadana de un proyecto urbano de prueba",
    "event_date": "2026-08-05",
    "published_at": "2026-08-05",
    "summary": "Se abrió una etapa de participación ciudadana.",
    "why_it_matters": "El proyecto puede generar efectos territoriales.",
    "practical_implications": "Corresponde monitorear el procedimiento.",
    "impacted_parties": "Comunidad, titular y autoridades.",
    "recommended_action": "Monitorear.",
    "recommended_action_code": "monitor",
    "relevance_level": "medium",
    "impact_level": "medium",
    "confidence": 0.9,
    "review_status": "preliminary",
    "category": "evaluacion_ambiental",
    "topics": ["evaluacion_ambiental"],
    "territory": {
        "scale": "communal",
        "country": "Chile",
        "region": "Región Metropolitana de Santiago",
        "commune": "Colina",
    },
    "source": {
        "source_name": "Diario Oficial de la República de Chile",
        "source_type": "official",
        "external_id": "CVE-PRUEBA-001",
        "url": "https://example.com/documento-oficial-001.pdf",
        "document_type": "Publicación oficial",
    },
}


class DocumentReprocessingTests(unittest.TestCase):
    def test_same_url_reuses_document_identity_when_issuer_changes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "tui.sqlite3"
            initialize_database(db)

            first = build_events([copy.deepcopy(BASE_EVENT)], strict=True)[0]
            first_document_id = first.source.document_id
            self.assertEqual(upsert_events(db, [first]), (1, 0))

            revised_payload = copy.deepcopy(BASE_EVENT)
            revised_payload["source"]["source_name"] = (
                "Servicio de Evaluación Ambiental de la Región Metropolitana"
            )
            revised_payload["source"]["document_type"] = "Resolución exenta"
            revised_payload["source"]["document_number"] = "202613001215"
            revised = build_events([revised_payload], strict=True)[0]

            # El ID calculado cambia por la mejora institucional, pero el upsert
            # debe reconocer que la URL corresponde al mismo documento.
            self.assertNotEqual(revised.source.document_id, first_document_id)
            self.assertEqual(upsert_events(db, [revised]), (0, 1))
            self.assertEqual(revised.source.document_id, first_document_id)

            # sqlite3.Connection como context manager confirma o revierte la
            # transacción, pero no cierra la conexión. En Windows eso mantiene
            # bloqueado el archivo temporal y provoca WinError 32 al salir de
            # TemporaryDirectory. Se cierra explícitamente en finally.
            conn = sqlite3.connect(db)
            try:
                count = conn.execute(
                    "SELECT COUNT(*) FROM source_documents WHERE url = ?",
                    (BASE_EVENT["source"]["url"],),
                ).fetchone()[0]
                source_name = conn.execute(
                    """
                    SELECT s.name
                    FROM source_documents d
                    JOIN sources s ON s.source_id = d.source_id
                    WHERE d.url = ?
                    """,
                    (BASE_EVENT["source"]["url"],),
                ).fetchone()[0]
            finally:
                conn.close()

            self.assertEqual(count, 1)
            self.assertEqual(
                source_name,
                "Servicio de Evaluación Ambiental de la Región Metropolitana",
            )


if __name__ == "__main__":
    unittest.main()
