import json
import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from automation.tablas_normativas.engine import FIELDS
from automation.tablas_normativas.runner import _master_index, _repair_approved_missing_fields


class TablasNormativasMasterResolutionV2Tests(unittest.TestCase):
    def _row(self, code: str):
        row = {field: "" for field in FIELDS}
        row.update({
            "COMUNA": "VIÑA DEL MAR",
            "RIALCOMSII": 5302,
            "CODIGO_PRC": code,
            "ZONA": code,
            "SUB_PREDIAL": 500,
            "CONSTRUCCION": 1,
        })
        return row

    def test_hojas_equivalentes_no_bloquean_y_prefiere_la_mas_limpia(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "PRC_SQL2.xlsx"
            workbook = Workbook()
            clean = workbook.active
            clean.title = "PRC_VIÑA"
            clean_headers = [*FIELDS, "TIPO_VARIANTE", "MOTIVO_VARIANTE"]
            clean.append(clean_headers)
            for code in ["5302-Z2", "5302-Z1"]:
                row = self._row(code)
                clean.append([row.get(field, "") for field in clean_headers])

            exported = workbook.create_sheet("Hoja42")
            exported_headers = ["COMUNA_EXPORTADA", "RIALCOMSII_EXPORTADO", *clean_headers]
            exported.append(exported_headers)
            for code in ["5302-Z1", "5302-Z2"]:
                row = self._row(code)
                exported.append(["VIÑA DEL MAR", "5302", *[row.get(field, "") for field in clean_headers]])
            workbook.save(path)

            item = _master_index(path)["VINADELMAR"]
            self.assertEqual(item["sheet"], "PRC_VIÑA")
            self.assertEqual(item["duplicates"], [])
            self.assertEqual(set(item["equivalent_sheets"]), {"PRC_VIÑA", "Hoja42"})

    def test_reparacion_aprobada_agrega_campo_vacio_sin_cambiar_filas(self):
        headers = [field for field in FIELDS if field != "OCUPACION_SUP"]
        rows = [{field: "VALOR" for field in headers} for _ in range(3)]
        repaired_headers, repaired_rows = _repair_approved_missing_fields(
            headers, rows, ["OCUPACION_SUP"]
        )
        self.assertEqual(repaired_headers[:len(FIELDS)], FIELDS)
        self.assertEqual(len(repaired_rows), 3)
        self.assertTrue(all(row["OCUPACION_SUP"] == "" for row in repaired_rows))

    def test_config_estructura_registra_renca_sin_inventar_valor(self):
        config = json.loads(Path("config/tablas_normativas_estructura.json").read_text(encoding="utf-8"))
        renca = config["por_comuna"]["RENCA"]
        self.assertEqual(renca["campos_faltantes_reparables"], ["OCUPACION_SUP"])
        self.assertEqual(renca["accion"], "AGREGAR_VACIO_EN_SALIDA_DE_TRABAJO")
        self.assertTrue(renca["requiere_fuente_para_publicar"])


if __name__ == "__main__":
    unittest.main()
