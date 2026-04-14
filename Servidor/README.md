# Servidor PC (Backend)

Este es el servidor principal del proyecto que se ejecuta en el PC. Se encarga de la lógica de negocio central, comunicación con bases de datos y orquestación entre el Frontend y el PLC.

## Requisitos Previos

*   **Node.js**: v16 o superior.
*   **Bases de Datos**:
    *   MongoDB
    *   PostgreSQL
*   **Broker MQTT**: Mosquitto (u otro compatible) corriendo en el puerto 1883.

## Instalación

Instala las dependencias del proyecto:

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz (puedes usar `.example.env` como guía) y configura las variables de entorno necesarias, como las conexiones a bases de datos y puertos.

## Ejecución

### Modo Desarrollo
Para ejecutar con `nodemon` (reinicio automático al guardar cambios):

```bash
npm run dev
```

### Modo Producción
Para iniciar el servidor normalmente:

```bash
npm start
```

---

# Referencia Técnica: Configuración RPIPLC V6

*La siguiente información es una referencia para la configuración de la Raspberry Pi (utilizada en el componente `ServidorPlc`), pero se mantiene aquí como documentación de respaldo.*

## 📡 Conexión inicial Raspberry Pi

- Usuario por defecto: `pi`
- Password por defecto: `raspberry`
- Conexión SSH: `ssh pi@<IP>`

### Primeros pasos en RPi
1. Cambiar contraseña SSH.
2. Habilitar interfaz gráfica VNC.
3. Instalar paquetes de Industrial Shields.
4. Definir IP estática (`sudo raspi-config`).

## ⚙️ Rutinas en C (Referencia)

### Instalación `librpiplc`
```bash
sudo apt update
sudo apt install git cmake build-essential -y
git clone https://github.com/Industrial-Shields/librpiplc.git
cd librpiplc
cmake -B build/ -DPLC_VERSION=RPIPLC_V6 -DPLC_MODEL=RPIPLC_58
cmake --build build/ -- -j$(nproc)
sudo cmake --install build/
sudo ldconfig
```

## 🐍 Rutinas en Python (Referencia)
Consultar [python3-librpiplc](https://github.com/Industrial-Shields/python3-librpiplc/releases/tag/v4.0.1) para la versión V6.

## 📡 MQTT (Instalación General)
```bash
sudo apt install mosquitto mosquitto-clients -y
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```