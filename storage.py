"""
Storage abstraction for the Amazon Apple tracker.

PROD: uses Vercel Blob. One key "deals.json" with the latest scrape result.
LOCAL: writes to /tmp/amazon_tracker_deals.json so the Vercel function
       emulation works.

The cron function (/api/scrape) writes via save_deals(); the read endpoint
(/api/deals) reads via load_deals(). Both functions are read-only-safe
when the blob doesn't exist (return None / 404).
"""
import json
import os
import tempfile

BLOB_KEY = "deals.json"
LOCAL_PATH = "/tmp/amazon_tracker_deals.json"


def _get_blob_token():
    return os.environ.get("BLOB_READ_WRITE_TOKEN")


def save_deals(payload):
    """
    Save the deals payload. Tries Vercel Blob first; falls back to local
    filesystem if running outside Vercel (e.g. CLI or local test).
    Returns the storage backend used: "vercel-blob" or "local".
    """
    body = json.dumps(payload).encode("utf-8")
    token = _get_blob_token()
    if token:
        try:
            from blob import put  # Vercel Blob Python SDK
            put(BLOB_KEY, body, {"token": token, "contentType": "application/json",
                                 "allowOverwrite": True, "access": "public"})
            return "vercel-blob"
        except Exception as e:
            print(f"[storage] Vercel Blob write failed, falling back to local: {e}",
                  flush=True)
    # local fallback
    _atomic_write(LOCAL_PATH, body)
    return "local"


def load_deals():
    """Load the most recent deals payload, or None if nothing is stored yet."""
    token = _get_blob_token()
    if token:
        try:
            from blob import get  # Vercel Blob Python SDK
            data = get(BLOB_KEY, {"token": token})
            if data is None:
                return None
            return json.loads(data)
        except Exception as e:
            print(f"[storage] Vercel Blob read failed, trying local: {e}",
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
