from __future__ import annotations

"""Sincronizador Portal IPT tolerante a cambios de interfaz.

Reutiliza la validación/exportación estable, pero reemplaza la descarga. Primero
lee el enlace CSV oficial que publica la propia interfaz del Portal IPT y pide
la clasificación Modificación con un tamaño de página suficiente para el
universo nacional. Si el endpoint cambia, conserva como respaldo los caminos de
Playwright (download, respuesta HTTP, data URL o blob generado en navegador).
"""

import base64
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests

import sincronizar_portal_ipt as base

API_HOST = "portalipt-api.minvu.cl"


def _save_browser_url(page, href: str, destination: Path) -> bool:
    if not href:
        return False
    try:
        if href.startswith("data:"):
            header, payload = href.split(",", 1)
            if ";base64" in header:
                destination.write_bytes(base64.b64decode(payload))
            else:
                from urllib.parse import unquote_to_bytes
                destination.write_bytes(unquote_to_bytes(payload))
            return destination.stat().st_size > 0

        if href.startswith("blob:"):
            data_url = page.evaluate(
                """async href => {
                    const response = await fetch(href);
                    const blob = await response.blob();
                    return await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(blob);
                    });
                }""",
                href,
            )
            if isinstance(data_url, str) and "," in data_url:
                destination.write_bytes(base64.b64decode(data_url.split(",", 1)[1]))
                return destination.stat().st_size > 0
    except Exception:
        return False
    return False


def _modifications_url(href: str) -> str | None:
    try:
        parts = urlsplit(href)
    except ValueError:
        return None
    if parts.hostname != API_HOST or not parts.path.rstrip("/").endswith("/instrumentos"):
        return None

    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update({
        "paginated": "true",
        "page": "1",
        "perPage": "10000",
        "clasificacion": "Modificación",
        "format": "csv",
    })
    return urlunsplit((parts.scheme or "https", parts.netloc, parts.path, urlencode(query), ""))


def _download_direct_csv(href: str, destination: Path) -> bool:
    url = _modifications_url(href)
    if not url:
        return False

    response = requests.get(
        url,
        timeout=120,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; TranssaUrbanIntelligence/1.0)",
            "Accept": "text/csv,text/plain,*/*",
            "Referer": base.PORTAL_URL,
        },
    )
    response.raise_for_status()
    body = response.content
    if not body:
        return False

    destination.write_bytes(body)
    try:
        records = base.read_csv(destination)
        rows = base.build_rows(records)
    except Exception:
        destination.unlink(missing_ok=True)
        return False

    # Evita aceptar silenciosamente una respuesta parcial o una página vacía.
    if not rows:
        destination.unlink(missing_ok=True)
        return False
    print(f"CSV Portal IPT recuperado directamente: {len(rows)} modificaciones.")
    return True


def robust_download_report(destination: Path) -> Path:
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Falta Playwright. Ejecuta: pip install playwright") from error

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(accept_downloads=True, locale="es-CL")
        csv_responses = []

        def remember_response(response) -> None:
            try:
                content_type = str(response.headers.get("content-type", "")).lower()
                disposition = str(response.headers.get("content-disposition", "")).lower()
                url = response.url.lower()
                if "csv" in content_type or "csv" in disposition or ".csv" in url:
                    csv_responses.append(response)
            except Exception:
                return

        page.on("response", remember_response)
        page.goto(base.PORTAL_URL, wait_until="domcontentloaded", timeout=120_000)

        try:
            page.wait_for_selector("table", timeout=45_000)
        except PlaywrightTimeoutError:
            pass
        try:
            page.wait_for_load_state("networkidle", timeout=30_000)
        except PlaywrightTimeoutError:
            pass
        page.wait_for_timeout(5_000)

        selectors = [
            page.get_by_role("button", name=re.compile(r"descarg|export", re.I)),
            page.get_by_role("link", name=re.compile(r"descarg|export", re.I)),
            page.locator('button[aria-label*="descarg" i], a[aria-label*="descarg" i], [role="button"][aria-label*="descarg" i]'),
            page.locator('button[title*="descarg" i], a[title*="descarg" i], [role="button"][title*="descarg" i]'),
            page.locator('a[download]'),
            page.locator("button, a, [role=button]").filter(has_text=re.compile(r"descarg|export", re.I)),
        ]

        targets = []
        signatures = []
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
                        candidate.get_attribute("class") or "",
                    )
                except Exception:
                    continue
                if signature in seen:
                    continue
                seen.add(signature)
                signatures.append(signature)
                targets.append(candidate)

        # Camino preferido: la propia UI expone el endpoint CSV oficial.
        for signature in signatures:
            href = str(signature[4] or "")
            if not href:
                continue
            try:
                if _download_direct_csv(href, destination):
                    browser.close()
                    return destination
            except Exception as error:
                print(f"Advertencia endpoint CSV directo: {type(error).__name__}: {error}")

        # Respaldo para futuros cambios del Portal IPT.
        page.evaluate(
            """() => {
                window.__tuiDownloads = [];
                const remember = anchor => {
                    if (!anchor) return;
                    const href = anchor.href || anchor.getAttribute('href') || '';
                    const download = anchor.download || anchor.getAttribute('download') || '';
                    if (href && (download || href.startsWith('blob:') || href.startsWith('data:'))) {
                        window.__tuiDownloads.push({href, download});
                    }
                };
                document.addEventListener('click', event => remember(event.target.closest?.('a')), true);
                const originalClick = HTMLAnchorElement.prototype.click;
                HTMLAnchorElement.prototype.click = function(...args) {
                    remember(this);
                    return originalClick.apply(this, args);
                };
            }"""
        )

        for target in targets:
            try:
                with page.expect_download(timeout=12_000) as download_info:
                    target.click(timeout=10_000, force=True)
                download_info.value.save_as(destination)
                if destination.exists() and destination.stat().st_size:
                    browser.close()
                    return destination
            except Exception:
                pass

            page.wait_for_timeout(1_500)
            try:
                captured = page.evaluate("() => window.__tuiDownloads || []")
            except Exception:
                captured = []
            for item in reversed(captured or []):
                if _save_browser_url(page, str(item.get("href") or ""), destination):
                    browser.close()
                    return destination

            for response in reversed(csv_responses):
                try:
                    body = response.body()
                    if body:
                        destination.write_bytes(body)
                        browser.close()
                        return destination
                except Exception:
                    continue

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
        browser.close()

        detail = "; ".join(labels[:12]) or "sin controles visibles identificables"
        signature_text = "; ".join(str(value)[:220] for value in signatures[:4]) or "sin candidatos"
        raise RuntimeError(
            "No se pudo recuperar el CSV del Portal IPT. "
            f"Controles visibles: {detail}. Candidatos: {signature_text}."
        )


base.download_report = robust_download_report

if __name__ == "__main__":
    raise SystemExit(base.main())
