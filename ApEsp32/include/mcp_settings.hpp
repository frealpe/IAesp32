
boolean settingsRead(); // Leer parámetros
void settingsReset();   // Reiniciar parámetros
boolean settingsSave(); // Guardar parámetros
// -------------------------------------------------------------------
// Leer settings.json
// -------------------------------------------------------------------
boolean settingsRead() {

  DynamicJsonDocument jsonSettings(capacitySettings); // Crear documento JSON

  File file =
      SPIFFS.open("/settings.json", "r"); // Abrir archivo en modo lectura

  if (deserializeJson(jsonSettings, file)) { // Deserializar JSON
    // Tomar los valores de Fábrica
    settingsReset();
    DeserializationError error = deserializeJson(jsonSettings, file);
    log("[ ERROR ] Falló la lectura de las configuraciones, tomando valores "
        "por defecto");
    if (error) {
      log("[ ERROR ] " + String(error.c_str()));
    }
    return false;
  } else {
    // -------------------------------------------------------------------
    // Dispositivo settings.json
    // -------------------------------------------------------------------
    device_config_file = jsonSettings["device_config_file"]; // Leer config file
    strlcpy(device_config_serial, jsonSettings["device_config_serial"],
            sizeof(device_config_serial)); // Leer config serial
    strlcpy(device_id, jsonSettings["device_id"],
            sizeof(device_id)); // Leer device ID
    strlcpy(device_old_user, jsonSettings["device_old_user"],
            sizeof(device_old_user)); // Leer old user
    strlcpy(device_old_password, jsonSettings["device_old_password"],
            sizeof(device_old_password)); // Leer old password
    // -------------------------------------------------------------------
    // WIFI Cliente settings.json
    // -------------------------------------------------------------------
    wifi_ip_static = jsonSettings["wifi_ip_static"]; // Leer IP estática
    strlcpy(wifi_ssid, jsonSettings["wifi_ssid"],
            sizeof(wifi_ssid)); // Leer SSID
    strlcpy(wifi_password, jsonSettings["wifi_password"],
            sizeof(wifi_password)); // Leer password
    strlcpy(wifi_ipv4, jsonSettings["wifi_ipv4"],
            sizeof(wifi_ipv4)); // Leer IPv4
    strlcpy(wifi_subnet, jsonSettings["wifi_subnet"],
            sizeof(wifi_subnet)); // Leer subnet
    strlcpy(wifi_gateway, jsonSettings["wifi_gateway"],
            sizeof(wifi_gateway)); // Leer gateway
    strlcpy(wifi_dns_primary, jsonSettings["wifi_dns_primary"],
            sizeof(wifi_dns_primary)); // Leer DNS primario
    strlcpy(wifi_dns_secondary, jsonSettings["wifi_dns_secondary"],
            sizeof(wifi_dns_secondary)); // Leer DNS secundario
    // -------------------------------------------------------------------
    // WIFI AP settings.json
    // -------------------------------------------------------------------
    ap_mode = jsonSettings["ap_mode"];                          // Leer modo AP
    strlcpy(ap_ssid, jsonSettings["ap_ssid"], sizeof(ap_ssid)); // Leer SSID AP
    strlcpy(ap_password, jsonSettings["ap_password"],
            sizeof(ap_password));                  // Leer pass AP
    ap_visibility = jsonSettings["ap_visibility"]; // Leer visibilidad AP
    ap_chanel = jsonSettings["ap_chanel"];         // Leer canal AP
    ap_connect = jsonSettings["ap_connect"];       // Leer conexiones AP
    // -------------------------------------------------------------------
    // Cloud settings.json
    // -------------------------------------------------------------------
    mqtt_cloud_enable = jsonSettings["mqtt_cloud_enable"]; // Leer enable MQTT
    strlcpy(mqtt_topic, jsonSettings["mqtt_topic"],
            sizeof(mqtt_topic)); // Leer Topic MQTT
    strlcpy(mqtt_user, jsonSettings["mqtt_user"],
            sizeof(mqtt_user)); // Leer user MQTT
    strlcpy(mqtt_password, jsonSettings["mqtt_password"],
            sizeof(mqtt_password)); // Leer pass MQTT
    strlcpy(mqtt_server, jsonSettings["mqtt_server"],
            sizeof(mqtt_server)); // Leer server MQTT
    strlcpy(mqtt_cloud_id, jsonSettings["mqtt_cloud_id"],
            sizeof(mqtt_cloud_id));            // Leer ID MQTT
    mqtt_port = jsonSettings["mqtt_port"];     // Leer port MQTT
    mqtt_retain = jsonSettings["mqtt_retain"]; // Leer retain MQTT
    mqtt_qos = jsonSettings["mqtt_qos"];       // Leer QoS MQTT
    mqtt_time_send = jsonSettings["mqtt_time_send"];
    mqtt_time_interval = jsonSettings["mqtt_time_interval"];
    mqtt_status_send = jsonSettings["mqtt_status_send"];

    file.close();
    log("[ INFO ] Lectura de las configuraciones correcta");
    return true;
  }
}
// -------------------------------------------------------------------
// Valores de Fábrica al settings.json
// -------------------------------------------------------------------
void settingsReset() {
  // -------------------------------------------------------------------
  // Dispositivo settings.json
  // -------------------------------------------------------------------
  device_config_file = true; // Habilita el archivo de configuración
  strlcpy(device_config_serial, deviceID().c_str(),
          sizeof(device_config_serial));             // Serial de configuración
  strlcpy(device_id, "adminmcp", sizeof(device_id)); // ID del dispositivo
  strlcpy(device_old_user, "adminmcp",
          sizeof(device_old_user)); // Usuario antiguo
  strlcpy(device_old_password, "adminmcp",
          sizeof(device_old_password)); // Contraseña antigua
  // -------------------------------------------------------------------
  // WIFI Cliente settings.json
  // -------------------------------------------------------------------
  wifi_ip_static = false;                           // IP estática habilitada
  strlcpy(wifi_ssid, "NICOLAS", sizeof(wifi_ssid)); // SSID WiFi
  strlcpy(wifi_password, "nicolas1308",
          sizeof(wifi_password));                         // Contraseña WiFi
  strlcpy(wifi_ipv4, "192.168.20.50", sizeof(wifi_ipv4)); // Dirección IP
  strlcpy(wifi_subnet, "255.255.255.0",
          sizeof(wifi_subnet)); // Máscara de subred
  strlcpy(wifi_gateway, "192.168.20.1", sizeof(wifi_gateway)); // Gateway
  strlcpy(wifi_dns_primary, "8.8.8.8",
          sizeof(wifi_dns_primary)); // DNS primario
  strlcpy(wifi_dns_secondary, "8.8.4.4",
          sizeof(wifi_dns_secondary)); // DNS secundario
  // -------------------------------------------------------------------
  // WIFI AP settings.json
  // -------------------------------------------------------------------
  ap_mode = false;                                       // Modo AP
  strlcpy(ap_ssid, deviceID().c_str(), sizeof(ap_ssid)); // SSID del AP
  strlcpy(ap_password, "adminmcp", sizeof(ap_password)); // Contraseña del AP
  ap_visibility = false;                                 // Visibilidad AP
  ap_chanel = 9;                                         // Canal AP
  ap_connect = 4;                                        // Conexiones máx AP
  // -------------------------------------------------------------------
  // Cloud settings.json
  // -------------------------------------------------------------------
  mqtt_cloud_enable = true;                                   // MQTT habilitado
  strlcpy(mqtt_topic, "Plc/Esp32", sizeof(mqtt_topic));       // Topic MQTT
  strlcpy(mqtt_user, "plcuser", sizeof(mqtt_user));           // Usuario MQTT
  strlcpy(mqtt_password, "plc", sizeof(mqtt_password));       // Contraseña MQTT
  strlcpy(mqtt_server, "192.168.20.20", sizeof(mqtt_server)); // Servidor MQTT
  strlcpy(mqtt_cloud_id, deviceID().c_str(),
          sizeof(mqtt_cloud_id)); // ID Cliente MQTT
  mqtt_port = 8883;               // Puerto MQTT por defecto (Seguro)
  mqtt_retain = false;            // Retención MQTT
  mqtt_qos = 0;                   // QoS MQTT
  mqtt_time_send = true;          // Envío por tiempo
  mqtt_time_interval = 1000;      // Intervalo envío
  mqtt_status_send = true;        // Envío estado
  log("[ INFO ] Se reiniciaron todos los valores por defecto"); // Log info
}
// -------------------------------------------------------------------
// Guardar settings.json
// -------------------------------------------------------------------
boolean settingsSave() {
  // StaticJsonDocument<capacitySettings> jsonSettings;
  DynamicJsonDocument jsonSettings(capacitySettings); // Crear documento JSON

  File file =
      SPIFFS.open("/settings.json", "w+"); // Abrir archivo para escritura

  if (file) { // Si el archivo se abrió correctamente
    // -------------------------------------------------------------------
    // Dispositivo settings.json
    // -------------------------------------------------------------------
    jsonSettings["device_config_file"] =
        device_config_file; // Guardar config file
    jsonSettings["device_config_serial"] =
        device_config_serial;                          // Guardar serial
    jsonSettings["device_id"] = device_id;             // Guardar device ID
    jsonSettings["device_old_user"] = device_old_user; // Guardar old user
    jsonSettings["device_old_password"] =
        device_old_password; // Guardar old password
    // -------------------------------------------------------------------
    // WIFI Cliente settings.json
    // -------------------------------------------------------------------
    jsonSettings["wifi_ip_static"] = wifi_ip_static;     // Guardar IP estática
    jsonSettings["wifi_ssid"] = wifi_ssid;               // Guardar SSID
    jsonSettings["wifi_password"] = wifi_password;       // Guardar password
    jsonSettings["wifi_ipv4"] = wifi_ipv4;               // Guardar IPv4
    jsonSettings["wifi_subnet"] = wifi_subnet;           // Guardar subnet
    jsonSettings["wifi_gateway"] = wifi_gateway;         // Guardar gateway
    jsonSettings["wifi_dns_primary"] = wifi_dns_primary; // Guardar DNS primario
    jsonSettings["wifi_dns_secondary"] =
        wifi_dns_secondary; // Guardar DNS secundario
    // -------------------------------------------------------------------
    // WIFI AP settings.json
    // -------------------------------------------------------------------
    jsonSettings["ap_mode"] = ap_mode;             // Guardar modo AP
    jsonSettings["ap_ssid"] = ap_ssid;             // Guardar SSID AP
    jsonSettings["ap_password"] = ap_password;     // Guardar password AP
    jsonSettings["ap_visibility"] = ap_visibility; // Guardar visibilidad AP
    jsonSettings["ap_chanel"] = ap_chanel;         // Guardar canal AP
    jsonSettings["ap_connect"] = ap_connect;       // Guardar conexiones AP
    // -------------------------------------------------------------------
    // Cloud settings.json
    // -------------------------------------------------------------------
    jsonSettings["mqtt_cloud_enable"] =
        mqtt_cloud_enable;                           // Guardar enable MQTT
    jsonSettings["mqtt_topic"] = mqtt_topic;         // Guardar Topic MQTT
    jsonSettings["mqtt_user"] = mqtt_user;           // Guardar user MQTT
    jsonSettings["mqtt_password"] = mqtt_password;   // Guardar password MQTT
    jsonSettings["mqtt_server"] = mqtt_server;       // Guardar server MQTT
    jsonSettings["mqtt_cloud_id"] = mqtt_cloud_id;   // Guardar ID MQTT
    jsonSettings["mqtt_port"] = mqtt_port;           // Guardar port MQTT
    jsonSettings["mqtt_retain"] = mqtt_retain;       // Guardar retain MQTT
    jsonSettings["mqtt_qos"] = mqtt_qos;             // Guardar QoS MQTT
    jsonSettings["mqtt_time_send"] = mqtt_time_send; // Guardar envío por tiempo
    jsonSettings["mqtt_time_interval"] =
        mqtt_time_interval;                              // Guardar intervalo
    jsonSettings["mqtt_status_send"] = mqtt_status_send; // Guardar estado

    serializeJsonPretty(jsonSettings, file); // Serializar a archivo
    file.close();                            // Cerrar archivo
    log("[ INFO ] Configuración Guardada correctamente");
    serializeJsonPretty(jsonSettings, Serial); // Mostrar en serial
    return true;
  } else {
    log("[ ERROR ] Falló el guardado de la configuración");
    return false;
  }
}