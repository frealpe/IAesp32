const { encrypt } = require('./cryptoHelper');

let cachedToken = null;
let tokenExpiry = null;

/**
 * Obtiene el Token de la API externa de Acueducto.
 */
const getAcueductoToken = async () => {
    // Si el token aún es válido, no lo pedimos de nuevo (cache 55 min)
    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
        return cachedToken;
    }

    const url = process.env.ACUEDUCTO_AUTH_URL;
    if (!url) {
        throw new Error('ACUEDUCTO_AUTH_URL no está definido en las variables de entorno');
    }
    
    // Credenciales — igual que el ESP32: string crudo sin URL-encode
    const user = (process.env.ACUEDUCTO_USER || '').replace(/^\"|\"$/g, '');
    const key  = (process.env.ACUEDUCTO_KEY  || '').replace(/^\"|\"$/g, '');
    const body = `name=${user}&key=${key}`;

    console.log(`[ Acueducto API ] Solicitando Token a: ${url}`);
    console.log(`[ Acueducto API ] User: ${user} | Body length: ${body.length}`);
    console.log(`[ Acueducto API ] Node Version: ${process.version}`);

    try {
        // Verificar si fetch existe (Node 18+)
        if (typeof fetch === 'undefined') {
            throw new Error(`fetch no está definido. Node.js ${process.version} no soporta fetch globalmente. Por favor actualiza Node o instala node-fetch.`);
        }

        const providerToken = process.env.ACUEDUCTO_PROVIDER_TOKEN || '';
        const authHeader = providerToken ? { 'Authorization': `Bearer ${providerToken}` } : {};

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                ...authHeader
            },
            body: body
        });

        console.log(`[ Acueducto API ] Status Code: ${response.status}`);
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('[ Acueducto API ] Respuesta no es JSON:', responseText.substring(0, 500));
            throw new Error(`La respuesta del servidor no es JSON válido: ${responseText.substring(0, 100)}...`);
        }

        let token = "";
        if (typeof result === 'string') {
            token = result;
        } else if (result.access_token) {
            token = result.access_token;
        } else if (result.token) {
            token = result.token;
        }

        if (!token) {
            throw new Error(`No se pudo obtener el token. Respuesta: ${JSON.stringify(result)}`);
        }

        cachedToken = token;
        tokenExpiry = new Date(new Date().getTime() + (55 * 60 * 1000)); 
        
        console.log('[ Acueducto API ] Token obtenido correctamente');
        return cachedToken;

    } catch (error) {
        console.error('[ Acueducto API ] Error crítico obteniendo Token:', error.message);
        throw error;
    }
};

/**
 * Registra un medidor en la API externa de Acueducto.
 */
const registerMeterExternal = async (meterSerial, isRetry = false) => {
    const url = process.env.ACUEDUCTO_REGISTER_URL;
    
    try {
        const token = await getAcueductoToken();

        const now = new Date();
        const timestamp = now.getFullYear() + "-" + 
                          String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(now.getDate()).padStart(2, '0') + "T" + 
                          String(now.getHours()).padStart(2, '0') + ":" + 
                          String(now.getMinutes()).padStart(2, '0') + ":" + 
                          String(now.getSeconds()).padStart(2, '0') + "-05:00";

        const rawData = JSON.stringify({ meterSerial });
        const encryptedData = encrypt(rawData, process.env.IOT_ENCRYPT_KEY, process.env.IOT_ENCRYPT_IV);

        const body = {
            timestamp: timestamp,
            showErrorDetails: true,
            data: encryptedData
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node-Fetch/Metrex-Backend'
            },
            body: JSON.stringify(body)
        });

        // Si el token es inválido (401) y no hemos reintentado aún, refrescamos y reintentamos
        if (response.status === 401 && !isRetry) {
            console.warn('[ Acueducto API ] Token inválido (401). Refrescando...');
            cachedToken = null;
            tokenExpiry = null;
            return registerMeterExternal(meterSerial, true);
        }

        const responseText = await response.text();
        console.log(`[ Acueducto API ] Raw Response for ${meterSerial}:`, responseText);

        if (!responseText) {
            return { success: false, message: 'Respuesta vacía del servidor', data: null };
        }

        const result = JSON.parse(responseText);

        // Si ya existe, lo consideramos "éxito" parcial
        if (!result.success && result.message && result.message.includes('ya existe')) {
            return {
                success: true, 
                alreadyExists: true,
                message: result.message,
                data: result.data
            };
        }

        return result;

    } catch (error) {
        console.error(`[ Acueducto API ] Error en registerMeterExternal (${meterSerial}):`, error.message);
        return { success: false, message: error.message, data: null };
    }
};

/**
 * Guarda una lectura de índice en la API de Acueducto.
 */
const saveIndexExternal = async (meterSerial, meterIndex, meterDateTime, isRetry = false) => {
    const url = process.env.ACUEDUCTO_SAVE_INDEX_URL;
    
    try {
        const token = await getAcueductoToken();

        const now = new Date();
        const timestamp = now.getFullYear() + "-" + 
                          String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(now.getDate()).padStart(2, '0') + "T" + 
                          String(now.getHours()).padStart(2, '0') + ":" + 
                          String(now.getMinutes()).padStart(2, '0') + ":" + 
                          String(now.getSeconds()).padStart(2, '0') + "-05:00";

        const rawData = JSON.stringify({ meterSerial, meterIndex, meterDateTime });
        const encryptedData = encrypt(rawData, process.env.IOT_ENCRYPT_KEY, process.env.IOT_ENCRYPT_IV);

        const body = {
            timestamp: timestamp,
            showErrorDetails: true,
            data: encryptedData
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node-Fetch/Metrex-Backend'
            },
            body: JSON.stringify(body)
        });

        if (response.status === 401 && !isRetry) {
            console.warn('[ Acueducto API ] Token inválido (401) en SaveIndex. Refrescando...');
            cachedToken = null;
            tokenExpiry = null;
            return saveIndexExternal(meterSerial, meterIndex, meterDateTime, true);
        }

        const responseText = await response.text();
        console.log(`[ Acueducto API ] SaveIndex Raw Response for ${meterSerial}:`, responseText);

        if (!responseText) {
            return { success: false, message: 'Respuesta vacía del servidor', data: null };
        }

        return JSON.parse(responseText);

    } catch (error) {
        console.error(`[ Acueducto API ] Error en saveIndexExternal (${meterSerial}):`, error.message);
        return { success: false, message: error.message, data: null };
    }
};

/**
 * Guarda una alarma del medidor en la API de Acueducto.
 */
const saveAlarmExternal = async (meterSerial, alarmData, isRetry = false) => {
    const url = process.env.ACUEDUCTO_SAVE_ALARM_URL || process.env.ACUEDUCTO_SAVE_INDEX_URL.replace('SaveIndex', 'SaveAlarm');
    
    try {
        const token = await getAcueductoToken();
        const now = new Date();
        const timestamp = now.getFullYear() + "-" + 
                          String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(now.getDate()).padStart(2, '0') + "T" + 
                          String(now.getHours()).padStart(2, '0') + ":" + 
                          String(now.getMinutes()).padStart(2, '0') + ":" + 
                          String(now.getSeconds()).padStart(2, '0') + "-05:00";

        const rawData = JSON.stringify({ meterSerial, ...alarmData });
        const encryptedData = encrypt(rawData, process.env.IOT_ENCRYPT_KEY, process.env.IOT_ENCRYPT_IV);

        const body = {
            timestamp: timestamp,
            showErrorDetails: true,
            data: encryptedData
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node-Fetch/Metrex-Backend'
            },
            body: JSON.stringify(body)
        });

        if (response.status === 401 && !isRetry) {
            console.warn('[ Acueducto API ] Token inválido (401) en SaveAlarm. Refrescando...');
            cachedToken = null;
            tokenExpiry = null;
            return saveAlarmExternal(meterSerial, alarmData, true);
        }

        const responseText = await response.text();
        console.log(`[ Acueducto API ] SaveAlarm Raw Response for ${meterSerial}:`, responseText);

        if (!responseText) {
            return { success: false, message: 'Respuesta vacía del servidor', data: null };
        }

        return JSON.parse(responseText);

    } catch (error) {
        console.error(`[ Acueducto API ] Error en saveAlarmExternal (${meterSerial}):`, error.message);
        return { success: false, message: error.message, data: null };
    }
};

/**
 * Guarda un lote (batch) de lecturas en la API de Acueducto.
 */
const saveBatchExternal = async (meterSerial, batchData, isRetry = false) => {
    const url = process.env.ACUEDUCTO_SAVE_BATCH_URL || process.env.ACUEDUCTO_SAVE_INDEX_URL.replace('SaveIndex', 'SaveBatch');
    
    try {
        const token = await getAcueductoToken();
        const now = new Date();
        const timestamp = now.getFullYear() + "-" + 
                          String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(now.getDate()).padStart(2, '0') + "T" + 
                          String(now.getHours()).padStart(2, '0') + ":" + 
                          String(now.getMinutes()).padStart(2, '0') + ":" + 
                          String(now.getSeconds()).padStart(2, '0') + "-05:00";

        const rawData = JSON.stringify({ meterSerial, batch: batchData });
        const encryptedData = encrypt(rawData, process.env.IOT_ENCRYPT_KEY, process.env.IOT_ENCRYPT_IV);

        const body = {
            timestamp: timestamp,
            showErrorDetails: true,
            data: encryptedData
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node-Fetch/Metrex-Backend'
            },
            body: JSON.stringify(body)
        });

        if (response.status === 401 && !isRetry) {
            console.warn('[ Acueducto API ] Token inválido (401) en SaveBatch. Refrescando...');
            cachedToken = null;
            tokenExpiry = null;
            return saveBatchExternal(meterSerial, batchData, true);
        }

        const responseText = await response.text();
        console.log(`[ Acueducto API ] SaveBatch Raw Response for ${meterSerial}:`, responseText);

        if (!responseText) {
            return { success: false, message: 'Respuesta vacía del servidor', data: null };
        }

        return JSON.parse(responseText);

    } catch (error) {
        console.error(`[ Acueducto API ] Error en saveBatchExternal (${meterSerial}):`, error.message);
        return { success: false, message: error.message, data: null };
    }
};

/**
 * Obtiene la lista de medidores registrados en Acueducto.
 */
const getMetersExternal = async (isRetry = false) => {
    const url = process.env.ACUEDUCTO_GET_METERS_URL || process.env.ACUEDUCTO_SAVE_INDEX_URL.replace('MiaTelemetryIndex/SaveIndex', 'MiaTelemetryMeter/GetMeters');
    
    try {
        const token = await getAcueductoToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node-Fetch/Metrex-Backend'
            }
        });

        if (response.status === 401 && !isRetry) {
            console.warn('[ Acueducto API ] Token inválido (401) en GetMeters. Refrescando...');
            cachedToken = null;
            tokenExpiry = null;
            return getMetersExternal(true);
        }

        console.log(`[ Acueducto API ] GetMeters URL: ${url}`);
        console.log(`[ Acueducto API ] GetMeters Status: ${response.status} ${response.statusText}`);
        
        const text = await response.text();
        console.log(`[ Acueducto API ] GetMeters Raw Response (first 200 chars):`, text.substring(0, 200));

        if (!text || text.trim() === "") {
            return { success: false, message: 'Respuesta vacía del servidor', data: null, status: response.status };
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            return { success: false, message: 'Error parseando JSON', data: text, status: response.status };
        }

    } catch (error) {
        console.error(`[ Acueducto API ] Error en getMetersExternal:`, error.message);
        return { success: false, message: error.message, data: null };
    }
};

/**
 * Obtiene las lecturas de un medidor por serial y fecha.
 */
const getMetersIndicesExternal = async (meterSerial, meterCutoffDate, arrivalCutoffDate = null, isRetry = false) => {
    // La URL base viene del .env, si no, intentamos construirla
    let baseUrl = (process.env.ACUEDUCTO_SAVE_INDEX_URL || '').split('/api/')[0];
    if (!baseUrl && process.env.ACUEDUCTO_AUTH_URL) {
        baseUrl = process.env.ACUEDUCTO_AUTH_URL.split('/api/')[0];
    }
    
    let url = `${baseUrl}/api/MiaTelemetryReport/GetIndexsByMeter?meterSerial=${meterSerial}&meterCutoffDate=${meterCutoffDate}`;
    if (arrivalCutoffDate) {
        url += `&arrivalCutoffDate=${arrivalCutoffDate}`;
    }
    
    try {
        const token = await getAcueductoToken();
        console.log(`[ Acueducto API ] Consultando índices: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node-Fetch/Metrex-Backend'
            }
        });

        if (response.status === 401 && !isRetry) {
            console.warn('[ Acueducto API ] Token inválido (401) en GetIndexsByMeter. Refrescando...');
            cachedToken = null;
            tokenExpiry = null;
            return getMetersIndicesExternal(meterSerial, meterCutoffDate, arrivalCutoffDate, true);
        }

        console.log(`[ Acueducto API ] GetIndexsByMeter Status: ${response.status} ${response.statusText}`);
        
        const text = await response.text();
        console.log(`[ Acueducto API ] GetIndexsByMeter Raw Response (first 500 chars):`, text.substring(0, 500));
        
        if (!text || text.trim() === "") {
            return { success: false, message: 'Respuesta vacía del servidor', data: null, status: response.status };
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            return { success: false, message: 'Error parseando JSON (GetIndexsByMeter)', data: text, status: response.status };
        }

    } catch (error) {
        console.error(`[ Acueducto API ] Error en getMetersIndicesExternal:`, error.message);
        return { success: false, message: error.message, data: null };
    }
};

module.exports = {
    getAcueductoToken,
    registerMeterExternal,
    saveIndexExternal,
    saveAlarmExternal,
    saveBatchExternal,
    getMetersExternal,
    getMetersIndicesExternal
};
