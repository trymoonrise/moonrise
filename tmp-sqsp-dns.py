"""One-off: read Squarespace session from Chrome and update Resend DKIM TXT."""
import os
import shutil
import sqlite3
import tempfile
import json
import ssl
from pathlib import Path

try:
    import win32crypt  # type: ignore
except ImportError:
    win32crypt = None

src = Path(os.environ["LOCALAPPDATA"]) / "Google/Chrome/User Data/Default/Network/Cookies"
tmp = Path(tempfile.gettempdir()) / "chrome_cookies_sqsp.db"
shutil.copy2(src, tmp)
con = sqlite3.connect(str(tmp))
cur = con.cursor()
rows = cur.execute(
    "SELECT name, host_key, encrypted_value, value FROM cookies WHERE host_key LIKE '%squarespace%'"
).fetchall()
print("cookie_rows", len(rows))
cookies = {}
for name, host, enc, value in rows:
    plain = value or ""
    if not plain and enc and win32crypt:
        try:
            plain = win32crypt.CryptUnprotectData(enc, None, None, None, 0)[1].decode("utf-8", "ignore")
        except Exception as e:
            plain = ""
            print("decrypt_fail", name, host, type(e).__name__)
    if plain:
        cookies[name] = plain
        print("ok", name, host, "len", len(plain))
    else:
        print("skip", name, host, "enc_len", len(enc or b""))
con.close()
print("usable", len(cookies))
if "crumb" in cookies or "Secure-Auth" in cookies or any("auth" in k.lower() for k in cookies):
    print("authish", [k for k in cookies if "auth" in k.lower() or k.lower() in ("crumb", "sid", "session")])
