"""Run after editing catalog.json to refresh sitemap.xml with one URL per category and product."""
import json, sys
from pathlib import Path
from xml.sax.saxutils import escape

DOMAIN = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
ROOT = Path(__file__).parent
catalog = json.loads((ROOT / "catalog.json").read_text())

urls = [
    f"{DOMAIN}/index.html",
    f"{DOMAIN}/categories.html",
    f"{DOMAIN}/cart.html",
]
for c in catalog.get("categories", []):
    urls.append(f"{DOMAIN}/category.html?slug={escape(c['slug'])}")
for p in catalog.get("products", []):
    urls.append(f"{DOMAIN}/product.html?slug={escape(p['slug'])}")

xml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    xml.append(f"  <url><loc>{u}</loc></url>")
xml.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(xml))
print(f"sitemap.xml: {len(urls)} URLs")
