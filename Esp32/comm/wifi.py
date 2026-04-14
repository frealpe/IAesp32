"""
wifi.py — WiFi management for MicroPython ESP32
Mirrors: mcp_wifi.hpp (STA/AP mode, NTP sync, reconnect logic)
"""
import network
import time

try:
    import ntptime
    _HAS_NTP = True
except ImportError:
    _HAS_NTP = False

# ─────────────────────────────────────────────────────────────
# Internal state
# ─────────────────────────────────────────────────────────────
_sta = network.WLAN(network.STA_IF)
_ap  = network.WLAN(network.AP_IF)
mode = "none"  # "sta" | "ap"
time_synced = False

# ─────────────────────────────────────────────────────────────
# NTP Time Sync  (needed for TLS cert validation)
# ─────────────────────────────────────────────────────────────
def sync_ntp(utc_offset_hours=-5):
    global time_synced
    if not _HAS_NTP:
        print("[WiFi] ntptime unavailable, skipping NTP sync")
        return False
    for attempt in range(10):
        try:
            ntptime.settime()
            time_synced = True
            print("[WiFi] NTP time synced OK")
            return True
        except Exception as e:
            print(f"[WiFi] NTP attempt {attempt+1}/10 failed: {e}")
            time.sleep(1)
    print("[WiFi] NTP sync failed — using insecure TLS")
    time_synced = False
    return False

# ─────────────────────────────────────────────────────────────
# AP Mode  (192.168.4.1)
# ─────────────────────────────────────────────────────────────
def start_ap(ssid="ESP32-AP", password="adminmcp", channel=9):
    global mode
    _sta.active(False)
    _ap.active(True)
    _ap.config(essid=ssid, password=password, channel=channel, authmode=3)
    print(f"[WiFi] AP started: {ssid} @ {_ap.ifconfig()[0]}")
    mode = "ap"
    return _ap.ifconfig()[0]

# ─────────────────────────────────────────────────────────────
# Station Mode (Client)
# ─────────────────────────────────────────────────────────────
def connect_sta(ssid, password, timeout_s=20, static_ip=None):
    """
    Connect to WiFi. Falls back to AP on failure.
    static_ip: tuple (ip, mask, gw, dns) or None for DHCP.
    Returns IP string or None.
    """
    global mode
    _ap.active(False)
    _sta.active(True)

    if static_ip:
        _sta.ifconfig(static_ip)

    _sta.connect(ssid, password)
    print(f"[WiFi] Connecting to {ssid}...")

    deadline = time.time() + timeout_s
    while not _sta.isconnected() and time.time() < deadline:
        time.sleep(0.5)

    if _sta.isconnected():
        ip = _sta.ifconfig()[0]
        print(f"[WiFi] Connected: {ip}  RSSI: {_sta.status('rssi')} dBm")
        mode = "sta"
        sync_ntp()
        return ip
    else:
        print(f"[WiFi] Failed to connect to {ssid}. Starting AP fallback.")
        return None

# ─────────────────────────────────────────────────────────────
# Auto-Setup: load settings and decide mode
# ─────────────────────────────────────────────────────────────
def setup(cfg: dict):
    """
    cfg keys: wifi_ssid, wifi_password, ap_mode, ap_ssid, ap_password,
              wifi_ip_static (bool), wifi_ipv4, wifi_subnet, wifi_gateway,
              wifi_dns_primary
    """
    if cfg.get("ap_mode", False):
        return start_ap(cfg.get("ap_ssid", "ESP32-AP"),
                        cfg.get("ap_password", "adminmcp"))

    static_ip = None
    if cfg.get("wifi_ip_static", False):
        static_ip = (
            cfg["wifi_ipv4"], cfg["wifi_subnet"],
            cfg["wifi_gateway"], cfg.get("wifi_dns_primary", "8.8.8.8")
        )

    ip = connect_sta(cfg["wifi_ssid"], cfg["wifi_password"],
                     static_ip=static_ip)
    if ip is None:
        return start_ap(cfg.get("ap_ssid", "ESP32-AP"),
                        cfg.get("ap_password", "adminmcp"))
    return ip

# ─────────────────────────────────────────────────────────────
# Status helpers
# ─────────────────────────────────────────────────────────────
def is_connected():
    return _sta.isconnected()

def rssi():
    try:
        return _sta.status("rssi")
    except Exception:
        return 0

def local_ip():
    if mode == "sta" and _sta.isconnected():
        return _sta.ifconfig()[0]
    if mode == "ap":
        return _ap.ifconfig()[0]
    return "0.0.0.0"

def mac():
    import ubinascii
    return ubinascii.hexlify(_sta.config("mac"), ":").decode()
