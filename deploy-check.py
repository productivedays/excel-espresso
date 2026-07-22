#!/usr/bin/env python3
"""
NingNing — Excel Espresso website deploy-readiness checker.

The mechanical scan behind the NingNing agent (website/.claude/agents/ningning.md).
Plain-language health check for the static site. No dependencies, read-only:
it never changes a file. Run it yourself anytime from the website/ folder:

    python3 scripts/deploy-check.py

Or point it at another folder:

    python3 scripts/deploy-check.py /path/to/site

Findings are grouped 🔴 Blocker / 🟠 Before launch / 🟡 Nice-to-have, with a
final READY / NOT READY verdict. Exit code is non-zero when a blocker exists,
so it also works in scripts/CI.
"""

import os
import re
import sys

# ---- paths -----------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(SCRIPT_DIR)

SKIP_DIRS = {".claude", "node_modules", ".git"}
DOWNLOAD_EXTS = (".xlsx", ".xls", ".csv", ".zip", ".pdf", ".docx", ".pptx")
# Internal reference page, robots-disallowed — not a public page, skip entirely.
SKIP_FILES = {"design-guide.html"}
# Authoring templates full of intentional placeholders — don't scan their innards,
# just note once that they're still sitting in the deployable folder.
SCAFFOLD_FILES = {"blog-post.html", "template-detail.html"}

# Attribute links: href="..." / src="..."
ATTR_RE = re.compile(r'(?:href|src)\s*=\s*"([^"]*)"')
# Inline JSON file references used by main.js data (download/slug/image keys)
JSON_REF_RE = re.compile(r'"(?:download|slug|image)"\s*:\s*"([^"]+)"')
# Open Graph image
OG_IMG_RE = re.compile(r'<meta[^>]+property\s*=\s*"og:image"[^>]+content\s*=\s*"([^"]+)"')
# Canonical host
CANON_RE = re.compile(r'<link[^>]+rel\s*=\s*"canonical"[^>]+href\s*=\s*"https?://([^/"]+)')
# Sitemap <loc>
LOC_RE = re.compile(r"<loc>\s*([^<]+?)\s*</loc>")
# Loud round numbers in visible text, e.g. 1,200+ / 10,000+ (possible fake stat).
# Comma-grouped only, so version notes like "Excel 2016+" don't false-trigger.
FAKE_STAT_RE = re.compile(r">[^<]*?(\d{1,3}(?:,\d{3})+\+)")

findings = {"blocker": [], "before": [], "nice": []}


def add(level, msg):
    findings[level].append(msg)


def rel(path):
    return os.path.relpath(path, SITE_ROOT)


def is_external(url):
    return url.startswith(("http://", "https://", "mailto:", "tel:", "//", "data:", "javascript:"))


def html_files():
    out = []
    for root, dirs, files in os.walk(SITE_ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".html") and f not in SKIP_FILES:
                out.append(os.path.join(root, f))
    return sorted(out)


def resolve(from_file, url):
    """Resolve a relative link to an absolute filesystem path (or None if external/empty)."""
    if not url or is_external(url):
        return None
    clean = url.split("#")[0].split("?")[0]
    if not clean:
        return None
    return os.path.normpath(os.path.join(os.path.dirname(from_file), clean))


# ---- 1. links, downloads, assets in every page -----------------------------
pages = html_files()
if not pages:
    print(f"No .html files found under {SITE_ROOT} — is this the website folder?")
    sys.exit(2)

canonical_hosts = {}

for page in pages:
    if os.path.basename(page) in SCAFFOLD_FILES:
        add("before", f"Scaffold/template file still in the deployable folder: {rel(page)} "
                      f"— move it out or delete it so it can't go live as a blank page")
        continue

    txt = open(page, encoding="utf-8").read()
    seen_here = set()

    # attribute links + inline JSON refs
    for m in list(ATTR_RE.finditer(txt)) + list(JSON_REF_RE.finditer(txt)):
        url = m.group(1)
        target = resolve(page, url)
        if target is None or url in seen_here:
            continue
        seen_here.add(url)
        if not os.path.exists(target):
            if url.lower().endswith(DOWNLOAD_EXTS):
                add("blocker", f"Download button is broken (404): {rel(page)} → {url}")
            else:
                add("blocker", f"Broken link: {rel(page)} → {url}")
        elif url.lower().endswith(DOWNLOAD_EXTS) and os.path.getsize(target) == 0:
            add("blocker", f"Download file is EMPTY (0 bytes): {url} (linked from {rel(page)})")

    # og:image
    for m in OG_IMG_RE.finditer(txt):
        target = resolve(page, m.group(1))
        if target and not os.path.exists(target):
            add("before", f"Social-share image missing: {rel(page)} → {m.group(1)} (broken preview when shared)")

    # canonical host
    cm = CANON_RE.search(txt)
    if cm:
        canonical_hosts.setdefault(cm.group(1), []).append(rel(page))

    # placeholder links
    n_hash = len(re.findall(r'href\s*=\s*"#"', txt))
    if n_hash:
        add("before", f"{n_hash} placeholder link(s) still `href=\"#\"` in {rel(page)} (e.g. Facebook / dead buttons)")

    # leftover TODO / fake stats
    if "TODO" in txt:
        add("nice", f"Leftover TODO note in {rel(page)}")
    for m in FAKE_STAT_RE.finditer(txt):
        add("nice", f"Possible placeholder stat \"{m.group(1)}\" in {rel(page)} — confirm it's a real number")

# ---- 2. domain / canonical consistency -------------------------------------
if len(canonical_hosts) > 1:
    hosts = ", ".join(sorted(canonical_hosts))
    add("before", f"Canonical URLs use more than one domain ({hosts}) — pick one before launch")
elif canonical_hosts:
    host = next(iter(canonical_hosts))
    add("nice", f"All canonical URLs point to '{host}' — make sure that's the domain you'll actually use")

# ---- 3. robots.txt ---------------------------------------------------------
robots = os.path.join(SITE_ROOT, "robots.txt")
if not os.path.exists(robots):
    add("blocker", "robots.txt is missing (search engines need it)")
else:
    rtxt = open(robots, encoding="utf-8").read()
    if "Sitemap:" not in rtxt:
        add("before", "robots.txt has no `Sitemap:` line pointing to sitemap.xml")

# ---- 4. sitemap.xml --------------------------------------------------------
sitemap = os.path.join(SITE_ROOT, "sitemap.xml")
if not os.path.exists(sitemap):
    add("blocker", "sitemap.xml is missing (helps Google find every page)")
else:
    stxt = open(sitemap, encoding="utf-8").read()
    locs = LOC_RE.findall(stxt)
    if not locs:
        add("blocker", "sitemap.xml has no <loc> URLs (empty or malformed)")
    sitemap_paths = set()
    for loc in locs:
        path = re.sub(r"^https?://[^/]+/", "", loc)  # strip domain
        fs = os.path.normpath(os.path.join(SITE_ROOT, path if path else "index.html"))
        sitemap_paths.add(os.path.normpath(os.path.join(SITE_ROOT, (path or "index.html"))))
        if not os.path.exists(fs):
            add("blocker", f"sitemap.xml lists a page that doesn't exist: {loc}")
    # real pages not in the sitemap (skip the internal brand guide + obvious scaffolds)
    for page in pages:
        name = os.path.basename(page)
        if name in ("design-guide.html", "404.html") or "-detail" in name or name.endswith("-post.html"):
            continue
        if page not in sitemap_paths:
            add("nice", f"Page not listed in sitemap.xml: {rel(page)}")

# ---- report ----------------------------------------------------------------
LABELS = [
    ("blocker", "🔴 BLOCKERS — fix before anyone visits"),
    ("before", "🟠 BEFORE LAUNCH — do before going public"),
    ("nice", "🟡 NICE TO HAVE — polish / double-check"),
]

print("=" * 70)
print(f"  NingNing — deploy check for: {SITE_ROOT}")
print("=" * 70)

for level, label in LABELS:
    items = findings[level]
    print(f"\n{label}  ({len(items)})")
    if not items:
        print("   ✓ nothing here")
    for it in items:
        print(f"   • {it}")

n_block = len(findings["blocker"])
print("\n" + "-" * 70)
if n_block:
    print(f"  VERDICT: 🔴 NOT READY — {n_block} blocker(s) to fix first.")
else:
    print("  VERDICT: 🟢 No blockers. Clear the 🟠 items, then you're good to deploy.")
print("-" * 70)

sys.exit(1 if n_block else 0)
