"""
main.py — AntigravitySystem: Async main coordinator for MicroPython ESP32
Replaces: C++ main.cpp + FreeRTOS tasks from ApEsp32
          + original blocking Python main.py

Boot sequence:
  1. Load settings from LittleFS
  2. Connect WiFi (STA with AP fallback)
  3. Initialize hardware (Relays, Dimmer, ADC)
  4. Initialize motors (Roboclaw via UART)
  5. Connect MQTT
  6. Start HTTP web server (serving /www/index.html)
  7. Run async event loop:
     - Poll MQTT messages
     - Poll scheduler tasks
     - Process CLI commands (if running on desktop)

Usage:
  # On ESP32 (MicroPython):    flash and it runs automatically
  # On desktop (CPython mock):  python main.py
"""
import time
import sys

# ─────────────────────────────────────────────────────────────
# Async support
# ─────────────────────────────────────────────────────────────
try:
    import asyncio
    _ASYNC = True
except ImportError:
    _ASYNC = False

from config.settings import settings
from resource_manager import ResourceManager
from comm.mqtt import MQTTClient
from scheduler import Scheduler
from interpreter import Interpreter
from comm import wifi


class AntigravitySystem:
    """Main system coordinator — async version for MicroPython."""

    def __init__(self):
        print("=== Antigravity MicroPython System ===")

        # 1. Settings
        settings.load()
        self.cfg = settings

        # 2. Resource Manager (Hardware)
        self.hw = ResourceManager()

        # 4. Scheduler
        self.scheduler = Scheduler()

        # 5. MQTT
        self.tele = MQTTClient(self.cfg, hardware=self.hw)

        # 6. Interpreter (natural language CLI)
        self.interpreter = Interpreter(self)

        # 7. Web server (import deferred — only on real HW)
        self._web = None

        self.running = True
        print("[System] Init complete")

    # ─── Boot ─────────────────────────────────────────────────
    def boot(self):
        # WiFi
        ip = wifi.setup(self.cfg.as_dict())
        print(f"[System] IP: {ip}")

        # MQTT
        if self.cfg.get("mqtt_cloud_enable", False):
            self.tele.connect()

        # Web server
        try:
            from web.server import WebServer
            self._web = WebServer(
                self.cfg,
                hardware=self.hw,
                telemetry=self.tele,
                port=80
            )
            self._web.start()
        except Exception as e:
            print(f"[System] Web server not started: {e}")

        # Periodic tasks
        self.scheduler.schedule("Heartbeat",   10, self._heartbeat)
        self.scheduler.schedule("ADC Sample",   2, self._read_adc)

    def _heartbeat(self):
        print(f"[System] Heartbeat — WiFi: {wifi.is_connected()}  MQTT: {self.tele.connected}")

    def _read_adc(self):
        val = self.hw.sensor.read()
        print(f"[ADC] {val}")

    # ─── Async event loop ─────────────────────────────────────
    async def _mqtt_task(self):
        while self.running:
            self.tele.loop()
            await asyncio.sleep(0.1)

    async def _scheduler_task(self):
        while self.running:
            self.scheduler.run_pending()
            await asyncio.sleep(0.05)

    async def _web_task(self):
        if self._web:
            await self._web.serve_forever()

    async def _cli_task(self):
        """Interactive CLI — useful when running on desktop."""
        import uasyncio as aio
        print("CLI ready. Type commands or 'salir' to quit.")
        while self.running:
            # Non-blocking readline simulation
            try:
                line = sys.stdin.readline()
                if line:
                    cmd = line.strip()
                    if cmd.lower() in ("salir", "exit", "quit"):
                        self.running = False
                    else:
                        print(self.interpreter.execute(cmd))
            except Exception:
                pass
            await asyncio.sleep(0.1)

    async def _run_async(self):
        self.boot()
        tasks = [
            asyncio.create_task(self._mqtt_task()),
            asyncio.create_task(self._scheduler_task()),
            asyncio.create_task(self._web_task()),
        ]
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            print(f"[System] Event loop error: {e}")
        finally:
            self._shutdown()

    # ─── Synchronous fallback (desktop / CPython) ─────────────
    def _run_sync(self):
        self.boot()
        print("Running (sync mode). Ctrl+C to stop.")
        self.scheduler.schedule("Heartbeat",   10, self._heartbeat)
        self.scheduler.schedule("ADC Sample",   2, self._read_adc)
        try:
            while self.running:
                self.scheduler.run_pending()
                self.tele.loop()
                # Prompt CLI
                try:
                    cmd = input("> ").strip()
                    if cmd.lower() in ("salir", "exit", "quit"):
                        self.running = False
                    elif cmd:
                        print(self.interpreter.execute(cmd))
                except EOFError:
                    break
                time.sleep(0.05)
        except KeyboardInterrupt:
            print("\nShutdown requested...")
        finally:
            self._shutdown()

    def _shutdown(self):
        print("[System] Shutting down...")
        self.tele.disconnect()
        self.running = False
        print("[System] Offline.")

    def run(self):
        if _ASYNC:
            try:
                asyncio.run(self._run_async())
            except Exception:
                # asyncio.run not available on all MicroPython builds
                loop = asyncio.get_event_loop()
                loop.run_until_complete(self._run_async())
        else:
            self._run_sync()


# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    system = AntigravitySystem()
    system.run()
