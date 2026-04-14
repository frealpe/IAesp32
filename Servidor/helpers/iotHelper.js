/**
 * Decodifica una trama hexadecimal proveniente de un medidor de agua IoT.
 * 
 * @param {string} hexString - La trama en formato hexadecimal (ej. desde MQTT)
 * @returns {Object} Datos decodificados del medidor
 * @throws {Error} Lanza excepciones si la trama es inválida o muy corta.
 */

//8600160418373243A2740020100000000000000000003A3300000060000001F4000003E8000000001A012C00000A1E

function decodeIoTFrame(hexString) {
    if (!hexString || typeof hexString !== 'string') {
        throw new Error('La trama de entrada debe ser una cadena de texto (string).');
    }

    const cleanHex = hexString.replace(/\s+/g, '');

    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        throw new Error('La trama contiene caracteres no hexadecimales.');
    }

    if (cleanHex.length < 48) {
        throw new Error(`Trama demasiado corta. Se requiere al menos 24 bytes (48 caracteres). Longitud recibida: ${cleanHex.length} caracteres.`);
    }

    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
    }

    const readUint16BE = (arr, offset) => {
        return (arr[offset] << 8) | arr[offset + 1];
    };

    const readUint32BE = (arr, offset) => {
        return ((arr[offset] << 24) | 
                (arr[offset + 1] << 16) | 
                (arr[offset + 2] << 8) | 
                 arr[offset + 3]) >>> 0;
    };

    const bcdToDec = (byte) => {
        const decenas = byte >> 4;
        const unidades = byte & 0x0F;
        return (decenas * 10) + unidades;
    };

    try {
        const bateria = bcdToDec(bytes[0]) / 10;
        const estadoModulo = bytes[1];
        const info = bytes[4];
        const caudalInstantaneo = readUint32BE(bytes, 5);
        const volumenAcumuladoPositivo = readUint32BE(bytes, 9);
        const volumenAcumuladoInverso = readUint32BE(bytes, 13);
        const temperatura = bytes[17];
        const presion = readUint16BE(bytes, 18);
        const codigoDiagnostico = readUint16BE(bytes, 20);
        const tx = bytes[22];
        const tipoDispositivo = bytes[23];

        return {
            bateria,
            estadoModulo,
            info,
            caudalInstantaneo,
            volumenAcumuladoPositivo,
            volumenAcumuladoInverso,
            temperatura,
            presion,
            codigoDiagnostico,
            tx,
            tipoDispositivo
        };
    } catch (error) {
        throw new Error(`Error inesperado procesando los bytes de la trama: ${error.message}`);
    }
}

/**
 * Decodifica una trama hexadecimal completa de 84 caracteres (42 bytes).
 * Incluye cabecera de red (18 bytes) y trama IoT (24 bytes).
 * Nota: El formato real usa "caracteres" en lugar de "bytes" para medir longitudes de string.
 *
 * @param {string} hexString - La trama en formato hexadecimal completo (84 caracteres)
 * @returns {Object} Datos decodificados listos para API o Base de Datos.
 */
function decodeFullFrame(hexString) {
    if (!hexString || typeof hexString !== 'string') {
        throw new Error('La trama de entrada debe ser una cadena de texto (string).');
    }

    const cleanHex = hexString.replace(/\s+/g, '');

    // Se asume que nos referimos a 84 caracteres hexadecimales (42 bytes nativos)
    if (cleanHex.length !== 84) {
        throw new Error(`Longitud incorrecta. Se esperaban 84 caracteres (42 bytes), recibidos: ${cleanHex.length}`);
    }

    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        throw new Error('La trama contiene caracteres no hexadecimales.');
    }

    // Convertir de hexadecimal a un array de bytes puro nativo de JS
    const bytes = new Uint8Array(cleanHex.length / 2); // 42 bytes en total
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
    }

    // --- Funciones auxiliares internas ---
    const readUint16BE = (arr, offset) => (arr[offset] << 8) | arr[offset + 1];
    
    const readUint32BE = (arr, offset) => {
        return ((arr[offset] << 24) | 
                (arr[offset + 1] << 16) | 
                (arr[offset + 2] << 8) | 
                 arr[offset + 3]) >>> 0;
    };

    const bcdToDec = (byte) => ((byte >> 4) * 10) + (byte & 0x0F);

    // --- PARSEO DE CABECERA (Primeros 18 bytes / 36 caracteres) ---
    // IMEI: 8 bytes (16 caracteres) directo del string para no perder caracteres
    let imei = cleanHex.substring(0, 16).toUpperCase();
    // Limpieza de relleno (padding), en redes suele terminar en 'F' si es impar
    if (imei.endsWith('F')) imei = imei.slice(0, -1);

    // B8: Separador (ignorado)
    // B9: RSRP, B10: RSSI, B11: BAND, B12: CARRIER
    const rsrp = bytes[9];
    const rssi = bytes[10];
    const band = bytes[11];
    const carrierCode = bytes[12];

    // Mapear código de carrier al nombre
    let carrier = "Unknown";
    if (carrierCode === 1) carrier = "Movistar";
    else if (carrierCode === 2) carrier = "Tigo";
    else if (carrierCode === 3) carrier = "Claro";

    // --- PARSEO TRAMA IOT (Siguientes 24 bytes / 48 caracteres, a partir del offset 18) ---
    const offset = 18;
    try {
        const bateria = bcdToDec(bytes[offset + 0]) / 10;
        const estadoModulo = bytes[offset + 1];
        // offset + 2, offset + 3 = Reservados
        const info = bytes[offset + 4];
        const caudalInstantaneo = readUint32BE(bytes, offset + 5);
        const volumenAcumuladoPositivo = readUint32BE(bytes, offset + 9);
        const volumenAcumuladoInverso = readUint32BE(bytes, offset + 13);
        const temperatura = bytes[offset + 17];
        const presion = readUint16BE(bytes, offset + 18);
        const codigoDiagnostico = readUint16BE(bytes, offset + 20);
        const tx = bytes[offset + 22];
        const tipoDispositivo = bytes[offset + 23];

        return {
            imei: imei,
            network: {
                rsrp: rsrp,
                rssi: rssi,
                band: band,
                carrier: carrier
            },
            iot: {
                bateria,
                estadoModulo,
                info,
                caudalInstantaneo,
                volumenAcumuladoPositivo,
                volumenAcumuladoInverso,
                temperatura,
                presion,
                codigoDiagnostico,
                tx,
                tipoDispositivo
            }
        };
    } catch (error) {
        throw new Error(`Error inesperado procesando trama IoT interna: ${error.message}`);
    }
}

module.exports = {
    decodeIoTFrame,
    decodeFullFrame
};
