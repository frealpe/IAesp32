// -------------------------------------------------------------------
// Declaración de funciones
// -------------------------------------------------------------------
void TaskWifiReconnect(void *pvParamenters);
void wifiLoop();

// -------------------------------------------------------------------
// Tarea Loop WIFI & Reconectar modo Cliente
// -------------------------------------------------------------------
void TaskWifiReconnect(void *pvParamenters) {
  (void)pvParamenters;

  while (1) {
    vTaskDelay(10 / portTICK_PERIOD_MS);
    wifiLoop();
  }
}

// -------------------------------------------------------------------
// Tarea Loop MQTT & Reconectar
// -------------------------------------------------------------------
void TaskMqttReconnect(void *pvParamenters) {
  (void)pvParamenters;
  while (1) {
    vTaskDelay(10 / portTICK_PERIOD_MS);
    if ((WiFi.status() == WL_CONNECTED)) {
      if (mqtt_server[0] != '\0') {
        // llamar la función del loop mqtt
        mqttloop();
        // Enviar por MQTT el JSON
        if (mqttClient.connected()) {
          if (millis() - lasMsg > (mqtt_time_interval)) {
            lasMsg = millis();
            mqtt_publish();
            log("INFO: Mensaje enviado por MQTT...");
          }
        }
      }
    } else {
      // Si no hay wifi, dormir un poco más para no saturar
      vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
  }
}

// -------------------------------------------------------------------
// Tarea MQTT LED pestañeo
// -------------------------------------------------------------------
void TaskMQTTLed(void *pvParameters) {
  (void)pvParameters;
  while (1) {
    vTaskDelay(10 / portTICK_PERIOD_MS);

    if (mqttClient.connected()) {
      digitalWrite(MQTTLED, HIGH);
      vTaskDelay(50 / portTICK_PERIOD_MS);
      digitalWrite(MQTTLED, LOW);
      vTaskDelay(1000 / portTICK_PERIOD_MS);
    } else {
      digitalWrite(MQTTLED, LOW);
    }
  }
}
