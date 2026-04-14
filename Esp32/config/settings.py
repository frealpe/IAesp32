"""
settings.py — Persistent settings via LittleFS JSON
Mirrors: mcp_settings.hpp (SPIFFS settings.json, settingsRead/save/reset)
"""
import json

_PATH = "/settings.json"

# ─────────────────────────────────────────────────────────────
# Default factory values  (mirrors settingsReset())
# ─────────────────────────────────────────────────────────────
DEFAULTS = {
    # Device
    "device_config_file": True,
    "device_id": "adminmcp",
    "device_old_user": "adminmcp",
    "device_old_password": "adminmcp",
    # WiFi STA
    "wifi_ip_static": False,
    "wifi_ssid": "NICOLAS",
    "wifi_password": "nicolas1308",
    "wifi_ipv4": "192.168.20.50",
    "wifi_subnet": "255.255.255.0",
    "wifi_gateway": "192.168.20.1",
    "wifi_dns_primary": "8.8.8.8",
    "wifi_dns_secondary": "8.8.4.4",
    # WiFi AP
    "ap_mode": False,
    "ap_ssid": "ESP32-AP",
    "ap_password": "adminmcp",
    "ap_channel": 9,
    "ap_visibility": False,
    "ap_connect": 4,
    # MQTT
    "mqtt_cloud_enable": True,
    "mqtt_topic": "Plc/Esp32",
    "mqtt_user": "plcuser",
    "mqtt_password": "plc",
    "mqtt_server": "192.168.20.20",
    "mqtt_cloud_id": "ESP32_MCP",
    "mqtt_port": 1883,
    "mqtt_retain": False,
    "mqtt_qos": 0,
    "mqtt_time_send": True,
    "mqtt_time_interval": 5,
    "mqtt_status_send": True,
    "mqtt_status_send": True,
}

class Settings:
    def __init__(self):
        self._data = dict(DEFAULTS)

    def load(self):
        try:
            with open(_PATH, "r") as f:
                loaded = json.load(f)
            self._data.update(loaded)
            print("[Settings] Loaded from", _PATH)
            return True
        except Exception as e:
            print(f"[Settings] Load failed ({e}), using defaults")
            self._data = dict(DEFAULTS)
            return False

    def save(self):
        try:
            with open(_PATH, "w") as f:
                json.dump(self._data, f)
            print("[Settings] Saved to", _PATH)
            return True
        except Exception as e:
            print(f"[Settings] Save failed: {e}")
            return False

    def reset(self):
        self._data = dict(DEFAULTS)
        return self.save()

    def get(self, key, default=None):
        return self._data.get(key, default)

    def set(self, key, value):
        self._data[key] = value

    def update(self, d: dict):
        self._data.update(d)

    def as_dict(self):
        return dict(self._data)

    def __getitem__(self, key):
        return self._data[key]

    def __setitem__(self, key, value):
        self._data[key] = value

# Singleton
settings = Settings()
