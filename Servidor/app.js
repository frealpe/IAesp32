// const { append } = require("express/lib/response");

// CRÍTICO: Configurar dotenv PRIMERO, antes de importar cualquier otro módulo
const dotenv = require("dotenv");
dotenv.config();

// Ahora sí, importar Server (que a su vez importa mqtt/conectMqtt)
const Server = require("./lib/server");
 
const server = new Server();
server.listen();
