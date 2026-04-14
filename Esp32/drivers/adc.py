"""
drivers/adc.py - Analog to Digital Converter
"""
class ADC:
    ATTEN_11DB = 3
    WIDTH_12BIT = 2

    def __init__(self, pin_num: int):
        try:
            from machine import Pin, ADC as MADC
            self._adc = MADC(Pin(pin_num))
            self._adc.atten(self.ATTEN_11DB)
            self._adc.width(self.WIDTH_12BIT)
        except ImportError:
            self._adc = None

    def read(self) -> int:
        if self._adc:
            return self._adc.read()
        return 0
