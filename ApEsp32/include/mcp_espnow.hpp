
#include <WiFi.h>
#include <esp_now.h>

// Estructura de mensaje de ejemplo (puedes adaptarla a tus necesidades)
typedef struct struct_message {
  char a[32];
  int b;
  float c;
  bool d;
} struct_message;

// Crear una estructura de mensaje llamada myData
struct_message myData;

// Variable para almacenar si el envío fue exitoso
String success;

// Callback cuando se envían datos
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success"
                                                : "Delivery Fail");
  if (status == 0) {
    success = "Delivery Success :)";
  } else {
    success = "Delivery Fail :(";
  }
}

// Callback cuando se reciben datos
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len) {
  memcpy(&myData, incomingData, sizeof(myData));
  Serial.print("Bytes received: ");
  Serial.println(len);
  Serial.print("Char: ");
  Serial.println(myData.a);
  Serial.print("Int: ");
  Serial.println(myData.b);
  Serial.print("Float: ");
  Serial.println(myData.c);
  Serial.print("Bool: ");
  Serial.println(myData.d);
  Serial.println();
}

// Función para registrar un par (peer)
void registerPeer(uint8_t *broadcastAddress) {
  esp_now_peer_info_t peerInfo;
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }
}

// Función para inicializar ESP-NOW
void initESPNow() {
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  Serial.println("ESP-NOW Initialized");

  // Registrar callback de envío
  esp_now_register_send_cb(OnDataSent);

  // Registrar callback de recepción
  esp_now_register_recv_cb(OnDataRecv);
}

// Función para enviar datos
void sendESPNow(uint8_t *broadcastAddress) {
  esp_err_t result =
      esp_now_send(broadcastAddress, (uint8_t *)&myData, sizeof(myData));

  if (result == ESP_OK) {
    Serial.println("Sent with success");
  } else {
    Serial.println("Error sending the data");
  }
}
