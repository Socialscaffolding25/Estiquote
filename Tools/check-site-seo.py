#!/usr/bin/env python3
"""Check the actual public build, not retired pages elsewhere in the repository.

Usage: python3 Tools/check-site-seo.py [.netlify-dist]
No network requests, third-party packages, or source mutations.
"""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ORIGIN = "https://estiquote.co.uk"
ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".netlify-dist").resolve()
errors = []


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.tags = []
        self.ids = set()
        self.title = ""
        self.json = []
        self.in_title = False
        self.in_json = False
        self.json_text = ""
        self.feed(path.read_text())
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if "id" in attrs:
            if attrs["id"] in self.ids:
                errors.append(f"{self.path}: duplicate id {attrs['id']}")
            self.ids.add(attrs["id"])
        self.in_title = tag == "title" or self.in_title
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_json = True
            self.json_text = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_json:
            try:
                self.json.append(json.loads(self.json_text))
            except ValueError as error:
                errors.append(f"{self.path}: invalid JSON-LD: {error}")
            self.in_json = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_json:
            self.json_text += data

    def values(self, tag, attribute, value, result):
        return [attrs.get(result, "") for name, attrs in self.tags
                if name == tag and attrs.get(attribute) == value]


def check(condition, message):
    if not condition:
        errors.append(message)


def local_path(url):
    path = unquote(urlsplit(url).path)
    result = ROOT / path.lstrip("/")
    return result / "index.html" if path.endswith("/") else result


pages = {path: Page(path) for path in ROOT.rglob("*.html")}
check(bool(pages), "No HTML found: build the site first")
sitemap = ET.parse(ROOT / "sitemap.xml")
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [node.text for node in sitemap.findall("s:url/s:loc", ns)]
check(len(urls) == len(set(urls)), "Duplicate sitemap URLs")
titles = set()
descriptions = set()
canonical_urls = set()
links = {}

for path, page in pages.items():
    label = str(path.relative_to(ROOT))
    canonicals = page.values("link", "rel", "canonical", "href")
    check(len(canonicals) == 1, f"{label}: requires one canonical")
    if len(canonicals) != 1:
        continue
    canonical = canonicals[0]
    check(canonical.startswith(ORIGIN + "/"), f"{label}: wrong canonical origin")
    check(local_path(canonical) == path, f"{label}: canonical points to another page")
    check(canonical in urls, f"{label}: missing from sitemap")
    canonical_urls.add(canonical)
    check(sum(tag == "h1" for tag, _ in page.tags) == 1, f"{label}: requires one h1")
    check(sum(tag == "title" for tag, _ in page.tags) == 1, f"{label}: requires one title")
    check(bool(page.title.strip()) and page.title not in titles, f"{label}: empty/duplicate title")
    titles.add(page.title)
    description = page.values("meta", "name", "description", "content")
    check(len(description) == 1 and bool(description[0].strip()), f"{label}: description missing/duplicated")
    if description:
        check(description[0] not in descriptions, f"{label}: duplicate description")
        descriptions.add(description[0])
    check(bool(page.values("meta", "name", "viewport", "content")), f"{label}: missing viewport")
    robots = page.values("meta", "name", "robots", "content")
    check(not any("noindex" in value.lower() for value in robots), f"{label}: noindex page")
    for og_url in page.values("meta", "property", "og:url", "content"):
        check(og_url == canonical, f"{label}: Open Graph URL differs from canonical")
    for graph in page.json:
        check(graph.get("@context") == "https://schema.org", f"{label}: invalid schema context")
        for item in graph.get("@graph", [graph]):
            if item.get("@type") == "Article":
                check(item.get("mainEntityOfPage") == canonical, f"{label}: article URL mismatch")
                check(bool(item.get("author")), f"{label}: missing article author")
    links[path] = set()
    for tag, attrs in page.tags:
        if tag == "img":
            check("alt" in attrs, f"{label}: image missing alt")
        for attribute in ("href", "src"):
            ref = attrs.get(attribute)
            if not ref:
                continue
            target = urlsplit(urljoin(canonical, ref))
            if target.scheme not in ("http", "https") or target.netloc != "estiquote.co.uk":
                continue
            target_path = local_path(target.geturl())
            check(target_path.is_file(), f"{label}: missing local target {ref}")
            if target_path in pages:
                if tag == "a":
                    links[path].add(target_path)
                if target.fragment:
                    check(unquote(target.fragment) in pages[target_path].ids,
                          f"{label}: broken fragment {ref}")

check(set(urls) == canonical_urls, "Sitemap URLs differ from public canonical pages")
check(f"Sitemap: {ORIGIN}/sitemap.xml" in (ROOT / "robots.txt").read_text(), "robots sitemap missing")
check("Disallow: /\n" not in (ROOT / "robots.txt").read_text(), "robots blocks entire site")
home = ROOT / "index.html"
seen, pending = set(), [home]
while pending:
    path = pending.pop()
    if path not in seen:
        seen.add(path)
        pending.extend(links.get(path, set()) - seen)
for path in pages:
    check(path in seen, f"{path.relative_to(ROOT)}: not reachable through links from home")
for path in ROOT.rglob("*"):
    check(not path.name.startswith(".env") and path.suffix not in (".swift", ".pem", ".jwk"),
          f"Unexpected private/source file in public build: {path.name}")
if errors:
    print("SEO checks failed:\n- " + "\n- ".join(errors))
    sys.exit(1)
print(f"PASS: {len(pages)} public pages; unique metadata, canonical/sitemap alignment, "
      "JSON-LD syntax, local links/fragments/assets and homepage reachability.")
print("Static checks do not establish indexing, rich-result eligibility or rankings.")
