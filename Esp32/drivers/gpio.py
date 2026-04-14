"""
drivers/gpio.py - General Purpose IO
"""
class GPIO:
    def __init__(self, pin_num: int, is_output: bool = True):
        self.is_output = is_output
        try:
            from machine import Pin
            mode = Pin.OUT if is_output else Pin.IN
            self._pin = Pin(pin_num, mode)
            self._state = False
            if is_output:
                self.set(False)
        except ImportError:
            # Mock
            self._pin = None
            self._state = False

    def set(self, value: bool):
        if self._pin:
            self._pin.value(1 if value else 0)
        self._state = value

    @property
    def value(self):
        if self._pin:
            # reading the pin value if configured or reading our internal state
            return bool(self._pin.value())
        return self._state
