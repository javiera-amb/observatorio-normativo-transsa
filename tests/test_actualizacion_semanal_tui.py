from __future__ import annotations

import importlib.util
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_workflow_semanal_ejecuta_pipeline_incremental():
    workflow = (ROOT / ".github" / "workflows" / "actualizar-ipt.yml").read_text(encoding="utf-8")
    assert 'cron: "0 7 * * 1"' in workflow
    assert "scripts/sincronizar_portal_ipt.py" in workflow
    assert "automation/actualizar_ipt_semanal.py" in workflow
    assert "scripts/refrescar_seguimiento_publico.py" in workflow
    assert "automation/actualizar_ipt_mensual.py" not in workflow


def test_revision_semanal_trabaja_mes_corriente():
    module = load_module(ROOT / "automation" / "actualizar_ipt_semanal.py", "actualizar_ipt_semanal_test")
    assert module.current_month_start(date(2026, 8, 31)) == date(2026, 8, 1)
    assert module.parse_iso_date("2026-08-31") == date(2026, 8, 31)
    assert module.parse_iso_date("") is None


def test_seguimiento_publico_no_aprueba_desde_fuentes():
    source = (ROOT / "scripts" / "refrescar_seguimiento_publico.py").read_text(encoding="utf-8")
    assert '"apto_para_visor": "REVISAR"' in source
    assert '"frecuencia_objetivo_dias": 7' in source
    assert '"ultima_revision_normativa"' in source
    assert "Nuevo instrumento vigente detectado" in source
