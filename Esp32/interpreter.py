"""
interpreter.py - PyCloude Command Executor
Executes structured JSON commands sent by the AI core (e.g. adc_stream, move_motor, gpio_write).
"""
import json
import time

class Interpreter:
    def __init__(self, system):
        self.system = system

    def execute(self, payload) -> dict:
        """Parse structured PyCloude JSON commands."""
        try:
            if isinstance(payload, (str, bytes)):
                data = json.loads(payload)
            else:
                data = payload
            
            cmd = data.get("cmd")
            args = data.get("args", {})
            
            if not cmd:
                return {"error": "missing_cmd"}
            
            func_name = f"_cmd_{cmd}"
            if hasattr(self, func_name):
                return getattr(self, func_name)(args)
            else:
                return {"error": "unknown_cmd", "cmd": cmd}
                
        except Exception as e:
            return {"error": "execution_failed", "details": str(e)}

    # ─── System ───────────────────────────────────────────────
    def _cmd_status_check(self, args):
        return self.system.hw.status()

    # ─── GPIO ─────────────────────────────────────────────────
    def _cmd_gpio_write(self, args):
        pin = args.get("pin")
        state = args.get("state", 0)
        if pin is None:
            return {"error": "missing_pin"}
        return self.system.hw.gpio_write(pin, state)

    # ─── PWM ──────────────────────────────────────────────────
    def _cmd_pwm_auto(self, args):
        # Fallback to pin 25 if not provided (old dimmer pin)
        pin = args.get("pin", 25)
        duty = args.get("duty", 512)
        freq = args.get("freq", 1000)
        # Using percent 0-100 logic or raw 0-1023 logic. Duty 512 is ~50%.
        percent = int((duty / 1023.0) * 100)
        return self.system.hw.pwm_write(pin, percent, freq)

    # ─── ADC ──────────────────────────────────────────────────
    def _cmd_adc_stream(self, args):
        # Auto select pin 34 if not specified
        pin = args.get("pin", 34)
        samples = args.get("samples", 100)
        interval_ms = args.get("interval_ms", 500)
        
        def _sample():
            if pin == 34:
                val = self.system.hw.adc.read()
            else:
                val = 0 # In a real implementation we'd read dynamic ADC pins
            
            # Push securely to MQTT
            if getattr(self.system, "tele", None):
                self.system.tele.publish_sample(pin, val)
                
        task_id = f"adc_stream_{pin}_{time.time()}"
        # Convert ms back to sec float for scheduler
        self.system.scheduler.schedule(task_id, interval_ms / 1000.0, _sample, iterations=samples)
        return {"status": "streaming", "task_id": task_id, "pin": pin, "samples": samples}


