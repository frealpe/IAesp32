"""
web/helpers.py — HTTP helper functions for WebServer
"""

_MIME = {
    "html": "text/html",
    "css":  "text/css",
    "js":   "application/javascript",
    "json": "application/json",
    "png":  "image/png",
    "svg":  "image/svg+xml",
    "ico":  "image/x-icon",
    "gz":   "application/gzip",
    "woff2":"font/woff2",
}

def content_type(path: str) -> str:
    ext = path.rsplit(".", 1)[-1].lower()
    return _MIME.get(ext, "application/octet-stream")

def read_body(reader) -> bytes:
    """Read HTTP request body (sync socket version)."""
    data = b""
    try:
        while True:
            chunk = reader.recv(1024)
            if not chunk:
                break
            data += chunk
            if len(chunk) < 1024:
                break
    except Exception:
        pass
    return data

def parse_request(raw: bytes):
    """Parse HTTP request. Returns (method, path, body_bytes)."""
    try:
        header_end = raw.find(b"\r\n\r\n")
        headers_raw = raw[:header_end].decode("utf-8", "ignore")
        body = raw[header_end+4:] if header_end != -1 else b""
        first_line = headers_raw.split("\r\n")[0]
        parts = first_line.split(" ")
        method = parts[0] if parts else "GET"
        path   = parts[1] if len(parts) > 1 else "/"
        # strip query string
        path = path.split("?")[0]
        return method, path, body
    except Exception:
        return "GET", "/", b""

def http_response(conn, status: int, body, content_type="application/json", extra_headers=""):
    reason = {200: "OK", 404: "Not Found", 400: "Bad Request", 500: "Internal Server Error"}.get(status, "OK")
    if isinstance(body, str):
        body = body.encode()
    header = (
        f"HTTP/1.1 {status} {reason}\r\n"
        f"Content-Type: {content_type}\r\n"
        f"Content-Length: {len(body)}\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        f"{extra_headers}"
        "Connection: close\r\n\r\n"
    )
    conn.sendall(header.encode() + body)

def serve_file(conn, path: str):
    """Serve a static file from LittleFS."""
    try:
        # Support pre-compressed .gz files
        gz_path = path + ".gz"
        try:
            with open(gz_path, "rb") as f:
                data = f.read()
            ct = content_type(path)
            http_response(conn, 200, data, ct, "Content-Encoding: gzip\r\n")
            return
        except OSError:
            pass
        with open(path, "rb") as f:
            data = f.read()
        http_response(conn, 200, data, content_type(path))
    except OSError:
        http_response(conn, 404, b'{"error":"not found"}')
