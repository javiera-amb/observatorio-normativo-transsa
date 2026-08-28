import unittest

from automation.tablas_normativas.engine import FIELDS
from automation.tablas_normativas.engine_v2 import audit_table


class TablasNormativasEngineV2Tests(unittest.TestCase):
    def row(self, **updates):
        row = {field: "" for field in FIELDS}
        row.update({
            "COMUNA": "PEÑALOLÉN",
            "RIALCOMSII": "15152",
            "CODIGO_PRC": "15152-I.E",
            "ZONA": "I.E",
            "SUB_PREDIAL": "800",
            "CONSTRUCCION": "1.5",
            "OCUPACION": "0.7",
            "ESPECIF_GENERAL": "EQUIPAMIENTO - INFRAESTRUCTURA",
            "ESPECIF_ESPECIF": "EQUIPAMIENTO",
        })
        row.update(updates)
        return row

    def test_regla_condicional_solo_aplica_a_fila_que_cumple_where(self):
        rules = {"conditional_rules": [{
            "id": "ie-800",
            "comuna": "PEÑALOLÉN",
            "where": {"ZONA": "I.E", "SUB_PREDIAL": "800"},
            "field": "ESPECIF_GENERAL",
            "original": "EQUIPAMIENTO - INFRAESTRUCTURA",
            "corrected": "ACTIVIDADES PRODUCTIVAS - INFRAESTRUCTURA",
            "confidence": "ALTA",
            "auto_apply": True,
            "source": "Ficha oficial Zona I.E.",
        }]}
        rows = [self.row(), self.row(ZONA="R3", SUB_PREDIAL="800")]
        result = audit_table(FIELDS.copy(), rows, {"exact_rules": []}, rules)
        self.assertEqual(result["rows"][0]["ESPECIF_GENERAL"], "ACTIVIDADES PRODUCTIVAS - INFRAESTRUCTURA")
        self.assertEqual(result["rows"][1]["ESPECIF_GENERAL"], "EQUIPAMIENTO - INFRAESTRUCTURA")
        matches = [f for f in result["findings"] if f.get("rule_id") == "ie-800"]
        self.assertEqual(len(matches), 1)

    def test_comparacion_where_tolera_numero_y_texto(self):
        rules = {"conditional_rules": [{
            "id": "sm2-construct",
            "comuna": "PEÑALOLÉN",
            "where": {"ZONA": "SM-2", "SUB_PREDIAL": 600},
            "field": "CONSTRUCCION",
            "original": 21.4,
            "corrected": 1.4,
            "confidence": "ALTA",
            "auto_apply": True,
        }]}
        row = self.row(ZONA="SM-2", SUB_PREDIAL="600", CONSTRUCCION="21,4")
        result = audit_table(FIELDS.copy(), [row], {"exact_rules": []}, rules)
        self.assertEqual(result["rows"][0]["CONSTRUCCION"], 1.4)


if __name__ == "__main__":
    unittest.main()
