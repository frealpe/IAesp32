const { response } = require('express');
const { decrypt } = require('../helpers/cryptoHelper');
const { generarJWT } = require('../helpers/generar-jwt');
const Dispositivo = require('../models/dispositivo');
const Lectura = require('../models/lectura');
const Usuario = require('../models/usuario');
const { 
    getAcueductoToken,
    registerMeterExternal, 
    saveIndexExternal, 
    saveAlarmExternal, 
    saveBatchExternal,
    getMetersExternal,
    getMetersIndicesExternal
} = require('../helpers/acueductoService');
const crypto = require('crypto');

const authIoT = async (req, res = response) => {
    const { name, key } = req.body;
    try {
        // En este caso el key actúa como la contraseña directa o un token de acceso
        // Se puede adaptar para usar bcrypt si fuera necesario
        const usuario = await Usuario.findOne({ nombre: name });
        if (!usuario) {
            return res.status(401).json({ msg: 'Credenciales de IoT inválidas (usuario no encontrado)' });
        }
        
        // Simplemente generamos un JWT para el ESP32
        const token = await generarJWT(usuario.id);
        res.json({ access_token: token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en autenticación IoT' });
    }
};

/**
 * POST /api/iot/auth/default
 * Equivale a http_get_token() del ESP32:
 * Usa ACUEDUCTO_USER y ACUEDUCTO_KEY del .env para obtener el token de la API externa de Acueducto
 * (wsp.acueducto.com.co/.../ Auth/GetToken)
 */
const authIoTDefault = async (req, res = response) => {
    try {
        const token = await getAcueductoToken();
        res.json({
            status: 'Token request',
            code: 200,
            user: process.env.ACUEDUCTO_USER,
            url: process.env.ACUEDUCTO_AUTH_URL,
            response: { access_token: token }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error obteniendo token de Acueducto', error: error.message });
    }
};

const registerDevice = async (req, res = response) => {
    const { data } = req.body;
    try {
        const key = process.env.IOT_ENCRYPT_KEY;
        const iv = process.env.IOT_ENCRYPT_IV;
        
        const decryptedData = decrypt(data, key, iv);
        const parsedData = JSON.parse(decryptedData);
        const { meterSerial } = parsedData;
        
        let dispositivo = await Dispositivo.findOne({ id: meterSerial });
        let externalResult = { success: true, message: 'Dispositivo verificado localmente' };

        if (!dispositivo) {
            dispositivo = new Dispositivo({ 
                id: meterSerial, 
                uid: crypto.randomUUID(), 
                estado: true 
            });
            await dispositivo.save();
            
            // Llamada a API externa al registrar nuevo dispositivo desde ESP32
            try {
                externalResult = await registerMeterExternal(meterSerial);
            } catch (err) {
                console.error('Error en registro externo desde ESP32:', err.message);
                externalResult = { success: false, message: err.message };
            }
        } else {
            // Si ya existe localmente, intentamos verificar/registrar en la API externa por si acaso
            try {
                externalResult = await registerMeterExternal(meterSerial);
            } catch (err) {
                 console.warn('Verificación externa fallida (probablemente ya existe):', err.message);
            }
        }
        
        res.json({ 
            status: 'ok', 
            response: 'dispositivo registrado o verificado',
            external: externalResult
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ msg: 'Error de registro', error: error.message });
    }
};

const saveIndex = async (req, res = response) => {
    const { data } = req.body;
    try {
        const key = process.env.IOT_ENCRYPT_KEY;
        const iv = process.env.IOT_ENCRYPT_IV;

        const decryptedData = decrypt(data, key, iv);
        const parsedData = JSON.parse(decryptedData);
        const { meterSerial, meterIndex, meterDateTime } = parsedData;
        
        console.log(`[ INFO ] SaveIndex Receipt: serial=${meterSerial}, index=${meterIndex}, date=${meterDateTime}`);
        console.log(`[ DEBUG ] Parsed Data:`, JSON.stringify(parsedData));

        if (!meterSerial || meterIndex === undefined) {
             console.warn('[ WARNING ] SaveIndex: Missing critical fields in parsedData');
        }

        const lectura = new Lectura({ 
            meterSerial, 
            meterIndex, 
            meterDateTime, 
            dataRaw: parsedData 
        });
        await lectura.save();

        // Reenviar a Acueducto
        try {
            await saveIndexExternal(meterSerial, meterIndex, meterDateTime);
        } catch (err) {
            console.error('Error reenviando lectura a Acueducto:', err.message);
        }

        res.json({ status: 'ok', response: 'índice guardado' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ msg: 'Error al guardar índice', error: error.message });
    }
};

const saveAlarm = async (req, res = response) => {
    const { data } = req.body;
    try {
        const key = process.env.IOT_ENCRYPT_KEY;
        const iv = process.env.IOT_ENCRYPT_IV;

        const decryptedData = decrypt(data, key, iv);
        const parsedData = JSON.parse(decryptedData);
        const { meterSerial } = parsedData;

        // Reenviar a Acueducto
        try {
            await saveAlarmExternal(meterSerial, parsedData);
        } catch (err) {
            console.error('Error reenviando alarma a Acueducto:', err.message);
        }

        res.json({ status: 'ok', response: 'alarma guardada' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ msg: 'Error al guardar alarma', error: error.message });
    }
};

const saveBatch = async (req, res = response) => {
    const { data } = req.body;
    try {
        const key = process.env.IOT_ENCRYPT_KEY;
        const iv = process.env.IOT_ENCRYPT_IV;

        const decryptedData = decrypt(data, key, iv);
        const parsedData = JSON.parse(decryptedData);
        const { meterSerial, batch } = parsedData;

        // Reenviar a Acueducto
        try {
            await saveBatchExternal(meterSerial, batch || parsedData);
        } catch (err) {
            console.error('Error reenviando lote a Acueducto:', err.message);
        }

        res.json({ status: 'ok', response: 'lote guardado' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ msg: 'Error al guardar lote', error: error.message });
    }
};

const getLecturas = async (req, res = response) => {
    try {
        const lecturas = await Lectura.find().sort({ timestamp: -1 }).limit(100);
        res.json({ lecturas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener lecturas' });
    }
};

/**
 * GET /api/iot/getIndex
 * Replica de http_get_data(http_get_index_path)
 * Retorna las últimas lecturas de índice almacenadas
 */
const getIndex = async (req, res = response) => {
    try {
        const { serial, limit = 10 } = req.query;
        const query = serial ? { meterSerial: serial } : {};
        const lecturas = await Lectura.find(query)
            .sort({ timestamp: -1 })
            .limit(Number(limit));
        res.json({
            status: 'Consulta realizada',
            code: 200,
            response: lecturas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al consultar índice', error: error.message });
    }
};

/**
 * GET /api/iot/getMeters  (http_get_meters_path)
 * Obtener lista de medidores desde el servicio Acueducto
 */
const getMeters = async (req, res = response) => {
    try {
        const result = await getMetersExternal();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener medidores de Acueducto' });
    }
};

/**
 * POST /api/iot/encryptTest  (http_encrypt_test_path)
 * Replica de la verificación AES en el ESP32:
 * Recibe { data } con el payload cifrado AES-256-CBC y lo descifra
 */
const encryptTest = async (req, res = response) => {
    const { data } = req.body;
    try {
        const key = process.env.IOT_ENCRYPT_KEY;
        const iv = process.env.IOT_ENCRYPT_IV;
        const decryptedData = decrypt(data, key, iv);
        const parsedData = JSON.parse(decryptedData);
        res.json({
            status: 'Prueba de cifrado OK',
            code: 200,
            decrypted: parsedData
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ msg: 'Error en prueba de cifrado', error: error.message });
    }
};

/**
 * POST /api/iot/manualDispatcher
 * Replica de http_manual_dispatcher(path, method, extraData)
 * Ejecuta la acción correspondiente al path y método recibidos
 * Body: { path, method, extraData? }
 */
const manualDispatcher = async (req, res = response) => {
    const { path, method, extraData } = req.body;
    const Lectura = require('../models/lectura'); // Importar modelo para persistencia manual
    const upperMethod = (method || '').toUpperCase();
    try {
        const key = process.env.IOT_ENCRYPT_KEY;
        const iv = process.env.IOT_ENCRYPT_IV;

        if (upperMethod === 'GET') {
            // Soporte para GetIndexsByMeter en el dispatcher manual
            if (path.includes('GetIndexsByMeter')) {
                const serial = req.body.serial || req.query.meterSerial || 'serial1320001';
                
                // Fecha por defecto: YYYYMM actual
                const now = new Date();
                const defaultCutoff = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                const cutoff = req.body.value || req.query.meterCutoffDate || defaultCutoff;
                
                // Retornar respuesta cruda de Acueducto, igual al ESP32
                const result = await getMetersIndicesExternal(serial, cutoff);
                return res.json(result);
            }

            // Equivale a http_get_data(path)
            const query = extraData ? { meterSerial: extraData } : {};
            const lecturas = await Lectura.find(query).sort({ timestamp: -1 }).limit(100);
            return res.json({
                status: 'Consulta realizada',
                code: 200,
                headers: {},
                response: lecturas
            });
        }

        // POST: determinar qué hacer según path
        // Usamos endsWith para aceptar tanto paths cortos (/auth) como el path completo del .env
        const authSuffix  = process.env.HTTP_AUTH_PATH      || '/Auth/GetToken';
        const regSuffix   = process.env.HTTP_REGISTER_PATH  || '/RegisterMeterSerial';
        const idxSuffix   = process.env.HTTP_SAVE_INDEX_PATH || '/SaveIndex';
        const alarmSuffix = process.env.HTTP_SAVE_ALARM_PATH  || '/SaveAlarm';
        const batchSuffix = process.env.HTTP_SAVE_BATCH_PATH  || '/SaveBatch';
        const reportSuffix = process.env.HTTP_GET_METERS_INDICES_PATH || '/GetIndexsByMeter';

        const pathMatch = (p, suffix) => {
            const lp = p.toLowerCase();
            const ls = suffix.toLowerCase();
            return lp === ls || lp.endsWith(ls) || ls.endsWith(lp);
        };

        if (pathMatch(path, authSuffix)) {
            const token = await getAcueductoToken();
            return res.json({ status: 'Token request', code: 200, response: { access_token: token } });
        }

        if (pathMatch(path, reportSuffix)) {
            const serial = req.body.serial || 'serial1320001';
            const now2 = new Date();
            const defaultCutoff = `${now2.getFullYear()}${String(now2.getMonth() + 1).padStart(2, '0')}`;
            const cutoff = req.body.value || req.query.meterCutoffDate || defaultCutoff;
            // Retornar respuesta cruda de Acueducto, igual al ESP32
            const result2 = await getMetersIndicesExternal(serial, cutoff);
            return res.json(result2);
        }

        // Los paths de datos esperan payload cifrado en extraData (JSON string)
        let result;
        if (pathMatch(path, regSuffix)) {
            const serial = (typeof extraData === 'string' ? extraData : (extraData && extraData.meterSerial)) || req.body.serial || 'serial1320001';
            result = await registerMeterExternal(serial);
        } else if (pathMatch(path, idxSuffix)) {
            const d = (extraData && typeof extraData === 'object') ? extraData : {};
            const meterSerial   = d.meterSerial  || req.body.serial || 'serial1320001';
            const meterIndex    = d.meterIndex   || req.body.value  || '1';
            // Generar timestamp en UTC-5 (Colombia) en formato YYYYMMDDHHmmss, igual que el ESP32 getTimestampCompact()
            const nowUTC = Date.now() - (5 * 60 * 60 * 1000); // UTC-5
            const nowLocal = new Date(nowUTC);
            const defaultDT = nowLocal.getUTCFullYear().toString()
                + String(nowLocal.getUTCMonth() + 1).padStart(2, '0')
                + String(nowLocal.getUTCDate()).padStart(2, '0')
                + String(nowLocal.getUTCHours()).padStart(2, '0')
                + String(nowLocal.getUTCMinutes()).padStart(2, '0')
                + String(nowLocal.getUTCSeconds()).padStart(2, '0');
            const meterDateTime = d.meterDateTime || defaultDT;
            result = await saveIndexExternal(meterSerial, meterIndex, meterDateTime);

            // PERSISTENCIA LOCAL: Guardar también en nuestra base de datos para que aparezca en reportes
            try {
                const lecturaManual = new Lectura({
                    meterSerial,
                    meterIndex,
                    meterDateTime,
                    dataRaw: { manual: true, originalPath: path, ...d }
                });
                await lecturaManual.save();
                console.log(`[ INFO ] Manual SaveIndex persisted locally for ${meterSerial}`);
            } catch (localError) {
                console.error('[ ERROR ] Failed to persist manual reading locally:', localError.message);
            }
        } else if (pathMatch(path, alarmSuffix)) {
            const d = extraData && typeof extraData === 'object' ? extraData : (extraData ? JSON.parse(extraData) : {});
            result = await saveAlarmExternal(d.meterSerial || 'serial1320001', d);
        } else if (pathMatch(path, batchSuffix)) {
            const d = extraData && typeof extraData === 'object' ? extraData : (extraData ? JSON.parse(extraData) : {});
            result = await saveBatchExternal(d.meterSerial || 'serial1320001', d.batch || d);
        } else {
            return res.status(400).json({ msg: `Path '${path}' no reconocido en manualDispatcher` });
        }

        res.json({
            status: 'Prueba Manual POST',
            code: 200,
            headers: {},
            response: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en manualDispatcher', error: error.message });
    }
};

const testAcueducto = async (req, res = response) => {
    const { type, serial } = req.body;
    try {
        let result;
        if (type === 'auth') {
            const token = await getAcueductoToken();
            result = { success: true, message: 'Autenticación exitosa', token: token.substring(0, 15) + '...' };
        } else if (type === 'register') {
            result = await registerMeterExternal(serial || 'serial1320001');
        } else {
            return res.status(400).json({ msg: 'Tipo de prueba no válido' });
        }
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en la prueba de Acueducto', error: error.message });
    }
};

/**
 * GET /api/iot/getMetersIndices
 * Consulta lecturas históricas en la API de Acueducto.
 */
const getMetersIndices = async (req, res = response) => {
    let { meterSerial, meterCutoffDate, arrivalCutoffDate } = req.query;

    // Valores por defecto para facilitar pruebas
    if (!meterSerial) meterSerial = 'serial1320001';
    if (!meterCutoffDate) {
        const now = new Date();
        meterCutoffDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    try {
        const result = await getMetersIndicesExternal(meterSerial, meterCutoffDate, arrivalCutoffDate);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error consultando índices en Acueducto', 
            error: error.message 
        });
    }
};

module.exports = {
    authIoT,
    authIoTDefault,
    registerDevice,
    saveIndex,
    saveAlarm,
    saveBatch,
    getLecturas,
    getIndex,
    getMeters,
    getMetersIndices,
    encryptTest,
    manualDispatcher,
    testAcueducto
};
