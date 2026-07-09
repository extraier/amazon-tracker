"""
Vercel serverless function: GET /api/deals

Returns the most recent scrape result. Reads from Vercel Blob.
Used by the web frontend's App.tsx as the data source.

US region by default — same as /api/scrape. This is a fast read-only endpoint,
no anti-bot implications.
"""
import os
import sys
import json
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import storage


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        try:
            data = storage.load_deals()
            if data is None:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": "no_scrape_yet"}).encode("utf-8")
                )
                return
            body = json.dumps(data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            # Allow CDN to cache for 5 minutes; stale-while-revalidate for 1 hour
            self.send_header("Cache-Control",
                             "public, max-age=300, s-maxage=300, stale-while-revalidate=3600")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            err_body = json.dumps({"error": str(e)[:500]}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
