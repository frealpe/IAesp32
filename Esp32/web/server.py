"""
web.py — Async HTTP web server for MicroPython
Serves the compiled React frontend from LittleFS /www/
Provides REST API endpoints mirroring the ApEsp32 web server

API Endpoints:
  GET  /              → /www/index.html (SPA entry point)
  GET  /api/status    → JSON device status
  GET  /api/settings  → JSON current settings
  POST /api/settings  → update settings (JSON body)
  POST /api/relay     → {"relay":"RELAY1","value":true}
  POST /api/dimmer    → {"value":50}
  POST /api/motor     → {"motor":1,"speed":75,"dir":"fwd"}
  POST /api/adc       → reads ADC and returns value
  POST /api/restart   → machine.reset()
"""
import json
import time

try:
    import asyncio
    import socket as _socket
    _ASYNC = True
except ImportError:
    _ASYNC = False

from web.helpers import parse_request, http_response, serve_file

# ─────────────────────────────────────────────────────────────
# Web Server
# ─────────────────────────────────────────────────────────────
class WebServer:
    """
    Minimal async-friendly HTTP server.
    Call handle_requests() inside the asyncio event loop.
    """
    PORT = 80
    WWW  = "/www"

    def __init__(self, settings, hardware=None, telemetry=None, port=80):
        self._cfg      = settings
        self._hw       = hardware
        self._tele     = telemetry
        self.PORT      = port
        self._sock     = None

    def start(self):
        s = _socket.socket()
        s.setsockopt(_socket.SOL_SOCKET, _socket.SO_REUSEADDR, 1)
        s.bind(("", self.PORT))
        s.listen(3)
        s.setblocking(False)
        self._sock = s
        print(f"[Web] HTTP server on port {self.PORT}")
        return s

    async def serve_forever(self):
        """Async server loop — one connection at a time (low-RAM safe)."""
        loop = asyncio.get_event_loop()
        while True:
            try:
                conn, addr = self._sock.accept()
                self._handle(conn, addr)
            except OSError:
                pass
            await asyncio.sleep(0.05)

    def _handle(self, conn, addr):
        try:
            raw = b""
            conn.settimeout(2.0)
            while True:
                chunk = conn.recv(1024)
                if not chunk: break
                raw += chunk
                if b"\r\n\r\n" in raw: break
            method, path, body = parse_request(raw)
            print(f"[Web] {method} {path} from {addr[0]}")
            self._route(conn, method, path, body)
        except Exception as e:
            print(f"[Web] Handler error: {e}")
        finally:
            conn.close()

    def _route(self, conn, method, path, body):
        # ── Static files ──────────────────────────────────────
        if method == "GET" and not path.startswith("/api"):
            if path == "/" or path == "":
                serve_file(conn, self.WWW + "/index.html")
            else:
                serve_file(conn, self.WWW + path)
            return

        # ── API ───────────────────────────────────────────────
        if method == "GET" and path == "/api/status":
            self._api_status(conn)

        elif method == "GET" and path == "/api/settings":
            http_response(conn, 200, json.dumps(self._cfg.as_dict()))

        elif method == "POST" and path == "/api/settings":
            try:
                data = json.loads(body)
                self._cfg.update(data)
                self._cfg.save()
                http_response(conn, 200, '{"ok":true}')
            except Exception as e:
                http_response(conn, 400, json.dumps({"error": str(e)}))

        elif method == "POST" and path == "/api/adc":
            val = self._hw.sensor.read() if self._hw else 0
            http_response(conn, 200, json.dumps({"adc": val}))

        elif method == "POST" and path == "/api/restart":
            http_response(conn, 200, '{"restart":true}')
            time.sleep(0.5)
            try:
                import machine; machine.reset()
            except Exception:
                pass

        else:
            http_response(conn, 404, '{"error":"not found"}')

    def _api_status(self, conn):
        from network import wifi as _wifi
        hw = self._hw.status() if self._hw else {}
        payload = {
            "device_serial": self._cfg.get("mqtt_cloud_id", "ESP32"),
            "device_fw_version": "MicroPython-v1.0",
            "wifi_online": _wifi.is_connected(),
            "wifi_ssid": self._cfg.get("wifi_ssid", ""),
            "wifi_ipv4": _wifi.local_ip(),
            "wifi_rssi": _wifi.rssi(),
            "wifi_mac": _wifi.mac(),
            "mqtt_online": self._tele.connected if self._tele else False,
            "mqtt_server": self._cfg.get("mqtt_server", ""),
            "mqtt_user": self._cfg.get("mqtt_user", ""),
            "mqtt_cloud_id": self._cfg.get("mqtt_cloud_id", ""),
            **hw
        }
        _http_response(conn, 200, json.dumps(payload))
