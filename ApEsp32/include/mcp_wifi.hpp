#include <DNSServer.h> // Librería para el servidor DNS (necesario para portal cautivo en modo AP)
#include <ESPmDNS.h> // Librería para mDNS (permite acceder como nombre.local)
#include <WiFi.h>    // Librería para gestionar la conexión WiFi (STA y AP)
#include <time.h>

// Puerto predeterminado para el servidor DNS
const byte DNSSERVER_PORT = 53;
DNSServer dnsServer; // Objeto del servidor DNS

// IP y Máscara de subred predeterminadas para el Modo Punto de Acceso (AP)
IPAddress ap_IPv4(192, 168, 4, 1);
IPAddress ap_subnet(255, 255, 255, 0);

// Constantes informativas sobre los modos WiFi:
// WiFi.mode(WIFI_STA)      - El ESP32 actúa como un cliente (se conecta a un
// router) WiFi.mode(WIFI_AP)       - El ESP32 actúa como un punto de acceso
// (crea su propia red) WiFi.mode(WIFI_AP_STA)   - El ESP32 actúa como un punto
// de acceso y como un cliente a la vez

int wifi_mode =
    WIFI_STA; // Variable para almacenar el modo actual (inicialmente Station)
bool wifi_change =
    false; // Bandera para indicar si ha habido un cambio de estado/modo

// Variables para el control de tiempos (timers) para reconexión y switches de
// modo
unsigned long previousMillisWIFI = 0;
unsigned long previousMillisAP = 0;
unsigned long intervalWIFI = 30000; // Intervalo de 30 Segundos para chequeos

// Hostname para acceder al dispositivo: http://adminesp32.local (si device_id
// no cambia)
const char *esp_hostname = device_id;

// -------------------------------------------------------------------
// Iniciar WIFI Modo AP (Punto de Acceso)
// Crea una red WiFi propia para que otros dispositivos se conecten.
// -------------------------------------------------------------------
void startAP() {
  log("[ INFO ] Iniciando Modo AP");
  WiFi.disconnect(true); // Desconecta cualquier conexión previa
  WiFi.softAPConfig(ap_IPv4, ap_IPv4,
                    ap_subnet); // Configura IP, Gateway y Subnet del AP
  WiFi.hostname(esp_hostname);  // Establece el nombre del host
  // Inicia el AP con las credenciales y configuraciones definidas
  WiFi.softAP(ap_ssid, ap_password, ap_chanel, ap_visibility, ap_connect);
  log("[ INFO ] WiFi AP " + String(ap_ssid) + " - IP " +
      ipStr(WiFi.softAPIP()));

  // Configura el servidor DNS para redirigir todo al ESP32 (Portal Cautivo)
  dnsServer.setErrorReplyCode(DNSReplyCode::ServerFailure);
  dnsServer.start(DNSSERVER_PORT, "*", ap_IPv4);

  wifi_mode = WIFI_AP; // Actualiza el estado global
}

// -------------------------------------------------------------------
// Sincronizar Hora mediante NTP (Necesario para SSL/TLS)
// -------------------------------------------------------------------
void syncTime() {
  log("[ INFO ] Sincronizando hora mediante NTP...");
  // Configuración para UTC-5 (basado en el tiempo local del usuario)
  configTime(-5 * 3600, 0, "pool.ntp.org", "time.google.com");

  struct tm timeinfo;
  byte retry = 0;
  while (!getLocalTime(&timeinfo) && retry < 15) {
    retry++;
    log("[ WARNING ] Esperando sincronización de hora (Intento " +
        String(retry) + ")...");
    vTaskDelay(1000);
  }

  if (retry < 15) {
    timeSynced = true;
    char timeStringBuff[64];
    strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S",
             &timeinfo);
    log("[ INFO ] Hora sincronizada: " + String(timeStringBuff));
  } else {
    timeSynced = false;
    log("[ ERROR ] No se pudo sincronizar la hora. Se usará modo inseguro para "
        "MQTT.");
  }
}

// -------------------------------------------------------------------
// Iniciar WIFI Modo Estación (Cliente)
// Intenta conectarse a una red WiFi existente (router).
// -------------------------------------------------------------------
void startClient() {
  log("[ INFO ] Iniciando Modo Estación");
  WiFi.mode(WIFI_STA); // Establece modo Estación

  // Configuración de IP Estática si está habilitada por el usuario
  if (wifi_ip_static) {
    if (!WiFi.config(CharToIP(wifi_ipv4), CharToIP(wifi_gateway),
                     CharToIP(wifi_subnet), CharToIP(wifi_dns_primary),
                     CharToIP(wifi_dns_secondary))) {
      log("[ ERROR ] Falló la configuración en Modo Estación");
    }
  }

  WiFi.hostname(esp_hostname);          // Establece hostname
  WiFi.begin(wifi_ssid, wifi_password); // Inicia conexión con SSID y Pass
  log("[ INFO ] Conectando al SSID " + String(wifi_ssid));

  // Espera hasta que se conecte o pase el tiempo límite (approx 30s)
  byte b = 0;
  while (WiFi.status() != WL_CONNECTED && b < 60) {
    b++;
    log("[ WARNING ] Intentando conexión WiFi ...");
    vTaskDelay(500);           // Espera no bloqueante (si se usa FreeRTOS)
    blinkSingle(100, WIFILED); // Parpadeo rápido indicando intento de conexión
  }

  // Verificación final de conexión
  if (WiFi.status() == WL_CONNECTED) {
    // ESTADO: Conectado Exitosamente
    log("[ INFO ] WiFi conectado (" + String(WiFi.RSSI()) + ") dBm IPv4 " +
        ipStr(WiFi.localIP()));
    blinkRandomSingle(10, 100, WIFILED); // Patrón de led aleatorio
    wifi_mode = WIFI_STA;
    wifi_change = true;

    // Sincronizar hora para validación de certificados SSL
    syncTime();

  } else {
    // ESTADO: Falla de conexión
    log("[ ERROR ] WiFi no conectado");
    blinkRandomSingle(10, 100, WIFILED);
    wifi_change = true;
    startAP(); // Reestablecer: Inicia AP si falla la conexión inicial
  }
}

// -------------------------------------------------------------------
// Setup WiFi General
// Decide en qué modo arrancar según la configuración guardada.
// -------------------------------------------------------------------
void wifi_setup() {
  WiFi.disconnect(true);

  // 1) Si el usuario forzó el modo AP en la configuración
  if (ap_mode) {
    startAP();
    log("[ INFO ] WiFi en Modo AP");
  } else {
    // 2) Caso contrario intenta arrancar en Modo Estación
    startClient();
    if (WiFi.status() == WL_CONNECTED) {
      log("[ INFO ] WiFI Modo Estación");
    }
  }

  // Iniciar servicio mDNS (hostname broadcast) en cualquier modo activo
  // Permite encontrar el dispositivo como "nombre.local"
  if (wifi_mode == WIFI_STA || wifi_mode == WIFI_AP) {
    if (MDNS.begin(esp_hostname)) {
      MDNS.addService("http", "tcp", 80);
    }
  }
}

// -------------------------------------------------------------------
// Loop Principal cuando estamos en Modo Estación
// Gestiona la monitorización y reconexión automática.
// -------------------------------------------------------------------
byte w = 0; // Contador de intentos fallidos
void wifiLoop() {
  unsigned long currentMillis = millis();

  // Si se pierde la conexión y ha pasado el intervalo de chequeo
  if (WiFi.status() != WL_CONNECTED &&
      (currentMillis - previousMillisWIFI >= intervalWIFI)) {
    w++;
    blinkSingle(100, WIFILED); // Parpadeo de alerta
    WiFi.disconnect(true);
    WiFi.reconnect(); // Intenta reconectar
    previousMillisWIFI = currentMillis;

    // Si falla 2 veces consecutivas (aprox 1 minuto)
    if (w == 2) {
      log("[ INFO ] Cambiando a Modo AP");
      wifi_change = true;
      w = 0;
      startAP(); // Cambia a Modo AP temporalmente para permitir config
    } else {
      log("[ WARNING ] SSID " + String(wifi_ssid) + " desconectado ");
    }
  } else {
    // Si está conectado, parpadeo "heartbeat" lento asíncrono
    blinkSingleAsy(10, 500, WIFILED);
  }
}

// -------------------------------------------------------------------
// Loop Principal cuando estamos en Modo AP
// Gestiona el DNS y el timeout para volver a intentar modo Cliente.
// -------------------------------------------------------------------
byte a = 0; // Contador de intervalos en modo AP
void wifiAPLoop() {
  blinkSingleAsy(5, 100, WIFILED); // Parpadeo muy breve indicando AP activo
  dnsServer.processNextRequest();  // Procesa peticiones del Portal Cautivo DNS

  unsigned long currentMillis = millis();

  // Temporizador para volver a intentar conectar como Cliente
  // Solo si 'wifi_change' es true (indica que llegamos aquí por fallo de
  // conexión STA)
  if ((currentMillis - previousMillisAP >= intervalWIFI) && wifi_change) {
    a++;
    previousMillisAP = currentMillis;
    // 20 intervalos * 30 seg = 600 segundos = 10 minutos
    if (a == 20) {
      log("[ INFO ] Cambiando a Modo Estación");
      wifi_change = false; // Reset bandera
      a = 0;
      startClient(); // Intenta volver a conectar al router
    }
  }
}
