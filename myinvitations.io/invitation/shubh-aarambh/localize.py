"""
Usage:  python localize.py path/to/index.html

- index.html (aur uske CSS/JS) me jitne bhi myinvitations.io/wp-content/ aur
  /wp-includes/ ke links hain, sab download karke "assets/" folder me rakhta hai
- Files me links ko local relative path se badal deta hai
- Naye mile CSS/JS me bhi yahi process repeat karta hai (jab tak kuch naya na mile)
"""
import os, re, sys, urllib.request
from urllib.parse import urlparse, unquote

html_path = os.path.abspath(sys.argv[1])
base_dir = os.path.dirname(html_path)
assets_dir = os.path.join(base_dir, "assets")

# normal aur JS-escaped (https:\/\/myinvitations.io\/...) dono links pakadta hai
PATTERN = re.compile(
    r'https?:(?:\\?/){2}(?:www\.)?myinvitations\.io((?:\\?/)(?:wp-content|wp-includes)(?:\\?/)[^\s"\'()<>\\]*(?:\\/[^\s"\'()<>\\]*)*)'
)
TEXT_EXT = (".html", ".css", ".js")
done = {}  # url -> local file path


def download(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest):
        return True
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            f.write(r.read())
        print("OK  ", url)
        return True
    except Exception as e:
        print("FAIL", url, e)
        return False


def process(file_path):
    with open(file_path, encoding="utf-8", errors="ignore") as f:
        text = f.read()
    file_dir = os.path.dirname(file_path)

    def repl(m):
        path = m.group(1).replace("\\/", "/")
        url = "https://myinvitations.io" + path
        clean = urlparse(url).path  # ?ver=... hata do
        dest = os.path.join(assets_dir, unquote(clean).lstrip("/"))
        if url not in done:
            done[url] = dest if download(url.split("#")[0], dest) else None
        if not done[url]:
            return m.group(0)  # fail hua to purana link rehne do
        rel = os.path.relpath(done[url], file_dir).replace(os.sep, "/")
        return rel.replace("/", "\\/") if "\\/" in m.group(0) else rel

    new_text = PATTERN.sub(repl, text)
    if new_text != text:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_text)


seen = set()
while True:
    targets = [html_path]
    for root, _, files in os.walk(assets_dir):
        targets += [os.path.join(root, n) for n in files if n.endswith(TEXT_EXT)]
    todo = [t for t in targets if t not in seen]
    if not todo:
        break
    for t in todo:
        seen.add(t)
        process(t)
    seen = set()  # naye download hue CSS/JS dobara scan ho
    if not any(os.path.exists(d) for d in done.values() if d):
        break
    # ek round me kuch naya nahi mila to ruk jao
    before = len(done)
    for t in targets:
        process(t)
    if len(done) == before:
        break

print("\nKhatam. Ab bacha hua myinvitations.io check karo:")
print('  findstr /s /i "myinvitations.io" *.html *.css *.js   (Windows)')
