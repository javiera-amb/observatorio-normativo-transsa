from __future__ import annotations

import unittest

from automation.tablas_normativas import certification, vigencia_gate


class VigenciaNacionalTests(unittest.TestCase):
    def base_tracking(self, acts=None):
        acts = list(acts or [])
        return {
            "comuna": "Comuna Prueba",
            "version_normativa_id": "norm-prueba-1",
            "actos_posteriores": len(acts),
            "actos_posteriores_detalle": acts,
            "candidatos_normativos_detalle": [],
        }

    def base_table(self):
        return {
            "comuna": "Comuna Prueba",
            "estado": "LISTA PARA STAGING",
            "cobertura_fuentes": "COMPLETA",
            "hallazgos_bloqueantes": 0,
        }

    def evidence(self, acts):
        return {
            "comuna": "Comuna Prueba",
            "version_normativa_id": "norm-prueba-1",
            "actos_aplicados": acts,
            "checks": {
                "actos_posteriores_verificados": True,
                "actos_posteriores_aplicados_tabla": True,
                "actos_posteriores_aplicados_sig": True,
                "texto_vigente_verificado": True,
                "version_normativa_coincidente": True,
            },
        }

    def test_sin_actos_puede_certificar_con_tabla_y_sig(self):
        ok, blockers, cert = certification._assessment_reason(
            "Comuna Prueba",
            self.base_tracking(),
            self.base_table(),
            {"apto_para_visor": "SI"},
            None,
        )
        self.assertTrue(ok)
        self.assertEqual([], blockers)
        self.assertEqual([], cert["actos_aplicados"])

    def test_con_actos_no_certifica_sin_evidencia(self):
        tracking = self.base_tracking([
            {"official_id": "acto-1", "fecha": "2026-01-01"}
        ])
        ok, blockers, cert = certification._assessment_reason(
            "Comuna Prueba",
            tracking,
            self.base_table(),
            {"apto_para_visor": "REVISAR"},
            None,
        )
        self.assertFalse(ok)
        self.assertIsNone(cert)
        self.assertTrue(any("evidencia explícita" in item for item in blockers))

    def test_con_actos_certifica_solo_si_evidencia_es_exacta(self):
        tracking = self.base_tracking([
            {"official_id": "acto-1", "fecha": "2026-01-01"},
            {"official_id": "acto-2", "fecha": "2026-02-01"},
        ])
        ok, blockers, cert = certification._assessment_reason(
            "Comuna Prueba",
            tracking,
            self.base_table(),
            {"apto_para_visor": "REVISAR"},
            self.evidence(["acto-1", "acto-2"]),
        )
        self.assertTrue(ok)
        self.assertEqual([], blockers)
        self.assertEqual(["acto-1", "acto-2"], cert["actos_aplicados"])

    def test_gate_bloquea_certificado_de_otra_version(self):
        tracking = self.base_tracking()
        certificate = {
            "comuna": "Comuna Prueba",
            "version_normativa_id": "norm-antigua",
            "fecha_revision": "2099-01-01",
            "actos_aplicados": [],
            "checks": {},
        }
        policy = {
            "max_review_age_days": 99999,
            "required_checks": [],
        }
        assessment = vigencia_gate.evaluate(
            "Comuna Prueba", tracking, certificate, policy
        )
        self.assertFalse(assessment["vigencia_certificada"])
        self.assertTrue(
            any(
                "versión normativa" in item.lower()
                for item in assessment["bloqueantes_vigencia"]
            )
        )


if __name__ == "__main__":
    unittest.main()
