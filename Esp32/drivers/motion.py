"""
drivers/motion.py - PyCoClaw wrapper for Roboclaw Motor Controller
"""
from drivers.uart import UART

class PyCoClaw:
    def __init__(self, uart_id=1, tx_pin=17, rx_pin=16, baudrate=38400, address=0x80):
        self._uart = UART(uart_id, baudrate, tx=tx_pin, rx=rx_pin)
        self.address = address

    def _crc16(self, packet):
        crc = 0
        for byte in packet:
            crc = crc ^ (byte << 8)
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ 0x1021
                else:
                    crc = crc << 1
        return crc & 0xFFFF

    def _send_command(self, cmd, *data):
        packet = bytearray([self.address, cmd])
        for val in data:
            packet.append(val)
        crc = self._crc16(packet)
        packet.append(crc >> 8)
        packet.append(crc & 0xFF)
        self._uart.write(packet)

    def set_speed(self, motor: int, speed: int):
        """Set speed from -100 to 100"""
        speed = max(-100, min(100, speed))
        val = int((abs(speed) / 100.0) * 127)
        if motor == 1:
            cmd = 0 if speed >= 0 else 1
        else:
            cmd = 4 if speed >= 0 else 5
        self._send_command(cmd, val)

    def stop_all(self):
        self.set_speed(1, 0)
        self.set_speed(2, 0)
