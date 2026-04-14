// mqttConectar.js
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const { decodeIoTFrame, decodeFullFrame } = require('../helpers/iotHelper');
const { saveIndexExternal } = require('../helpers/acueductoService');
const Dispositivo = require('../models/dispositivo');

const brokerUrl = process.env.BROKER || 'mqtt://localhost:1883';
const isSecure = brokerUrl.startsWith('mqtts') || brokerUrl.startsWith('wss');

const options = {
  clientId: "NodeClient_" + Math.random().toString(16).substr(2, 8),
  // Solo agregar usuario y contraseña si están definidos
  ...(process.env.MQTT_USER && { username: process.env.MQTT_USER }),
  ...(process.env.MQTT_PASS && { password: process.env.MQTT_PASS }),
  // Solo aplicar certificados si la URL es segura (mqtts/wss)
  ...(isSecure && {
    key: (process.env.TLS_KEY_PATH && fs.existsSync(process.env.TLS_KEY_PATH)) ? fs.readFileSync(process.env.TLS_KEY_PATH) : undefined,
    cert: (process.env.TLS_CERT_PATH && fs.existsSync(process.env.TLS_CERT_PATH)) ? fs.readFileSync(process.env.TLS_CERT_PATH) : undefined,
    ca: (process.env.TLS_CA_PATH && fs.existsSync(process.env.TLS_CA_PATH)) ? fs.readFileSync(process.env.TLS_CA_PATH) : undefined,
    rejectUnauthorized: process.env.MQTT_REJECT_UNAUTHORIZED === 'true',
  })
};

// Lista de topics
const topics = [ 
  process.env.MQTT_TOPIC_WRITE || 'cat1/acb/up',
  process.env.MQTT_TOPIC_SUBSCRIBE || 'cat1/acb/down/imei',
];

// Buffer para los últimos N mensajes
const MAX_MENSAJES = 1000;
const mensajesPorTopic = {}; // { topic: [ { msg, timestamp } ] }

let mqttClient;

function connect() {
  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    console.log('Conectado al broker MQTT');

    topics.forEach(topic => {
      mqttClient.subscribe(topic, { qos: 1 }, (err) => {
        if (!err) console.log(`📡 Suscrito a ${topic}`);
        else console.error(`❌ Error suscribiéndose a ${topic}:`, err);
      });
    });
  });

  mqttClient.on('message', async (topic, message) => {
    const msgString = message.toString().trim();

    // Verificamos si es una trama de medidor IoT
    if (/^[0-9a-fA-F]+$/.test(msgString)) {
      try {
        if (msgString.length === 84) { // Trama Completa (IMEI + IoT)
          const fullData = decodeFullFrame(msgString);
          const { imei, iot } = fullData;
          console.log(`💧 [MQTT IoT Full] imei: ${imei}, index: ${iot.volumenAcumuladoPositivo}`);
          
          // Verificar en la BD local
          const dispositivo = await Dispositivo.findOne({ id: imei });
          if (dispositivo && dispositivo.estado === true) {
            const now = new Date().toISOString();
            await saveIndexExternal(imei, iot.volumenAcumuladoPositivo, now);
          } else {
            console.log(`🚫 [MQTT SaveIndex Skip] Dispositivo ${imei} no habilitado o no encontrado.`);
          }
        } else if (msgString.length >= 48) { // Trama IoT parcial
          const frameData = decodeIoTFrame(msgString);
          console.log(`💧 [MQTT IoT Decoded] en [${topic}]:`, JSON.stringify(frameData, null, 2));
        }
      } catch (errHex) {
        console.log(`⚠️ [MQTT IoT Error] Trama no compatible en [${topic}]: ${msgString} (${errHex.message})`);
      }
    } else {
      console.log(`ℹ️ [MQTT Mensaje ignorado] Texto plano u otro formato en [${topic}]: ${msgString}`);
    }

    if (!mensajesPorTopic[topic]) mensajesPorTopic[topic] = [];
    mensajesPorTopic[topic].push({ msg: msgString, timestamp: Date.now() });

    if (mensajesPorTopic[topic].length > MAX_MENSAJES) {
      mensajesPorTopic[topic].shift();
    }
  });

  mqttClient.on('error', (err) => {
    console.error('Error MQTT:', err);
  });
}

// Publicar mensajes
function publicarMQTT(topic, mensaje) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, mensaje, { qos: 1 }, (err) => {
      if (err) console.error(`❌ Error al publicar en ${topic}:`, err);
      else console.log(`📤 Publicado en ${topic}: ${mensaje}`);
    });
  } else {
    console.log('⚠️ Cliente MQTT no conectado');
  }
}

module.exports = {
  connect,
  mqttClient,
  publicarMQTT,
  mensajesPorTopic
};
