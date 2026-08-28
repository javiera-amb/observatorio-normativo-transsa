import json
import unittest
from pathlib import Path

from automation.tablas_normativas.engine import FIELDS, load_rule_catalog
from automation.tablas_normativas.engine_v2 import audit_table


RULES_PATH = Path("config/tablas_normativas_condicionales.json")
EXACT_RULES_PATH = Path("config/tablas_normativas_reglas.json")


class PenalolenCorreccionesV3Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules = json.loads(RULES_PATH.read_text(encoding="utf-8"))
        cls.exact_rules = load_rule_catalog(EXACT_RULES_PATH)

    def row(self, **updates):
        row = {field: "" for field in FIELDS}
        row.update({"COMUNA": "PEÑALOLÉN", "RIALCOMSII": "15152"})
        row.update(updates)
        return row

    def test_eq_corrige_500_a_5000_solo_en_unidad_correspondiente(self):
        rows = [
            self.row(ZONA="EQ", SUB_PREDIAL="500", OCUPACION="0.1", CONSTRUCCION="0.2"),
            self.row(ZONA="EQ", SUB_PREDIAL="500", OCUPACION="0.15", CONSTRUCCION="0.2"),
        ]
        result = audit_table(FIELDS.copy(), rows, {"exact_rules": []}, self.rules)
        self.assertEqual(result["rows"][0]["SUB_PREDIAL"], 5000)
        self.assertEqual(result["rows"][1]["SUB_PREDIAL"], 500.0)
        self.assertEqual(result["input_rows"], 2)
        self.assertEqual(result["output_rows"], 2)

    def test_r11_corrige_codigo_sm1_solo_por_regla_explicita_autorizada(self):
        rows = [
            self.row(ZONA="R11", CODIGO_PRC="15152-SM-1"),
            self.row(ZONA="SM-1", CODIGO_PRC="15152-SM-1"),
        ]
        result = audit_table(FIELDS.copy(), rows, self.exact_rules, self.rules)
        self.assertEqual(result["rows"][0]["CODIGO_PRC"], "15152-R11")
        self.assertEqual(result["rows"][1]["CODIGO_PRC"], "15152-SM-1")

    def test_r10_normaliza_fecha_fuente_solo_para_r10(self):
        rows = [
            self.row(ZONA="R10", FUENTE="DIARIO OFICIAL 28.09.19"),
            self.row(ZONA="R10", FUENTE="DIARIO OFICIAL 28.09.20"),
            self.row(ZONA="R3", FUENTE="DIARIO OFICIAL 28.09.19"),
        ]
        result = audit_table(FIELDS.copy(), rows, {"exact_rules": []}, self.rules)
        self.assertEqual(result["rows"][0]["FUENTE"], "DIARIO OFICIAL 28.09.18")
        self.assertEqual(result["rows"][1]["FUENTE"], "DIARIO OFICIAL 28.09.18")
        self.assertEqual(result["rows"][2]["FUENTE"], "DIARIO OFICIAL 28.09.19")


if __name__ == "__main__":
    unittest.main()
