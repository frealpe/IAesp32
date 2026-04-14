"""
drivers/uart.py - Universal Asynchronous Receiver-Transmitter
"""
class UART:
    def __init__(self, uart_id: int, baudrate: int = 38400, tx: int = 17, rx: int = 16):
        try:
            from machine import UART as MUART
            self._uart = MUART(uart_id, baudrate=baudrate, tx=tx, rx=rx)
        except ImportError:
            self._uart = None

    def write(self, data: bytes):
        if self._uart:
            self._uart.write(data)

    def read(self, limit: int = -1) -> bytes:
        if self._uart:
            if limit > 0:
                val = self._uart.read(limit)
            else:
                val = self._uart.read()
            return val if val else b""
        return b""
