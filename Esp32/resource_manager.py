"""
resource_manager.py - PyCloude Hardware Coordinator
"""
from drivers.adc import ADC
from drivers.gpio import GPIO
from drivers.pwm import PWM

class ResourceManager:
    def __init__(self):
        self.adc = ADC(34)
        self.gpios = {}
        self.pwms = {}
        print("[ResourceManager] Initialized: ADC=GPIO34")

    def gpio_write(self, pin_num: int, state: int):
        if pin_num not in self.gpios:
            self.gpios[pin_num] = GPIO(pin_num, is_output=True)
        self.gpios[pin_num].set(bool(state))
        return {"resource": f"gpio_{pin_num}", "state": state}

    def pwm_write(self, pin_num: int, percent: int, freq: int = 1000):
        if pin_num not in self.pwms:
            self.pwms[pin_num] = PWM(pin_num, freq=freq)
        self.pwms[pin_num].set_duty_percent(percent)
        return {"resource": f"pwm_{pin_num}", "duty_hz": percent, "freq": freq}

    def status(self) -> dict:
        pins = {
            "34": {"mode": "ADC", "value": self.adc.read()}
        }
        for p, drv in self.gpios.items():
            pins[str(p)] = {"mode": "GPIO_OUT" if drv.is_output else "GPIO_IN", "value": drv.value}
        for p, drv in self.pwms.items():
            pins[str(p)] = {"mode": "PWM", "value": f"{drv.duty}%"}

        return {
            "system": "pycloude_runtime",
            "adc_34": self.adc.read(),
            "active_gpios": list(self.gpios.keys()),
            "active_pwms": list(self.pwms.keys()),
            "pins": pins
        }
