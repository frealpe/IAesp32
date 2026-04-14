#include "mcp_LedBlink.hpp"
#include "mcp_header.hpp"

// -------------------------------------------------------------------
// Genera un log en el puerto Serial
// -------------------------------------------------------------------
void log(String s) { Serial.println(s); }
// -------------------------------------------------------------------
// Definir la Plataforma
// -------------------------------------------------------------------
String platform() {
// Optiene la plataforma de hardware
#ifdef ARDUINO_ESP32_DEV
  return "ESP32";
#endif
}
// -------------------------------------------------------------------
// De HEX a String
// -------------------------------------------------------------------
String hexStr(const unsigned long &h, const byte &l = 8) {
  String s;
  s = String(h, HEX);
  s.toUpperCase();
  s = ("00000000" + s).substring(s.length() + 8 - l);
  return s;
}
// -------------------------------------------------------------------
// Crear un ID unico desde la direccion MAC
// -------------------------------------------------------------------
String idUnique() {
  // Retorna los ultimos 4 Bytes del MAC rotados
  char idunique[15];
  uint64_t chipid = ESP.getEfuseMac();
  uint16_t chip = (uint16_t)(chipid >> 32);
  snprintf(idunique, 15, "%04X", chip);
  return idunique;
}
// -------------------------------------------------------------------
// Declaraciones Forward de Settings
// -------------------------------------------------------------------
boolean settingsSave();
void settingsReset();

// -------------------------------------------------------------------
// Número de serie del Dispositivo único
// -------------------------------------------------------------------
String deviceID() {
  return String(platform()) + hexStr(ESP.getEfuseMac()) + String(idUnique());
}
// -------------------------------------------------------------------
// Configurar los Pines de Salida WIFI - MQTT
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// Configurar los Pines de Salida WIFI - MQTT - RELAYS - DIMMER
// -------------------------------------------------------------------
void settingPines() {
  pinMode(WIFILED, OUTPUT);
  pinMode(MQTTLED, OUTPUT);
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  pinMode(ADC_PIN, INPUT);
  analogSetAttenuation(ADC_11db); // Rango hasta ~3.3V
  analogReadResolution(12);       // Resolución 12 bits (0-4095)

  // PWM Setup
  ledcSetup(ledChannel, freq, resolution);
  ledcAttachPin(DIMMER, ledChannel);

  setOffSingle(WIFILED);
  setOffSingle(MQTTLED);
  setOffSingle(RELAY1);
  setOffSingle(RELAY2);
  ledcWrite(ledChannel, 0);
}
// -------------------------------------------------------------------
// Convierte un char a IP
// -------------------------------------------------------------------
uint8_t ip[4]; // Variable función convertir string a IP
IPAddress CharToIP(const char *str) {
  sscanf(str, "%hhu.%hhu.%hhu.%hhu", &ip[0], &ip[1], &ip[2], &ip[3]);
  return IPAddress(ip[0], ip[1], ip[2], ip[3]);
}
// -------------------------------------------------------------------
// Retorna IPAddress en formato "n.n.n.n" de IP a String
// -------------------------------------------------------------------
String ipStr(const IPAddress &ip) {
  String sFn = "";
  for (byte bFn = 0; bFn < 3; bFn++) {
    sFn += String((ip >> (8 * bFn)) & 0xFF) + ".";
  }
  sFn += String(((ip >> 8 * 3)) & 0xFF);
  return sFn;
}

// -------------------------------------------------------------------
// Crear un path para los Topicos en MQTT
// -------------------------------------------------------------------
String PathMqttTopic(String topic) {
  return String(String(mqtt_user) + "/" + String(mqtt_cloud_id) + "/" + topic);
}

// -------------------------------------------------------------------
// Leer el valor del ADC Canal 0 (GPIO 34)
// -------------------------------------------------------------------
void readSensor() {
  adcValue = analogRead(ADC_PIN);
  log(String("ADC Value: ") + String(adcValue));
}

// -------------------------------------------------------------------
// Sensor Temp Interno CPU
// -------------------------------------------------------------------
#ifdef __cplusplus
extern "C" {
#endif
uint8_t temprature_sens_read();
#ifdef __cplusplus
}
#endif
uint8_t temprature_sens_read();

float temp_cpu;
// -------------------------------------------------------------------
// Retorna la temperatura del CPU
// -------------------------------------------------------------------
float TempCPUValue() { return temp_cpu = (temprature_sens_read() - 32) / 1.8; }

#define SECS_PER_MIN (60UL)
#define SECS_PER_HOUR (3600UL)
#define SECS_PER_DAY (SECS_PER_HOUR * 24UL)

int hour(time_t t) { return (t / SECS_PER_HOUR) % 24; }
int minute(time_t t) { return (t / SECS_PER_MIN) % 60; }
int second(time_t t) { return t % 60; }

// -------------------------------------------------------------------
// Retorna segundos como "d:hh:mm:ss"
// -------------------------------------------------------------------
String longTimeStr(const unsigned long &t) {
  String s = String(t / SECS_PER_DAY) + ':';
  if (hour(t) < 10) {
    s += '0';
  }
  s += String(hour(t)) + ':';
  if (minute(t) < 10) {
    s += '0';
  }
  s += String(minute(t)) + ':';
  if (second(t) < 10) {
    s += '0';
  }
  s += String(second(t));
  return s;
}

// -------------------------------------------------------------------
// Función para operar los Relay de forma Global -> API, MQTT, WS
// -------------------------------------------------------------------
boolean apiPostOnOffRelays(String command) {
  DynamicJsonDocument JsonCommand(320);
  deserializeJson(JsonCommand, command);

  log("INFO: Comando enviado desde: " + JsonCommand["protocol"].as<String>() +
      " <=> " + JsonCommand["output"].as<String>() + " <=> " +
      JsonCommand["value"].as<String>());

  if (JsonCommand["value"] == true) {
    digitalWrite(JsonCommand["output"] == "RELAY1" ? RELAY1 : RELAY2, HIGH);
    JsonCommand["output"] == "RELAY1" ? RELAY1_STATUS = HIGH
                                      : RELAY2_STATUS = HIGH;
    return true;
  } else if (JsonCommand["value"] == false) {
    digitalWrite(JsonCommand["output"] == "RELAY1" ? RELAY1 : RELAY2, LOW);
    JsonCommand["output"] == "RELAY1" ? RELAY1_STATUS = LOW
                                      : RELAY2_STATUS = LOW;
    return false;
  } else {
    log("WARNING: Comando NO permitido");
    return false;
  }
}

// -------------------------------------------------------------------
// Función para el dimmer dispositivo Global -> API, MQTT, WS
// -------------------------------------------------------------------
void apiPostDimmer(String dimmer) {
  DynamicJsonDocument JsonDimmer(320);
  deserializeJson(JsonDimmer, dimmer);

  log("INFO: Comando enviado desde: " + JsonDimmer["protocol"].as<String>() +
      " => " + JsonDimmer["output"].as<String>() + " => " +
      JsonDimmer["value"].as<String>() + " %");

  dim = JsonDimmer["value"].as<int>();

  if (dim > 100)
    dim = 100;
  if (dim < 0)
    dim = 0;

  if (settingsSave())
    ledcWrite(ledChannel, dim * 2.55);
}

// -------------------------------------------------------------------
// Retorna la calidad de señal WIFI en % => 0 - 100%
// -------------------------------------------------------------------
int getRSSIasQuality(int RSSI) {
  int quality = 0;
  if (RSSI <= -100) {
    quality = 0;
  } else if (RSSI >= -50) {
    quality = 100;
  } else {
    quality = 2 * (RSSI + 100);
  }
  return quality;
}

// Declaraciones Forward de Settings para apiPostRestore
// boolean settingsSave();
// void settingsReset();

// -------------------------------------------------------------------
// Función para reiniciar el dispositivo
// -------------------------------------------------------------------
void apiPostRestart(String origin) {
  log("INFO: Dispositivo reiniciado desde: " + origin);
  Serial.flush();
  ESP.restart();
}

// -------------------------------------------------------------------
// Función para restablecer el dispositivo
// -------------------------------------------------------------------
void apiPostRestore(String origin) {
  settingsReset(); // Todo a fabrica
  if (settingsSave()) {
    log("INFO: Dispositivo restablecido desde: " + origin);
    Serial.flush();
    ESP.restart();
  }
}