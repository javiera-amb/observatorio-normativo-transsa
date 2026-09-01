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


def test_chiguayante_actos_explican_todas_las_zonas_nuevas():
    plan = version_migration.plan_for(
        version_migration.load_migration_plans(MIGRATIONS), "CHIGUAYANTE"
    )
    result = version_migration.analyze_zone_migration(plan, LEGACY_CHIGUAYANTE)

    # Todo el universo vigente está explicado por continuidad de nomenclatura o actos
    # oficiales 2015/2018. Queda una fila legacy U2 cuyo destino no se debe adivinar.
    assert result["unexplained_current_zones"] == []
    assert result["unexplained_legacy_zones"] == ["U2"]
    assert result["structurally_explained"] is False


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


def test_migracion_no_autoriza_codigo_prc_inventado():
    plan = version_migration.plan_for(
        version_migration.load_migration_plans(MIGRATIONS), "Chiguayante"
    )
    result = version_migration.analyze_zone_migration(plan, LEGACY_CHIGUAYANTE)
    assert result["spatial_code_mapping_pending"] is True
    assert all(
        item["requires_spatial_code_mapping"]
        for item in result["transformations"]
    )
