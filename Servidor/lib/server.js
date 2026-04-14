const express = require('express');
const cors = require('cors');
const compression = require('compression');
const http = require('http');
const path = require('path');
const mqttService = require('../mqtt/conectMqtt'); // Importar MQTT
const { dbConnection } = require('../database/config');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 80;
        this.server = http.createServer(this.app);

        this.paths = {
            auth:       '/api/auth',
            perfil:     '/api/perfil', // Map to auth for compatibility
            usuarios:   '/api/usuarios',
            dispositivos: '/api/dispositivos',
            iot:        '/api/iot',
        }

        // Conectar a base de datos
        this.conectarDB();

        // Middlewares
        this.middlewares();

        // MQTT
        this.conectarMqtt();

        // Rutas de mi aplicación
        this.routes();
    }

    async conectarDB() {
        await dbConnection();
    }

    conectarMqtt() {
        mqttService.connect();
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(compression());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));    
    }

    routes() {
        this.app.use( this.paths.auth, require('../routes/auth'));
        this.app.use( this.paths.usuarios, require('../routes/usuarios'));
        this.app.use( this.paths.dispositivos, require('../routes/dispositivos'));
        this.app.use( this.paths.iot, require('../routes/iot'));

        this.app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                database: 'Connected', // If it reaches here, DB is connected as per constructor
                mqtt: mqttService.mqttClient && mqttService.mqttClient.connected ? 'Connected' : 'Disconnected',
                timestamp: new Date().toISOString()
            });
        });

        // Fallback para React Router (debe ir al final de las rutas)
        // Fallback para React Router (debe ir al final de las rutas)
        this.app.get(/.*/, (req, res) => {
            res.sendFile(path.resolve(__dirname, '../public/index.html'));
        });
    }

    listen() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Servidor HTTP corriendo en puerto: ${this.port}`);
            console.log(`💻 Cliente MQTT inicializado en segundo plano.`);
        });
    }
}

module.exports = Server;
