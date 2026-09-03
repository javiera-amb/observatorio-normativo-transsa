from __future__ import annotations

"""Sincronizador Portal IPT con navegación tolerante a cambios de interfaz.

Reutiliza toda la lógica de validación y exportación del sincronizador estable,
pero reemplaza únicamente la descarga Playwright. Evita depender de una frase
exacta del botón y deja diagnóstico útil si el portal cambia nuevamente.
"""

import re
from pathlib import Path

import sincronizar_portal_ipt as base


def robust_download_report(destination: Path) -> Path:
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Falta Playwright. Ejecuta: pip install playwright") from error

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(accept_downloads=True, locale="es-CL")
        page.goto(base.PORTAL_URL, wait_until="domcontentloaded", timeout=120_000)

        # El listado se hidrata del lado cliente. networkidle no siempre ocurre,
        # por lo que esperamos además la tabla y damos margen a la API del portal.
        try:
            page.wait_for_selector("table", timeout=45_000)
        except PlaywrightTimeoutError:
            pass
        try:
            page.wait_for_load_state("networkidle", timeout=30_000)
        except PlaywrightTimeoutError:
            pass
        page.wait_for_timeout(8_000)

        selectors = [
            page.get_by_role("button", name=re.compile(r"descarg|export", re.I)),
            page.get_by_role("link", name=re.compile(r"descarg|export", re.I)),
            page.locator('button[aria-label*="descarg" i], a[aria-label*="descarg" i], [role="button"][aria-label*="descarg" i]'),
            page.locator('button[title*="descarg" i], a[title*="descarg" i], [role="button"][title*="descarg" i]'),
            page.locator('a[download]'),
            page.locator("button, a, [role=button]").filter(has_text=re.compile(r"descarg|export", re.I)),
        ]

        targets = []
        seen = set()
        for locator in selectors:
            try:
                count = min(locator.count(), 10)
            except Exception:
                continue
            for index in range(count):
                candidate = locator.nth(index)
                try:
                    if not candidate.is_visible():
                        continue
                    signature = (
                        candidate.evaluate("el => el.tagName") or "",
                        candidate.inner_text(timeout=2_000) or "",
                        candidate.get_attribute("aria-label") or "",
                        candidate.get_attribute("title") or "",
                        candidate.get_attribute("href") or "",
                    )
                except Exception:
                    continue
                if signature in seen:
                    continue
                seen.add(signature)
                targets.append(candidate)

        errors: list[str] = []
        for target in targets:
            try:
                with page.expect_download(timeout=45_000) as download_info:
                    target.click(timeout=10_000)
                download_info.value.save_as(destination)
                browser.close()
                return destination
            except Exception as error:
                errors.append(type(error).__name__)

        # Diagnóstico sin exponer HTML completo: permite saber qué controles
        # ofrecía el portal el día de la falla.
        controls = page.locator("button, a, [role=button]")
        labels: list[str] = []
        try:
            for index in range(min(controls.count(), 40)):
                item = controls.nth(index)
                if not item.is_visible():
                    continue
                text = " | ".join(
                    value.strip()
                    for value in [
                        item.inner_text(timeout=1_000) or "",
                        item.get_attribute("aria-label") or "",
                        item.get_attribute("title") or "",
                    ]
                    if value and value.strip()
                )
                if text:
                    labels.append(text[:160])
        except Exception:
            pass

        body_text = ""
        try:
            body_text = page.locator("body").inner_text(timeout=3_000)
        except Exception:
            pass
        no_records = bool(re.search(r"0\s+registros|no se encontraron", body_text, re.I))
        browser.close()

        detail = "; ".join(labels[:12]) or "sin controles visibles identificables"
        suffix = " El portal mostró 0 registros." if no_records else ""
        raise RuntimeError(
            "No se pudo activar una descarga del Portal IPT con los selectores tolerantes. "
            f"Controles visibles: {detail}.{suffix} Intentos: {len(targets)}."
        )


base.download_report = robust_download_report

if __name__ == "__main__":
    raise SystemExit(base.main())
