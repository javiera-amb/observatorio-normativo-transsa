import json
from pathlib import Path

from automation.tablas_normativas import version_migration


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "config" / "tablas_normativas_migraciones"


LEGACY_CHIGUAYANTE = {
    "U4", "U5", "U6", "U7", "EU-3", "U8-1", "U1-A", "U1-B", "U2-A", "U2-B",
    "U3-A", "U3-B", "EU-1", "EU-2", "EU-4", "EU-5", "U2", "VNR", "ZM", "AV",
    "R3", "R4", "R5", "R6", "U8-2", "U8-3", "ZI", "RI", "R1", "R2", "PR", "RD", "VN",
}


def test_chiguayante_es_migracion_de_version_y_no_publicable():
    plans = version_migration.load_migration_plans(MIGRATIONS)
    plan = version_migration.plan_for(plans, "Chiguayante")
    assert plan is not None

    result = version_migration.analyze_zone_migration(plan, LEGACY_CHIGUAYANTE)
    assert result["mode"] == "VERSION_MIGRATION"
    assert result["migration_required"] is True
    assert result["publicable"] is False
    assert result["state"] == "MIGRACIÓN NORMATIVA REQUERIDA"
    assert result["legacy_zone_count"] == 33
    assert result["current_zone_count"] == 38


def test_chiguayante_migracion_queda_estructuralmente_explicada():
    plan = version_migration.plan_for(
        version_migration.load_migration_plans(MIGRATIONS), "CHIGUAYANTE"
    )
    result = version_migration.analyze_zone_migration(plan, LEGACY_CHIGUAYANTE)

    assert result["unexplained_current_zones"] == []
    assert result["unexplained_legacy_zones"] == []
    assert result["structurally_explained"] is True
    retired = {item["legacy_zone"]: item for item in result["retired_legacy_zones"]}
    assert retired["U2"]["treatment"] == "PRESERVAR_EN_ORIGINAL_EXCLUIR_DE_VERSION_VIGENTE"


def test_chiguayante_registra_splits_oficiales_clave():
    path = MIGRATIONS / "chiguayante.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    transformations = payload["transformaciones_zona"]

    def current_for(legacy):
        for item in transformations:
            if legacy in item["legacy_zones"]:
                return set(item["current_zones"])
        return set()

    assert current_for("ZI") == {"ZIa", "ZIb"}
    assert current_for("R2") == {"ZR2a", "ZR2b", "ZR2c"}
    assert {"ZU2-A1", "ZU2-A2"}.issubset(current_for("U2-A"))
    assert "ZR1-A" in current_for("R1")
    assert "ZRE" in current_for("RD")


def test_migracion_no_reescribe_codigos_existentes():
    plan = version_migration.plan_for(
        version_migration.load_migration_plans(MIGRATIONS), "Chiguayante"
    )
    result = version_migration.analyze_zone_migration(plan, LEGACY_CHIGUAYANTE)
    assert result["spatial_code_mapping_pending"] is True
    assert all(
        item["requires_spatial_code_mapping"]
        for item in result["transformations"]
    )
