import tempfile
import unittest
from pathlib import Path

from openpyxl import load_workbook

from automation.tablas_normativas.engine import FIELDS, audit_table, process_file


class TablasNormativasEngineTests(unittest.TestCase):
    def base_row(self):
        row = {field: "" for field in FIELDS}
        row.update({
            "COMUNA": "PRUEBA",
            "RIALCOMSII": "99999",
            "CODIGO_PRC": "Z1",
            "ZONA": "Z1",
            "CONSTRUCCION": "0,8",
            "OCUPACION": "0,6",
            "PISOS_MAX": 4,
            "ALTURA_MIN": 3,
            "ALTURA_MAX": 12,
            "AGRUPAMIENTO": "pareado / aislado",
        })
        return row

    def test_preserva_exactamente_35_campos_y_normaliza_formato(self):
        row = self.base_row()
        result = audit_table(FIELDS.copy(), [row])
        self.assertEqual(list(result["rows"][0].keys()), FIELDS)
        self.assertEqual(result["rows"][0]["CONSTRUCCION"], 0.8)
        self.assertEqual(result["rows"][0]["AGRUPAMIENTO"], "AISLADO; PAREADO")
        self.assertTrue(any(f["status"] == "NORMALIZACIÓN DE FORMATO" for f in result["findings"]))

    def test_no_corrige_ocr_sin_fuente(self):
        row = self.base_row()
        row["CONSTRUCCION"] = "P.2"
        result = audit_table(FIELDS.copy(), [row])
        self.assertEqual(result["rows"][0]["CONSTRUCCION"], "P.2")
        self.assertTrue(any(f["field"] == "CONSTRUCCION" and f["status"] == "POSIBLE ERROR" for f in result["findings"]))

    def test_regla_fuente_especifica_puede_autocorregir(self):
        row = self.base_row()
        row["COMUNA"] = "Puerto Octay"
        row["CONSTRUCCION"] = "P.2"
        catalog = {"exact_rules": [{
            "id": "test-octay",
            "comuna": "Puerto Octay",
            "field": "CONSTRUCCION",
            "original": "P.2",
            "corrected": 0.2,
            "confidence": "ALTA",
            "auto_apply": True,
            "source": "Ordenanza oficial",
            "page": 10,
            "reason": "Regla de prueba respaldada por fuente."
        }]}
        result = audit_table(FIELDS.copy(), [row], catalog)
        self.assertEqual(result["rows"][0]["CONSTRUCCION"], 0.2)
        finding = next(f for f in result["findings"] if f["rule_id"] == "test-octay")
        self.assertEqual(finding["source"], "Ordenanza oficial")
        self.assertEqual(finding["page"], "10")

    def test_process_file_genera_normalizada_qa_y_status(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            csv_path = root / "PRC_PRUEBA_35_CAMPOS.csv"
            csv_path.write_text(
                ",".join(FIELDS) + "\n" + ",".join(str(self.base_row().get(f, "")) for f in FIELDS) + "\n",
                encoding="utf-8",
            )
            result = process_file(csv_path, root / "normalizadas", root / "qa")
            self.assertTrue(Path(result["normalized_path"]).exists())
            self.assertTrue(Path(result["qa_path"]).exists())
            self.assertTrue(Path(result["status_path"]).exists())
            wb = load_workbook(result["normalized_path"], read_only=True)
            headers = [cell.value for cell in next(wb.active.iter_rows(max_row=1))]
            self.assertEqual(headers, FIELDS)


if __name__ == "__main__":
    unittest.main()
