from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
import unittest
import zlib
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PATTERN = re.compile(
    r'window\.ACTOS_IPT_GZ=\(window\.ACTOS_IPT_GZ\|\|""\)\+("(?:[^"\\]|\\.)*");'
)


def extract_part(path: Path) -> str:
    matches = PATTERN.findall(path.read_text(encoding="utf-8"))
    if not matches:
        raise AssertionError(f"Formato inválido: {path.name}")
    return "".join(json.loads(match) for match in matches)


class ActosIptPayloadTest(unittest.TestCase):
    def test_payload_nacional_es_integro_y_completo(self) -> None:
        parts = [DATA / f"actos_ipt_nacional_{index:02d}.js" for index in range(1, 11)]
        self.assertTrue(all(path.exists() for path in parts))

        encoded = "".join(extract_part(path) for path in parts)
        compressed = base64.b64decode(encoded, validate=True)
        payload = gzip.decompress(compressed)
        rows = json.loads(payload.decode("utf-8"))
        metadata = json.loads((DATA / "actos_ipt_sync.json").read_text(encoding="utf-8"))

        self.assertGreater(len(rows), 0)
        self.assertTrue(all(isinstance(row, list) and len(row) >= 17 for row in rows))
        self.assertEqual(len(rows), int(metadata["total"]))
        self.assertEqual(10, metadata["archivos_comprimidos"])
        self.assertEqual(hashlib.sha256(compressed).hexdigest(), metadata["sha256_payload_comprimido"])
        self.assertEqual(f"{zlib.crc32(payload) & 0xFFFFFFFF:08x}", metadata["crc32_json"])

        states = Counter(str(row[6]) for row in rows)
        types = Counter(str(row[11]) for row in rows)
        self.assertEqual(metadata["vigentes"], states["Vigente"])
        self.assertEqual(metadata["derogados"], states["Derogado"])
        self.assertEqual(metadata["en_desarrollo"], states["En Desarrollo"])
        self.assertEqual(metadata["enmiendas_inferidas"], types["Enmienda"])
        self.assertEqual(metadata["rectificaciones_inferidas"], types["Rectificación"])
        self.assertEqual(
            metadata["modificaciones_seccionales_inferidas"],
            types["Modificación mediante seccional"],
        )


if __name__ == "__main__":
    unittest.main()
