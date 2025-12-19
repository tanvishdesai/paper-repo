#!/usr/bin/env python3
"""Bulk-inject a consistent dark theme + collapsible sidebar TOC into CS/html summaries/*.html.

- Idempotent: uses a marker comment.
- Does not change content wording/structure inside the HTML body beyond runtime DOM wrapping.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path("/workspace/CS/html summaries")
MARKER = "<!-- DARK_THEME_NORMALIZED v1 -->"

STYLE_BLOCK = r"""{marker}
<style id="_dn_style">
  :root {{
    --dn-bg: #000000;
    --dn-fg: #eaeaea;
    --dn-accent: #7a1c1c;         /* muted red */
    --dn-accent-hover: #8b1e1e;   /* slightly lighter muted red */
    --dn-sidebar-bg: #2a0a0a;     /* dark maroon */
    --dn-sidebar-border: #551212;
    --dn-code-bg: #0b0b0b;
    --dn-panel-bg: #050505;
    --dn-border: #222222;
  }}

  html, body {{
    background-color: var(--dn-bg) !important;
    color: var(--dn-fg) !important;
    margin: 0;
    padding: 0;
  }}

  /* Hard override for common light backgrounds */
  body, body * {{
    background-color: transparent !important;
  }}

  /* Typography */
  h1, h2, h3, h4 {{
    color: var(--dn-accent) !important;
  }}
  p, li, dt, dd, blockquote, figcaption {{
    color: var(--dn-fg) !important;
  }}

  a {{
    color: var(--dn-accent) !important;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }}
  a:hover {{
    color: var(--dn-accent-hover) !important;
  }}

  /* Layout wrapper injected by JS */
  #_dn_toggle {{
    position: fixed;
    left: 12px;
    top: 12px;
    z-index: 9999;
    display: none;
    gap: 8px;
    align-items: center;
    background: var(--dn-sidebar-bg);
    color: #ffffff;
    border: 1px solid var(--dn-sidebar-border);
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    font: inherit;
  }}

  #_dn_app {{
    min-height: 100vh;
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr);
  }}

  #_dn_sidebar {{
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: auto;
    background: var(--dn-sidebar-bg) !important;
    border-right: 1px solid var(--dn-sidebar-border);
    padding: 16px 14px 18px;
    color: #ffffff !important;
  }}

  #_dn_sidebar * {{
    color: #ffffff !important;
  }}

  #_dn_sidebar ._dn_title {{
    font-weight: 700;
    margin: 2px 6px 10px;
    letter-spacing: 0.2px;
  }}

  #_dn_toc {{
    margin: 0;
    padding: 0 6px;
  }}

  #_dn_toc a {{
    display: block;
    padding: 6px 8px;
    border-radius: 8px;
    text-decoration: none;
  }}

  #_dn_toc a:hover {{
    background: rgba(139, 30, 30, 0.20) !important;
  }}

  #_dn_toc a._dn_active {{
    background: rgba(139, 30, 30, 0.28) !important;
    color: var(--dn-accent-hover) !important;
  }}

  #_dn_toc a[data-level="2"] {{ padding-left: 16px; opacity: 0.95; }}
  #_dn_toc a[data-level="3"] {{ padding-left: 26px; opacity: 0.92; }}
  #_dn_toc a[data-level="4"] {{ padding-left: 36px; opacity: 0.90; }}

  #_dn_main {{
    padding: 26px 26px 64px;
    min-width: 0;
  }}

  /* Responsive: sidebar collapses on small screens */
  @media (max-width: 900px) {{
    #_dn_app {{
      grid-template-columns: 1fr;
    }}

    #_dn_toggle {{
      display: inline-flex;
    }}

    #_dn_sidebar {{
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      width: 290px;
      transform: translateX(-102%);
      transition: transform 180ms ease;
      z-index: 9998;
      box-shadow: 12px 0 24px rgba(0,0,0,0.55);
    }}

    body._dn_sidebar_open #_dn_sidebar {{
      transform: translateX(0);
    }}

    #_dn_main {{
      padding-top: 60px;
    }}
  }}

  /* Panels */
  pre, code, kbd, samp {{
    background: var(--dn-code-bg) !important;
    color: var(--dn-fg) !important;
    border-radius: 10px;
  }}
  pre {{
    padding: 14px 16px;
    overflow: auto;
    border: 1px solid var(--dn-border);
  }}
  code {{
    padding: 0.15em 0.35em;
    border: 1px solid var(--dn-border);
  }}

  blockquote {{
    background: var(--dn-panel-bg) !important;
    border-left: 3px solid var(--dn-accent);
    margin: 12px 0;
    padding: 10px 12px;
    border-radius: 10px;
  }}

  hr {{
    border: 0;
    border-top: 1px solid var(--dn-border);
  }}

  table {{
    border-collapse: collapse;
  }}
  th, td {{
    border: 1px solid var(--dn-border);
    padding: 8px 10px;
  }}
  thead th {{
    background: rgba(122, 28, 28, 0.20) !important;
  }}

  /* Mermaid: force dark blending */
  .mermaid, pre.mermaid, code.mermaid {{
    background: var(--dn-bg) !important;
  }}
  .mermaid svg {{
    background: var(--dn-bg) !important;
  }}

  /* MathJax / KaTeX */
  mjx-container, .MathJax, .katex, .katex-display {{
    background: var(--dn-bg) !important;
    color: var(--dn-fg) !important;
  }}
  .katex-display {{
    margin: 0.8em 0;
    padding: 0.2em 0;
  }}

  /* Prevent images/iframes from inheriting transparency oddities */
  img, svg, canvas, video, iframe {{
    background: transparent !important;
  }}
</style>
""".format(marker=MARKER)

SCRIPT_BLOCK = r"""<script id="_dn_script">
(function () {
  if (window.__dnThemeNormalized) return;
  window.__dnThemeNormalized = true;

  function slugify(text) {
    return (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s\-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/\-+/g, "-")
      .replace(/^\-+|\-+$/g, "")
      .slice(0, 80) || "section";
  }

  function isOurNode(node) {
    return node && node.nodeType === 1 && (node.id === "_dn_toggle" || node.id === "_dn_app" || node.id === "_dn_sidebar" || node.id === "_dn_main");
  }

  function hideLegacySidebars(main) {
    try {
      var candidates = main.querySelectorAll(
        '[id*="toc" i], [class*="toc" i], [id*="table-of-contents" i], [class*="table-of-contents" i], [id*="sidebar" i], [class*="sidebar" i], nav[role="doc-toc"], aside[role="doc-toc"]'
      );
      candidates.forEach(function (el) {
        if (!el) return;
        if (el.id === "_dn_sidebar" || el.closest("#_dn_sidebar")) return;
        // Avoid hiding Mermaid containers.
        if (el.classList && el.classList.contains("mermaid")) return;
        el.style.display = "none";
      });
    } catch (_) {}
  }

  function init() {
    if (document.getElementById("_dn_app")) return;

    var body = document.body;

    var toggle = document.createElement("button");
    toggle.id = "_dn_toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Toggle table of contents");
    toggle.textContent = "Contents";

    var app = document.createElement("div");
    app.id = "_dn_app";

    var sidebar = document.createElement("aside");
    sidebar.id = "_dn_sidebar";

    var title = document.createElement("div");
    title.className = "_dn_title";
    title.textContent = "Table of Contents";

    var toc = document.createElement("nav");
    toc.id = "_dn_toc";

    sidebar.appendChild(title);
    sidebar.appendChild(toc);

    var main = document.createElement("main");
    main.id = "_dn_main";

    // Move existing body children into main (preserves content & scripts).
    var children = Array.from(body.childNodes);
    children.forEach(function (node) {
      if (isOurNode(node)) return;
      if (node.nodeType === 1 && (node.tagName === "SCRIPT" || node.tagName === "STYLE")) {
        // Keep scripts/styles in place to avoid breaking execution ordering.
        return;
      }
      main.appendChild(node);
    });

    // Remove moved nodes from body (only those we appended).
    // (Appending already detaches them, so just continue.)

    body.insertBefore(toggle, body.firstChild);
    app.appendChild(sidebar);
    app.appendChild(main);
    body.appendChild(app);

    // Move any remaining non-script/style nodes (e.g. text nodes left behind) into main.
    Array.from(body.childNodes).forEach(function (node) {
      if (node === toggle || node === app) return;
      if (isOurNode(node)) return;
      if (node.nodeType === 1 && (node.tagName === "SCRIPT" || node.tagName === "STYLE")) return;
      main.appendChild(node);
    });

    // Build TOC from headings.
    var headings = main.querySelectorAll("h1, h2, h3, h4");
    var used = Object.create(null);

    function ensureId(h) {
      var base = h.id && h.id.trim() ? h.id.trim() : slugify(h.textContent);
      var id = base;
      var i = 2;
      while (document.getElementById(id) && document.getElementById(id) !== h) {
        id = base + "-" + i;
        i += 1;
      }
      h.id = id;
      return id;
    }

    toc.innerHTML = "";
    headings.forEach(function (h) {
      if (!h || !h.textContent) return;
      var level = Number((h.tagName || "").slice(1)) || 2;
      if (level < 1 || level > 4) return;

      var text = h.textContent.trim();
      if (!text) return;

      var id = ensureId(h);
      if (used[id]) return;
      used[id] = true;

      var a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = text;
      a.setAttribute("data-level", String(level));
      a.addEventListener("click", function () {
        if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
          document.body.classList.remove("_dn_sidebar_open");
        }
      });
      toc.appendChild(a);
    });

    hideLegacySidebars(main);

    function setOpen(open) {
      document.body.classList.toggle("_dn_sidebar_open", !!open);
    }

    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("_dn_sidebar_open"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    // Default: collapsed on small screens.
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
      setOpen(false);
    }

    // Active section highlight.
    try {
      var links = Array.from(toc.querySelectorAll("a"));
      var linkById = new Map(links.map(function (a) { return [a.getAttribute("href").slice(1), a]; }));

      var obs = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (en) { return en.isIntersecting; })
          .sort(function (a, b) { return (a.boundingClientRect.top - b.boundingClientRect.top); });
        if (!visible.length) return;
        var id = visible[0].target && visible[0].target.id;
        if (!id) return;
        links.forEach(function (a) { a.classList.remove("_dn_active"); });
        var active = linkById.get(id);
        if (active) active.classList.add("_dn_active");
      }, { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] });

      headings.forEach(function (h) { obs.observe(h); });
    } catch (_) {}

    // Mermaid: force dark theme if Mermaid exists.
    try {
      if (window.mermaid && !window.__dnMermaidInit) {
        window.__dnMermaidInit = true;
        window.mermaid.initialize({
          startOnLoad: true,
          theme: "dark",
          themeVariables: {
            background: "#000000",
            primaryColor: "#7a1c1c",
            primaryTextColor: "#eaeaea",
            primaryBorderColor: "#551212",
            lineColor: "#bdbdbd",
            secondaryColor: "#2a0a0a",
            tertiaryColor: "#000000"
          }
        });
        if (typeof window.mermaid.run === "function") {
          window.mermaid.run({ querySelector: ".mermaid" });
        }
      }
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>
"""


def inject_into_head(html: str) -> str:
    if MARKER in html:
        return html

    payload = STYLE_BLOCK + "\n" + SCRIPT_BLOCK + "\n"

    # Insert before </head> if possible (preferred), else after <head>, else at top.
    m = re.search(r"</head\s*>", html, flags=re.IGNORECASE)
    if m:
        return html[: m.start()] + payload + html[m.start() :]

    m2 = re.search(r"<head\b[^>]*>", html, flags=re.IGNORECASE)
    if m2:
        return html[: m2.end()] + "\n" + payload + html[m2.end() :]

    return payload + html


def main() -> int:
    if not ROOT.exists() or not ROOT.is_dir():
        raise SystemExit(f"Target directory not found: {ROOT}")

    html_files: list[Path] = sorted(ROOT.rglob("*.html"))
    if not html_files:
        raise SystemExit(f"No .html files found under: {ROOT}")

    changed = 0
    skipped = 0

    for path in html_files:
        raw = path.read_text(encoding="utf-8", errors="ignore")
        updated = inject_into_head(raw)
        if updated == raw:
            skipped += 1
            continue
        path.write_text(updated, encoding="utf-8")
        changed += 1

    print(f"Processed {len(html_files)} HTML files")
    print(f"Updated: {changed}")
    print(f"Already normalized (skipped): {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
