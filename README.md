# IAesp32 🧠 (PyCloude Runtime OS)

An advanced, AI-driven IoT operating system and distributed ecosystem built for the ESP32. This project acts as a bridge between artificial intelligence logic and edge hardware, allowing autonomous AI-generated JSON payloads to control physical environments dynamically.

## 🚀 The Ecosystem

This monorepo is divided into three main components:

### 1. PyCloude Runtime OS (`/Esp32`)
A custom **MicroPython** operating system for the ESP32. It abandons traditional hardcoded firmware in favor of a dynamic JSON command parser. An AI agent (or a human client) communicates structured schemas (e.g., `{"cmd": "adc_stream", "args": {"pin": 34}}`), and PyCloude instantiates, maps, and schedules the hardware requests on the fly using its intelligent `ResourceManager`.

- **MicroPython Asyncio**: Fully non-blocking event loop processing tasks concurrently.
- **Hardware Orchestration**: Dynamic drivers for GPIO, PWM, ADC, and UART that lock resources gracefully.
- **Motion Control**: Integrated `PyCoClaw` serial driver for robust Roboclaw motor control.
- **Network**: Dual-mode WiFi (STA/AP fallback), bidirectional `umqtt` telemetry, and an ultra-lightweight async HTTP server mapping to `LittleFS` storage.

### 2. Embedded Web Dashboard (`/Front/iot32_Frontend`)
A stunning, responsive React dashboard heavily optimized to be served directly from the ESP32's tiny flash memory (`LittleFS`, maintaining footprints well under 1MB).
- **React 18 & Vite**: Built for extreme performance.
- **CoreUI Components**: Industry-grade, premium UI/UX design components.
- **Real-Time Visualization**: Features a custom memory-map viewer to track live resource allocation on the ESP32 chip (inputs, outputs, and ADCs tracking).
- **Optimized Build Pipeline**: Features a custom builder (`npm run www`) that compresses JavaScript chunks to `.gz` format, allowing the ESP32 to serve them natively with zero computational overhead.

### 3. Server Ecosystem (`/Servidor`)
A scalable local **Node.js** backend acting as the central coordination layer for cloud-connected deployments.
- **Node.js & Express**: Provides a robust REST API.
- **MongoDB**: Provides persistent time-series storage for incoming IoT sensor data.
- **MQTT Bridge**: Interfaces directly with the ESP32's telemetry framework.

---

## 🛠️ Stack & Technologies

- **Hardware**: ESP32, Roboclaw Motor Controllers
- **Firmware**: MicroPython (Replacing Legacy C++/PlatformIO in `/ApEsp32`)
- **Transport**: REST HTTP/1.1, MQTT Pub/Sub
- **Frontend**: React.js, Vite, Bootstrap / CoreUI
- **Backend / Database**: Node.js, Express, MongoDB

## 📦 How to Deploy

1. Flash standard MicroPython onto your ESP32 using `esptool.py`.
2. Compile and compress the frontend dashboard natively: 
   ```bash
   cd Front/iot32_Frontend
   npm run www
   ```
3. Push the `Esp32/` backend components and the built frontend folder to the ESP32 using `mpremote`:
   ```bash
   cd Esp32/
   mpremote connect /dev/ttyUSB0 fs cp -r * :
   ```
4. Reset the board. The ESP32 will either connect to your WiFi or create an Access Point `ESP32-AP`, serving the dashboard at port `80`.
