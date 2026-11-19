#!/usr/bin/env python3
"""Fail CI on common security regressions in the published static site."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import re
import sys

root = Path(__file__).resolve().parents[1]
errors = []
ignored = {".git", "node_modules", ".github", "scripts"}
public = [p for p in root.rglob("*") if p.is_file() and not any(x in ignored for x in p.relative_to(root).parts)]
text_files = [p for p in public if p.suffix.lower() in {".html", ".js", ".json", ".css"}]
secret_rules = [
    ("GitHub token", r"gh[pousr]_[A-Za-z0-9_]{30,}"),
    ("GitHub fine-grained token", r"github_pat_[A-Za-z0-9_]{30,}"),
    ("Private key", r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ("AWS access key", r"AKIA[0-9A-Z]{16}"),
]
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("target") == "_blank" and "noopener" not in a.get("rel", "").split():
            errors.append(f"{self.path}: external new tab missing rel=noopener")
        for attr in ("src", "href"):
            value = a.get(attr, "")
            if not value or value.startswith(("#", "//", "mailto:", "tel:", "data:", "javascript:")):
                continue
            parsed = urlsplit(value)
            if parsed.scheme:
                if parsed.scheme == "http":
                    errors.append(f"{self.path}: insecure HTTP reference: {value}")
                continue
            path = unquote(parsed.path)
            if not path or path.startswith("/"):
                continue
            dest = (self.path.parent / path)
            if not dest.exists() and not (dest / "index.html").exists():
                errors.append(f"{self.path}: missing local {attr}: {value}")

for p in text_files:
    content = p.read_text(encoding="utf-8", errors="replace")
    for name, pattern in secret_rules:
        if re.search(pattern, content):
            errors.append(f"{p.relative_to(root)}: possible {name}")
    if p.suffix.lower() == ".html":
        Page(p).feed(content)
if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"Security checks passed: {len(text_files)} text files scanned.")
