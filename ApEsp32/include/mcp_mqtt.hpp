#include "mcp_header.hpp"
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// Helper for Time String (if not defined elsewhere)
// String longTimeStr(const unsigned long &t) {
//   char s[20]; // 00:00:00
//   sprintf(s, "%02lu:%02lu:%02lu", (t / 3600) % 24, (t / 60) % 60, t % 60);
//   return String(s);
// }

// -------------------------------------------------------------------
// Definir valores a las variables MQTT
// Mensajes de última voluntad
// -------------------------------------------------------------------
// Asumiendo mqtt_user definido en mcp_header.hpp
String mqtt_willTopic = PathMqttTopic("Plc/Esp32");
String mqtt_willMessage =
    "{\"connected\": false, \"username\": \"" + String(mqtt_user) + "\" }";
int mqtt_willQoS = 0;
boolean mqtt_willRetain = false;

// WiFiClient espClient; // Usamos espClient como estaba en mcp_mqtt.hpp
// original o cambiamos a wifiClient? El original usaba espClient, pero el nuevo
// usa wifiClient. Vamos a mantener espClient si wifiClient no esta Pero mejor
// usamos wifiClient para ser consistentes con el nuevo código si es posible.
// Sin embargo, mcp_header.hpp no tiene wifiClient.
// Vamos a usar 'espClient' que estaba declarado en el archivo original, pero lo
// renombramos a 'wifiClient' para pegar el codigo mas facil? No, mejor
// declaramos wifiClient para ser 100% igual al codigo copiado.
// -------------------------------------------------------------------
// Certificado CA (Raíz) para Mosquitto
// -------------------------------------------------------------------
const char *root_ca =
    "-----BEGIN CERTIFICATE-----\n"
    "MIIEAzCCAuugAwIBAgIUcoJlrbLpCh0cYLv6o+Ht24DHQDEwDQYJKoZIhvcNAQEL\n"
    "BQAwgZAxCzAJBgNVBAYTAkNPMQ4wDAYDVQQIDAVDYXVjYTEQMA4GA1UEBwwHUG9w\n"
    "YXlhbjERMA8GA1UECgwIVW5pY2F1Y2ExEzARBgNVBAsMCkF1dG9tYXRpY2ExDzAN\n"
    "BgNVBAMMBk1jcF9JQTEmMCQGCSqGSIb3DQEJARYXZnJlYWxwZUB1bmljYXVjYS5l\n"
    "ZHUuY28wHhcNMjYwMjE4MDAxMjI1WhcNMzYwMjE2MDAxMjI1WjCBkDELMAkGA1UE\n"
    "BhMCQ08xDjAMBgNVBAgMBUNhdWNhMRAwDgYDVQQHDAdQb3BheWFuMREwDwYDVQQK\n"
    "DAhVbmljYXVjYTETMBEGA1UECwwKQXV0b21hdGljYTEPMA0GA1UEAwwGTWNwX0lB\n"
    "MSYwJAYJKoZIhvcNAQkBFhdmcmVhbHBlQHVuaWNhdWNhLmVkdS5jbzCCASIwDQYJ\n"
    "KoZIhvcNAQEBBQADggEPADCCAQoCggEBAKQLJA4nII9BK/FDf+hMiGLvWgVSWqWX\n"
    "yLuDuny45w3xLfRGw3qseLimoHhnDsVYQNqaaaC/rNfN90hpHol6FROO/OYfRDf0\n"
    "8iBuoilU7tSpo+jzyKmpbCW32ckMpAeq3YTUecsLPJrLw5rBo17ZGHkSncIQBj2v\n"
    "+YfW/HT6l69rebapf1DlOIbbdc21XgGcBYB3IMj3iybiChxeZdey7hdNt4FPC+Iv\n"
    "5+jN28T5px/d7UwT4jUPI8iBblHU1Bsi59vTQg1vsH/VPOjBxHTYvbfjO68pzLwF\n"
    "0dn5rvczuxonmPYmSXQYCC9n9xurvZMLMnQuhvsVDs1RY0E8+kBSNNMCAwEAAaNT\n"
    "MFEwHQYDVR0OBBYEFHeRrr10oSW6C3p7GZPUtRyLOi37MB8GA1UdIwQYMBaAFHeR\n"
    "rr10oSW6C3p7GZPUtRyLOi37MA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL\n"
    "BQADggEBAJmOH6PMnI6fg1FzfZuw0bU62lTHZWJmUCFziM3bpRj7szF85N3qYex6\n"
    "HdkTQdAoY+i8rDBnwAllgwsUHLu8pvJqxPAU6wVsI9LsSucfGZWIRgVmmd77FEjn\n"
    "r2tra1o5TAYr92gboMbzJVWbatKqcYoeUeRLaHrUsHuVOoBfWNxPlRmUygTGd7bP\n"
    "fEdFke8kpI5NH5DC1MSYSFXZFp2FohK4wfUBqGZIl+iyphGlzagmtTP3t30Yi+Jw\n"
    "AEKph9IcCRdE6JByab/lvCcUOdvpjiEFnoe+xI7b9zAy00lXN3+xFbSEQ10I62/W\n"
    "Kr7IPNJeVnVnpd1SaZQQal4mz2hYNTo=\n"
    "-----END CERTIFICATE-----\n";

WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

char topic[150];
String mqtt_data = "";

long lastMqttReconnectAttempt = 0;
long lasMsg = 0;

// -------------------------------------------------------------------
// DEFINICION DE FUNCIONES
// -------------------------------------------------------------------
boolean mqtt_connect();
void callback(char *topic, byte *payload, unsigned int length);
void mqttloop();
void mqtt_publish();
String Json();
void mqtt_response(String method, String type, String msg, String value);
// void apiPostRestart(String origin); // Comentado si no existe
// void apiPostRestore(String origin); // Comentado si no existe

// -------------------------------------------------------------------
// MQTT Connect
// -------------------------------------------------------------------
boolean mqtt_connect() {
  int target_port = mqtt_port;
  bool secure_attempt = (target_port == 8883);

  // Configurar Certificado si es puerto seguro (e.g. 8883)
  if (secure_attempt) {
    if (timeSynced) {
      wifiClient.setCACert(root_ca);
      log("MQTT: Usando conexión segura (TLS) con Verificación de Hora");
    } else {
      wifiClient.setInsecure();
      log("MQTT: Usando conexión segura (TLS) SIN VERIFICACIÓN (NTP no "
          "disponible)");
    }
  } else {
    wifiClient.setInsecure();
    log("MQTT: Usando conexión normal");
  }

  mqttClient.setServer(mqtt_server, target_port);
  mqttClient.setCallback(callback);
  mqttClient.setBufferSize(1024 * 5); // Establecer buffer antes de conectar
  log("MQTT: Intentando conexión al Broker MQTT en " + String(mqtt_server) +
      ":" + String(target_port) + "...");

  if (mqttClient.connect(mqtt_cloud_id, mqtt_user, mqtt_password,
                         mqtt_willTopic.c_str(), mqtt_willQoS, mqtt_willRetain,
                         mqtt_willMessage.c_str())) {
    log("INFO: Conectado al Broker MQTT -> " + String(mqtt_server));
    log("INFO: Buffer MQTT Size: " + String(mqttClient.getBufferSize()) +
        " Bytes");

    String topic_subscribe = String(mqtt_topic);
    topic_subscribe.toCharArray(topic, 150);

    if (mqttClient.subscribe(topic)) {
      log("INFO: Suscrito al tópico: " + String(topic));
    } else {
      log("ERROR: MQTT - Falló la suscripción");
    }

    String mqtt_willMessageCon =
        "{\"connected\": true, \"username\": \"" + String(mqtt_user) + "\" }";
    mqttClient.publish(mqtt_willTopic.c_str(), mqtt_willMessageCon.c_str());
    return true;
  } else {
    log("ERROR: MQTT - Falló, código de error = " + String(mqttClient.state()));

    // [NEW] Fallback a puerto inseguro si el puerto seguro falló
    if (secure_attempt) {
      log("[ WARNING ] Reintentando conexión en modo inseguro (Puerto "
          "1883)...");
      target_port = 1883;
      wifiClient.setInsecure();
      mqttClient.setServer(mqtt_server, target_port);

      if (mqttClient.connect(mqtt_cloud_id, mqtt_user, mqtt_password,
                             mqtt_willTopic.c_str(), mqtt_willQoS,
                             mqtt_willRetain, mqtt_willMessage.c_str())) {
        log("INFO: Conectado al Broker MQTT (MODO INSEGURO) -> " +
            String(mqtt_server));
        return true;
      } else {
        log("ERROR: MQTT - También falló la conexión insegura.");
      }
    }
    return false;
  }
}

// -------------------------------------------------------------------
// Manejo de los Mensajes Entrantes
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// Manejo de los Mensajes Entrantes
// -------------------------------------------------------------------
void callback(char *topic, byte *payload, unsigned int length) {
  // Inicializa un String vacío para almacenar el comando recibido
  String command = "";
  // Convierte el array de char del tópico a un objeto String para facilitar su
  // manejo
  String str_topic(topic);

  // Recorre el payload (mensaje recibido) byte a byte
  for (int16_t i = 0; i < length; i++) {
    // Concatena cada carácter al String 'command'
    command += (char)payload[i];
  }

  // Elimina espacios en blanco al inicio y al final del comando
  command.trim();
  // Imprime en el log el tópico por el que llegó el mensaje
  log("INFO: MQTT Tópico  --> " + str_topic);
  // Imprime en el log el contenido del mensaje recibido
  log("INFO: MQTT Mensaje --> " + command);

  // Crea un documento JSON dinámico con capacidad de 1024 bytes
  DynamicJsonDocument JsonCommand(1024);
  // Intenta deserializar (parsear) el string 'command' a un objeto JSON
  DeserializationError error = deserializeJson(JsonCommand, command);

  // Si ocurre un error en la deserialización (no es un JSON válido)
  if (error) {
    // Responde vía MQTT indicando el error de formato
    mqtt_response("Desconocido", "Desconocido", "",
                  "{\"msg\": \"¡Error, no es un formato JSON!\"}");
    // Sale de la función
    return;
  }

  // Ignorar mensajes propios para evitar bucle infinito.
  // Verifica si el JSON contiene la clave "deviceMqttId".
  // Si la tiene, se asume que es una respuesta enviada por este mismo
  // dispositivo.
  if (JsonCommand.containsKey("deviceMqttId")) {
    // Si es un mensaje propio, sale de la función sin procesarlo
    return;
  }

  // Verifica si el JSON contiene las claves obligatorias 'method' y 'type'
  if (!JsonCommand.containsKey("method") || !JsonCommand.containsKey("type")) {
    // Si faltan, responde indicando que el formato JSON no es soportado
    mqtt_response("Desconocido", "Desconocido", "",
                  "{\"msg\": \"¡Error, formato JSON no soportado!\" }");
    // Sale de la función
    return;
  }

  // Comienza el manejo de comandos específicos según 'method' y 'type'

  // Caso: Método POST y Tipo RELAYS (Control de Relés)
  if (strcmp(JsonCommand["method"], "POST") == 0 &&
      strcmp(JsonCommand["type"], "RELAYS") == 0) {
    // Ejemplo de payload esperado:
    // {"method": "POST", "type": "RELAYS", "data":{"protocol": "MQTT",
    // "output": "RELAY1", "value": false }}

    // Llama a la función apiPostOnOffRelays con los datos recibidos.
    // Retorna true si la operación fue existosa y cambió el estado.
    if (apiPostOnOffRelays(JsonCommand["data"])) {
      // Guarda la configuración (estado de los relés) en memoria permanente
      if (settingsSave()) {
        // Responde con éxito y el nuevo estado (true)
        mqtt_response(JsonCommand["method"], JsonCommand["type"],
                      JsonCommand["data"]["output"], "{\"value\": true}");
        // Publica el estado actual de todos los sensores/actuadores
        mqtt_publish();
      }
    } else {
      // Si apiPostOnOffRelays retorna false (ej. apagado o sin cambio)
      if (settingsSave()) {
        // Responde con éxito y el estado (false)
        mqtt_response(JsonCommand["method"], JsonCommand["type"],
                      JsonCommand["data"]["output"], "{\"value\": false}");
        // Publica el estado actual
        mqtt_publish();
      }
    }
  }
  // Caso: Método POST y Tipo DIMMER (Control de Dimmer)
  else if (strcmp(JsonCommand["method"], "POST") == 0 &&
           strcmp(JsonCommand["type"], "DIMMER") == 0) {
    // Ejemplo: {"method": "POST", "type": "DIMMER", "data":{"protocol": "MQTT",
    // "output": "Dimmer", "value": 50 }}

    // Ejecuta la función para ajustar el dimmer con los datos recibidos
    apiPostDimmer(JsonCommand["data"]);
    // Envía respuesta al cliente MQTT confirmando el nuevo valor del dimmer
    mqtt_response(JsonCommand["method"], JsonCommand["type"],
                  JsonCommand["data"]["output"],
                  "{ \"value\":" + String(dim) + "}");
    // Publica el estado actual general
    mqtt_publish();
  }
  // Caso: Método POST y Tipo RESTART (Reiniciar Dispositivo)
  else if (strcmp(JsonCommand["method"], "POST") == 0 &&
           strcmp(JsonCommand["type"], "RESTART") == 0) {
    // Ejemplo: {"method": "POST", "type": "RESTART", "origin": "MQTT"}

    // Responde confirmando que se va a reiniciar
    mqtt_response(JsonCommand["method"], JsonCommand["type"], "",
                  F("{\"restart\": true}"));
    // Pequeña pausa para asegurar el envío del mensaje
    delay(100);
    // Llama a la función para reiniciar el dispositivo
    apiPostRestart(JsonCommand["origin"]);
  }
  // Caso: Método POST y Tipo RESTORE (Restaurar Fábrica)
  else if (strcmp(JsonCommand["method"], "POST") == 0 &&
           strcmp(JsonCommand["type"], "RESTORE") == 0) {
    // Ejemplo: {"method": "POST", "type": "RESTORE", "origin": "MQTT"}

    // Responde confirmando la restauración
    mqtt_response(JsonCommand["method"], JsonCommand["type"], "",
                  F("{\"restore\": true}"));
    delay(100);
    delay(100); // Pausa extra
    // Ejecuta la restauración de fábrica
    apiPostRestore(JsonCommand["origin"]);
  }
  // Caso: Método POST y Tipo GPIO (Control Genérico de Pines)
  else if (strcmp(JsonCommand["method"], "POST") == 0 &&
           strcmp(JsonCommand["type"], "GPIO") == 0) {
    // CONTROL GENERICO DE GPIO
    // Ejemplo: {"method": "POST", "type": "GPIO", "data": {"pin": 26, "state":
    // true}}

    // Extrae el número de pin del objeto 'data'
    int pin = JsonCommand["data"]["pin"];
    // Extrae el estado deseado (true/false)
    bool state = JsonCommand["data"]["state"];

    // Configura el pin como SALIDA
    pinMode(pin, OUTPUT);
    // Escribe el estado en el pin (HIGH/LOW)
    digitalWrite(pin, state);

    // Responde confirmando la acción y el estado aplicado
    mqtt_response(JsonCommand["method"], JsonCommand["type"], String(pin),
                  "{\"value\": " + String(state ? "true" : "false") + "}");
  }
  // Caso por defecto: Comando no reconocido
  else {
    // Responde indicando error de comando no soportado
    mqtt_response("Desconocido", "Desconocido", "",
                  "{ \"msg\": \"¡Error, no es un comando soportado!\" }");
  }
}

// -------------------------------------------------------------------
// Manejo de los Mensajes de respuesta
// -------------------------------------------------------------------
void mqtt_response(String method, String type, String msg, String value) {
  String data = "";
  DynamicJsonDocument jsonDoc(10240);
  DynamicJsonDocument jsonData(10240);
  jsonData.clear();
  deserializeJson(jsonData, value);

  jsonDoc["method"] = method;
  jsonDoc["type"] = type;
  // Add device ID to prevent self-processing loop
  jsonDoc["deviceMqttId"] = mqtt_cloud_id;

  JsonObject dataObj = jsonDoc.createNestedObject("data");
  dataObj["msg"] = msg;
  dataObj["value"] = jsonData;
  serializeJson(jsonDoc, data);

  String topic = "Plc/Esp32"; // Simulando PathMqttTopic("response")
  mqttClient.publish(topic.c_str(), data.c_str());
}

// -------------------------------------------------------------------
// Manejo de los Mensajes Salientes
// -------------------------------------------------------------------
void mqtt_publish() {
  String topic = String(mqtt_topic);
  mqtt_data = Json();
  mqttClient.publish(topic.c_str(), mqtt_data.c_str());
  mqtt_data = "";
}

// -------------------------------------------------------------------
// JSON con información del Dispositivo
// -------------------------------------------------------------------
String Json() {
  String response;
  DynamicJsonDocument jsonDoc(3000);
  readSensor();
  // jsonDoc["deviceMqttId"] = mqtt_cloud_id;
  jsonDoc["deviceMqttId"] = mqtt_cloud_id;
  // jsonDoc["deviceSerial"] = deviceID();
  // jsonDoc["deviceManufacturer"] = device_manufacturer;
  // jsonDoc["deviceFwVersion"] = device_fw_version;
  // jsonDoc["deviceHwVersion"] = device_hw_version;
  // jsonDoc["deviceSdk"] = ESP.getSdkVersion();
  JsonObject dataObj = jsonDoc.createNestedObject("data");
  // dataObj["deviceRamSizeKB"] = ESP.getHeapSize() / 1024;
  // dataObj["deviceRamAvailableKB"] = ESP.getFreeHeap() / 1024;
  // dataObj["deviceSpiffsSizeKB"] = SPIFFS.totalBytes() / 1024;
  // dataObj["deviceSpiffsUsedKB"] = SPIFFS.usedBytes() / 1024;
  // dataObj["deviceActiveTimeSeconds"] = longTimeStr(millis() / 1000);
  // dataObj["deviceCpuClockMhz"] = getCpuFrequencyMhz();
  // dataObj["deviceFlashSizeMB"] = ESP.getFlashChipSize() / (1024.0 * 1024);
  // Valores Hardware Reales
  // dataObj["deviceRelay1Status"] = RELAY1_STATUS ? true : false;
  // dataObj["deviceRelay2Status"] = RELAY2_STATUS ? true : false;
  // dataObj["deviceDimmer"] = dim;   dataObj["deviceCpuTempC"] =
  // TempCPUValue();
  dataObj["deviceADCValue"] = adcValue;
  // dataObj["deviceRestarts"] = device_restart;
  // dataObj["wifiRssiStatus"] = WiFi.RSSI();
  // dataObj["wifiQuality"] = getRSSIasQuality(WiFi.RSSI());
  // dataObj["wifiIPv4"] = ipStr(WiFi.localIP());
  // jsonDoc["jsonVersion"] = "1.0.0";
  serializeJson(jsonDoc, response);
  return response;
}

// -------------------------------------------------------------------
// MQTT Loop Principal
// -------------------------------------------------------------------
void mqttloop() {
  if (mqtt_cloud_enable) {
    if (!mqttClient.connected()) {
      long now = millis();
      // Intentar reconectar cada 10 segundos
      if (now - lastMqttReconnectAttempt > 5000) {
        lastMqttReconnectAttempt = now;
        if (mqtt_connect()) {
          lastMqttReconnectAttempt = 0;
        }
      }
    } else {
      mqttClient.loop();
      // setOffSingle(MQTTLED);
    }
  }
}
