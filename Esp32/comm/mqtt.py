"""
telemetry.py — Full bidirectional MQTT for MicroPython
Mirrors: mcp_mqtt.hpp (connect/callback/publish, TLS support)

Topics:
  Subscribe : settings["mqtt_topic"]          e.g. "Plc/Esp32"
  Publish   : settings["mqtt_topic"]          same topic
  LWT       : same topic  → {"connected": false}

Supported inbound commands (JSON):
  {"method":"POST","type":"RELAYS","data":{"output":"RELAY1","value":true}}
  {"method":"POST","type":"DIMMER","data":{"output":"Dimmer","value":50}}
  {"method":"POST","type":"MOTOR","data":{"motor":1,"speed":75}}
  {"method":"POST","type":"GPIO","data":{"pin":26,"state":true}}
  {"method":"POST","type":"RESTART"}
  {"method":"POST","type":"RESTORE"}
  {"method":"GET","type":"STATUS"}
"""
import json
import time

try:
    from umqtt.robust import MQTTClient
    _HAS_MQTT = True
except ImportError:
    try:
        from umqtt.simple import MQTTClient
        _HAS_MQTT = True
    except ImportError:
        # Desktop mock
        class MQTTClient:
            def __init__(self, *a, **kw): pass
            def set_last_will(self, *a, **kw): pass
            def connect(self): print("[MQTT] Connected (mock)")
            def disconnect(self): pass
            def subscribe(self, t): print(f"[MQTT] Subscribed: {t}")
            def publish(self, t, m, retain=False, qos=0): print(f"[MQTT] TX {t}: {m}")
            def set_callback(self, cb): self._cb = cb
            def check_msg(self): pass
            def ping(self): pass
        _HAS_MQTT = False


class MQTTClient:
    """Bidirectional MQTT client."""

    def __init__(self, settings, hardware=None):
        """
        settings: Settings instance
        hardware: Hardware instance (for relay/dimmer/adc)
        """
        self._cfg      = settings
        self._hw       = hardware
        self._client   = None
        self._connected = False
        self._last_publish = 0

    # ─── Connection ───────────────────────────────────────────
    def connect(self) -> bool:
        cfg    = self._cfg
        server = cfg.get("mqtt_server", "broker.hivemq.com")
        port   = cfg.get("mqtt_port", 1883)
        cid    = cfg.get("mqtt_cloud_id", "ESP32_MCP")
        user   = cfg.get("mqtt_user", "")
        pwd    = cfg.get("mqtt_password", "")
        topic  = cfg.get("mqtt_topic", "Plc/Esp32").encode()

        lwt_msg = json.dumps({"connected": False, "id": cid}).encode()

        try:
            ssl = port == 8883
            self._client = MQTTClient(
                cid, server, port=port,
                user=user, password=pwd,
                keepalive=60,
                ssl=ssl
            )
            self._client.set_last_will(topic, lwt_msg, retain=True, qos=0)
            self._client.set_callback(self._on_message)
            self._client.connect()
            self._client.subscribe(topic)
            self._connected = True
            print(f"[MQTT] Connected to {server}:{port}, topic={topic.decode()}")
            self._publish_online(True)
            return True
        except Exception as e:
            print(f"[MQTT] Connection failed: {e}")
            self._connected = False
            return False

    def disconnect(self):
        if self._client and self._connected:
            self._publish_online(False)
            self._client.disconnect()
        self._connected = False

    # ─── Inbound message handler ──────────────────────────────
    def _on_message(self, topic, msg):
        try:
            data = json.loads(msg)
        except Exception:
            self._respond("Err", "Err", {"msg": "Invalid JSON"})
            return

        # Ignore own messages
        own_id = self._cfg.get("mqtt_cloud_id", "")
        if data.get("deviceMqttId") == own_id:
            return

        method = data.get("method", "")
        typ    = data.get("type", "")
        payload = data.get("data", {})

        print(f"[MQTT] ← {method}/{typ}: {payload}")

        if method == "POST" and typ == "GPIO":
            pin   = int(payload.get("pin", 0))
            state = bool(payload.get("state", False))
            try:
                from machine import Pin
                p = Pin(pin, Pin.OUT)
                p.value(1 if state else 0)
            except Exception:
                pass
            self._respond(method, typ, {"pin": pin, "state": state})

        elif method == "POST" and typ == "RESTART":
            self._respond(method, typ, {"restart": True})
            time.sleep(0.5)
            try:
                import machine; machine.reset()
            except Exception:
                pass

        elif method == "POST" and typ == "RESTORE":
            self._cfg.reset()
            self._respond(method, typ, {"restore": True})

        elif method == "GET" and typ == "STATUS":
            self.publish_status()

        else:
            self._respond("Err", "Err", {"msg": "Unsupported command"})

    # ─── Outbound helpers ─────────────────────────────────────
    def _respond(self, method: str, typ: str, value: dict):
        topic = self._cfg.get("mqtt_topic", "Plc/Esp32").encode()
        msg = json.dumps({
            "method": method,
            "type": typ,
            "deviceMqttId": self._cfg.get("mqtt_cloud_id", ""),
            "data": value
        })
        self._safe_publish(topic, msg.encode())

    def _publish_online(self, state: bool):
        topic = self._cfg.get("mqtt_topic", "Plc/Esp32").encode()
        msg = json.dumps({
            "connected": state,
            "id": self._cfg.get("mqtt_cloud_id", "")
        })
        self._safe_publish(topic, msg.encode(), retain=True)

    def publish_status(self):
        """Publish full device telemetry (mirrors Json() in C++)."""
        hw_status = self._hw.status() if self._hw else {}
        topic = self._cfg.get("mqtt_topic", "Plc/Esp32").encode()
        payload = json.dumps({
            "deviceMqttId": self._cfg.get("mqtt_cloud_id", ""),
            "data": {
                "adc":    hw_status.get("adc", 0),
                "wifi_ssid": self._cfg.get("wifi_ssid", ""),
            }
        })
        self._safe_publish(topic, payload.encode())

    def _safe_publish(self, topic, msg, retain=False):
        if self._client and self._connected:
            try:
                self._client.publish(topic, msg, retain=retain)
            except Exception as e:
                print(f"[MQTT] Publish error: {e}")
                self._connected = False
        else:
            print(f"[MQTT] OFFLINE TX {topic}: {msg}")

    # ─── Loop ─────────────────────────────────────────────────
    def loop(self):
        """Call periodically to receive messages and auto-publish."""
        if not self._connected:
            return
        try:
            self._client.check_msg()
        except Exception as e:
            print(f"[MQTT] Loop error: {e}")
            self._connected = False

        # Periodic status publish
        interval = self._cfg.get("mqtt_time_interval", 5)
        now = time.time()
        if self._cfg.get("mqtt_time_send", True) and (now - self._last_publish) >= interval:
            self._last_publish = now
            self.publish_status()

    @property
    def connected(self) -> bool:
        return self._connected
