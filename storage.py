"""
Storage abstraction for the Amazon Apple tracker.

PROD: Vercel Blob via REST API (no Python SDK exists). One key "deals.json"
      with the latest scrape result.
LOCAL: writes to /tmp/amazon_tracker_deals.json so the Vercel function
       emulation works.

The cron function (/api/scrape) writes via save_deals(); the read endpoint
(/api/deals) reads via load_deals(). Both functions are read-only-safe
when the blob doesn't exist (return None / 404).

Vercel Blob REST API:
  PUT  https://blob.vercel-storage.com/{pathname}    (write)
       Headers: Authorization: Bearer {BLOB_READ_WRITE_TOKEN}
                x-api-version: 2
                x-content-type: application/json
                x-add-random-suffix: 0    (overwrite in place)

  GET  https://blob.vercel-storage.com/{pathname}    (read)
       Headers: Authorization: Bearer {BLOB_READ_WRITE_TOKEN}
"""
import json
import os
import tempfile
import urllib.error
import urllib.request

BLOB_KEY = "deals.json"
LOCAL_PATH = "/tmp/amazon_tracker_deals.json"
BLOB_BASE = "https://blob.vercel-storage.com"


def _get_token():
    return os.environ.get("BLOB_READ_WRITE_TOKEN")


def _put_blob(body, content_type="application/json"):
    """PUT a blob via the Vercel Blob REST API. Returns (status, response_bytes)."""
    token = _get_token()
    if not token:
        raise RuntimeError("BLOB_READ_WRITE_TOKEN not set")
    req = urllib.request.Request(
        f"{BLOB_BASE}/{BLOB_KEY}",
        data=body,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "x-api-version": "2",
            "x-content-type": content_type,
            "x-add-random-suffix": "0",
            "Content-Type": content_type,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def _get_blob():
    """GET a blob via the Vercel Blob REST API. Returns (status, body_bytes)."""
    token = _get_token()
    if not token:
        raise RuntimeError("BLOB_READ_WRITE_TOKEN not set")
    req = urllib.request.Request(
        f"{BLOB_BASE}/{BLOB_KEY}",
        method="GET",
        headers={
            "Authorization": f"Bearer {token}",
            "x-api-version": "2",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def save_deals(payload):
    """
    Save the deals payload. Tries Vercel Blob first; falls back to local
    filesystem if running outside Vercel or if Blob is unavailable.
    Returns the storage backend used: "vercel-blob" or "local".
    """
    body = json.dumps(payload).encode("utf-8")
    token = _get_token()
    if token:
        try:
            status, resp = _put_blob(body)
            if 200 <= status < 300:
                return "vercel-blob"
            print(f"[storage] Vercel Blob PUT returned {status}: {resp[:200]!r}",
                  flush=True)
        except Exception as e:
            print(f"[storage] Vercel Blob PUT failed, falling back to local: {e}",
                  flush=True)
    # local fallback
    _atomic_write(LOCAL_PATH, body)
    return "local"


def load_deals():
    """
    Load the most recent deals payload, or None if nothing is stored yet.
    Tries Vercel Blob first; falls back to local filesystem.
    """
    token = _get_token()
    if token:
        try:
            status, resp = _get_blob()
            if status == 200:
                return json.loads(resp.decode("utf-8"))
            if status == 404:
                return None  # blob doesn't exist yet
            print(f"[storage] Vercel Blob GET returned {status}: {resp[:200]!r}",
                  flush=True)
        except Exception as e:
            print(f"[storage] Vercel Blob GET failed, trying local: {e}",
                  flush=True)
    # local fallback
    if not os.path.exists(LOCAL_PATH):
        return None
    with open(LOCAL_PATH) as f:
        return json.load(f)


def _atomic_write(path, body):
    """Write atomically via temp file + rename."""
    tmp_dir = os.path.dirname(path) or "."
    fd, tmp = tempfile.mkstemp(dir=tmp_dir, prefix=".deals.", suffix=".json")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(body)
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass
        raise
