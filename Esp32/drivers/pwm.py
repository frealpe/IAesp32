"""
drivers/pwm.py - Pulse Width Modulation
"""
class PWM:
    def __init__(self, pin_num: int, freq: int = 1000):
        try:
            from machine import Pin, PWM as MPWM
            self._pwm = MPWM(Pin(pin_num, Pin.OUT), freq=freq)
        except ImportError:
            self._pwm = None
        self._duty = 0
        self.set_duty_percent(0)

    def set_duty_percent(self, percent: int):
        percent = max(0, min(100, percent))
        self._duty = percent
        if self._pwm:
            # 8-bit mapping (100% -> 255)
            # Actually standard MPWM duty works from 0-1023 depending on resolution
            # Standard esp32 duty default is 0-1023
            self._pwm.duty(int(percent * 10.23))

    @property
    def duty(self) -> int:
        return self._duty
