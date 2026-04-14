#include <Arduino.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <SPIFFS.h>

#include "mcp_functions.hpp"
#include "mcp_header.hpp"
#include "mcp_mqtt.hpp"
#include "mcp_settings.hpp"
#include "mcp_tasks.hpp"
#include "mcp_wifi.hpp"

bool timeSynced = false;

void setup() {
  Serial.begin(115200);
  setCpuFrequencyMhz(240);
  EEPROM.begin(256);
  EEPROM.get(Restart_Address, device_restart);
  device_restart++;
  EEPROM.put(Restart_Address, device_restart);
  EEPROM.commit();
  EEPROM.end();
  log("\n[INFO]Iniciando dispositivo MCP");
  log("\n[INFO]Reinicios: " + String(device_restart));
  log("\n[INFO]Setup corriendo en el Core: " + String(xPortGetCoreID()));
  if (!SPIFFS.begin(true)) {
    log("\n[ERROR]Error al iniciar el sistema de archivos SPIFFS");
  }

  if (!settingsRead()) {
    settingsSave();
    log("\n[ERROR]Error al leer el archivo de configuraciones Settings.json");
  }

  settingPines();
  wifi_setup();
  initESPNow(); // Inicializar ESP-NOW despues del WiFi para compartir canal
  // Crear Tarea Reconexión WIFI
  xTaskCreate(TaskWifiReconnect, "TaskWifiReconnect", 1024 * 6, NULL, 3, NULL);
  // Crear Tarea Reconexión MQTT (Pila aumentada a 8K)
  xTaskCreate(TaskMqttReconnect, "TaskMqttReconnect", 1024 * 8, NULL, 2, NULL);
  // LED MQTT Task
  xTaskCreate(TaskMQTTLed, "TaskMQTTLed", 2048, NULL, 1, NULL);
}

// Loop
void loop() {
  //
}