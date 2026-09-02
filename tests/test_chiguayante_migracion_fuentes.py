import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "config" / "tablas_normativas_migraciones" / "chiguayante.json"


class ChiguayanteMigracionFuentesTests(unittest.TestCase):
    def test_decreto_1033_tiene_fuente_y_fechas_propias(self):
        payload = json.loads(PLAN.read_text(encoding="utf-8"))
        actos = {item["id"]: item for item in payload["instrumentos"]}
        item = actos["CHIG-2024-DEC-1033"]
        self.assertEqual(item["fecha"], "2024-05-20")
        self.assertEqual(item["publicacion"], "2024-05-29")
        self.assertIn("1203864", item["source_url"])

    def test_migracion_bloquea_publicacion_hasta_mapeo_espacial(self):
        payload = json.loads(PLAN.read_text(encoding="utf-8"))
        rules = payload["reglas_publicacion"]
        self.assertTrue(rules["requiere_codigo_prc_espacial_demostrado"])
        self.assertTrue(rules["no_publicar_mientras_haya_unidades_sin_mapear"])
        transformations = payload["transformaciones_zona"]
        self.assertTrue(all(item["requires_spatial_code_mapping"] for item in transformations))


if __name__ == "__main__":
    unittest.main()
