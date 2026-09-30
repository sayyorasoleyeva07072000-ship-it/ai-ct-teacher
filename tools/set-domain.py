#!/usr/bin/env python3
"""
Change the public site address everywhere it appears in the HTML, XML, TXT and
manifest files (canonical links, Open Graph tags, structured data, robots.txt,
sitemap.xml, 404 page).

Usage (from the project's top folder):
    python3 tools/set-domain.py https://your-domain.example/
    python3 tools/set-domain.py https://your-domain.example/ --from https://old.example/
    python3 tools/set-domain.py --check      # list where the current address appears

Default "from" address: https://sssprojectai.github.io/ai-ct-teacher/
(the legacy placeholder https://YOUR-DOMAIN-HERE/ is replaced too, if found).
Documentation (.md), scripts and the backend are not touched.
"""
import os, re, sys
CURRENT = "https://sssprojectai.github.io/ai-ct-teacher/"
LEGACY = "https://YOUR-DOMAIN-HERE/"
EXTS = (".html", ".txt", ".xml", ".webmanifest")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def files():
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "backend", "tests", "tools")]
        for n in names:
            if n.endswith(EXTS):
                yield os.path.join(base, n)

def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__); sys.exit(1)
    old = CURRENT
    if "--from" in a:
        i = a.index("--from"); old = a[i + 1]; a = a[:i] + a[i + 2:]
        if not old.endswith("/"): old += "/"
    if a[0] == "--check":
        total = 0
        for p in files():
            c = open(p, encoding="utf-8").read().count(old)
            if c: total += c; print(f"{c:3d}  {os.path.relpath(p, ROOT)}")
        print(f"\n{total} occurrence(s) of {old}"); return
    new = a[0].strip()
    if not re.match(r"^https://[^\s/]+(/[^\s]*)?$", new): sys.exit("Error: address must look like https://your-domain.example/")
    if not new.endswith("/"): new += "/"
    n = 0
    for p in files():
        t = open(p, encoding="utf-8").read(); o = t
        t = t.replace(old, new).replace(LEGACY, new)
        if t != o:
            open(p, "w", encoding="utf-8").write(t); k = o.count(old) + o.count(LEGACY); n += k
            print(f"updated {k:2d} place(s) in {os.path.relpath(p, ROOT)}")
    print(f"\nDone: {n} replacement(s). New address: {new}")

if __name__ == "__main__":
    main()
