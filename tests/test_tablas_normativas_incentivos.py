import unittest

from automation.tablas_normativas import engine as base
from automation.tablas_normativas import engine_v3


class TablasNormativasIncentivosTests(unittest.TestCase):
    def _row(self):
        row = {field: "" for field in base.FIELDS}
        row.update({
            "COMUNA": "CHIGUAYANTE",
            "RIALCOMSII": 8211,
            "CODIGO_PRC": "8211-U7",
            "ZONA": "U7",
            "ESPECIF_GENERAL": "RESIDENCIAL",
            "DENS_HAB_HA": 900,
            "INCENTIVO": "INCENTIVO 1 (VIVIENDA DE INTERES PUBLICO)",
        })
        return row

    def _catalog(self, allow=False):
        return {
            "source_checks": [{
                "id": "test-incentivo",
                "comuna": "CHIGUAYANTE",
                "where": {"ZONA": "U7", "ESPECIF_GENERAL": "RESIDENCIAL"},
                "expected": {"DENS_HAB_HA": 700},
                "auto_apply_fields": ["DENS_HAB_HA"],
                "confidence": "ALTA",
                "allow_incentive_override": allow,
                "source": "Fuente oficial de prueba",
                "reason": "Norma base de prueba",
            }],
            "review_rules": [],
            "coverage_checks": [],
        }

    def test_norma_base_no_sobrescribe_intensidad_con_incentivo(self):
        result = engine_v3.audit_table(
            base.FIELDS,
            [self._row()],
            source_catalog=self._catalog(False),
        )
        self.assertEqual(result["rows"][0]["DENS_HAB_HA"], 900)
        findings = [
            item for item in result["findings"]
            if item.get("rule_id") == "test-incentivo"
            and item.get("field") == "DENS_HAB_HA"
        ]
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["status"], "POSIBLE ERROR")
        self.assertEqual(findings[0]["confidence"], "MEDIA")

    def test_regla_especifica_puede_autorizar_override_de_incentivo(self):
        result = engine_v3.audit_table(
            base.FIELDS,
            [self._row()],
            source_catalog=self._catalog(True),
        )
        self.assertEqual(result["rows"][0]["DENS_HAB_HA"], 700)
        findings = [
            item for item in result["findings"]
            if item.get("rule_id") == "test-incentivo"
            and item.get("field") == "DENS_HAB_HA"
        ]
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["status"], "ERROR CONFIRMADO")


if __name__ == "__main__":
    unittest.main()
