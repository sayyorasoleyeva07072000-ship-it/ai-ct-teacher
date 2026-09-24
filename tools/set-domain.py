#!/usr/bin/env python3
"""
Replace the placeholder https://YOUR-DOMAIN-HERE/ with your real website address
in every file that contains it (canonical links, Open Graph tags, structured data,
robots.txt and sitemap.xml).

Usage (run from the project's top folder):
    python3 tools/set-domain.py https://www.example.org/
    python3 tools/set-domain.py https://username.github.io/ai-ct-teacher/

The address must start with https:// and will get a trailing slash if you forget it.
Use --check to list where the placeholder still appears without changing anything.
"""
import os, re, sys

PLACEHOLDER = "https://YOUR-DOMAIN-HERE/"
EXTS = (".html", ".txt", ".xml", ".webmanifest", ".json")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def files():
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
        for n in names:
            if n.endswith(EXTS):
                yield os.path.join(base, n)

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    if args[0] == "--check":
        total = 0
        for p in files():
            txt = open(p, encoding="utf-8").read()
            c = txt.count("YOUR-DOMAIN-HERE")
            if c:
                total += c; print(f"{c:3d}  {os.path.relpath(p, ROOT)}")
        print(f"\n{total} placeholder occurrence(s) remaining.")
        return
    new = args[0].strip()
    if not re.match(r"^https://[^\s/]+(/[^\s]*)?$", new):
        sys.exit("Error: the address must look like https://www.example.org/ (https, no spaces).")
    if not new.endswith("/"):
        new += "/"
    changed = 0
    for p in files():
        txt = open(p, encoding="utf-8").read()
        if "YOUR-DOMAIN-HERE" in txt or "[DOMAIN-NOTE]" in txt:
            n = txt.count(PLACEHOLDER); changed += n
            out = txt.replace(PLACEHOLDER, new)
            # remove the reminder comments that only make sense while the placeholder is in use
            out = "\n".join(l for l in out.split("\n") if "[DOMAIN-NOTE]" not in l)
            open(p, "w", encoding="utf-8").write(out)
            print(f"updated {n:2d} place(s) in {os.path.relpath(p, ROOT)}")
    print(f"\nDone: {changed} replacement(s). New base address: {new}")
    print("Now run:  python3 tools/set-domain.py --check   (it should report 0 remaining)")

if __name__ == "__main__":
    main()
