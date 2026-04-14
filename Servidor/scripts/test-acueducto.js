/**
 * test-acueducto.js
 * Prueba completa de la conexión con la API externa de Acueducto.
 * Uso: node scripts/test-acueducto.js [serial]
 * Ej:  node scripts/test-acueducto.js serial1320001
 */
const dotenv = require('dotenv');
dotenv.config();

const {
    getAcueductoToken,
    registerMeterExternal,
    saveIndexExternal,
    getMetersExternal,
    getMetersIndicesExternal,
} = require('../helpers/acueductoService');

const serial   = process.argv[2] || 'serial1320001';
const sep      = '─'.repeat(55);

const ok  = (msg) => console.log(`  ✅  ${msg}`);
const err = (msg) => console.log(`  ❌  ${msg}`);
const inf = (msg) => console.log(`  ℹ️   ${msg}`);

(async () => {
    console.log('\n' + sep);
    console.log('  🧪  Test API Acueducto');
    console.log(sep);
    inf(`URL Auth   : ${process.env.ACUEDUCTO_AUTH_URL}`);
    inf(`User       : ${process.env.ACUEDUCTO_USER}`);
    inf(`Provider   : ${process.env.ACUEDUCTO_PROVIDER_TOKEN ? process.env.ACUEDUCTO_PROVIDER_TOKEN.substring(0, 30) + '…' : '(no definido)'}`);
    inf(`Serial test: ${serial}`);
    console.log(sep + '\n');

    // ── 1. GetToken ───────────────────────────────────────────────────
    console.log('[ 1/4 ] GetToken (http_get_token)');
    let token;
    try {
        token = await getAcueductoToken();
        ok(`Token obtenido: ${token.substring(0, 40)}…`);
    } catch (e) {
        err(`GetToken falló: ${e.message}`);
        process.exit(1);
    }

    // ── 2. Register ───────────────────────────────────────────────────
    console.log('\n[ 2/4 ] RegisterMeterSerial (http_post_data/register)');
    try {
        const res = await registerMeterExternal(serial);
        if (res.success || res.alreadyExists) {
            ok(`Register: ${res.message || JSON.stringify(res)}`);
        } else {
            err(`Register: ${res.message || JSON.stringify(res)}`);
        }
    } catch (e) {
        err(`Register falló: ${e.message}`);
    }

    // ── 3. SaveIndex ──────────────────────────────────────────────────
    console.log('\n[ 3/4 ] SaveIndex (http_post_data/saveIndex)');
    try {
        const now = new Date();
        const dt  = now.getFullYear().toString()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0')
            + String(now.getHours()).padStart(2, '0')
            + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0');
        const res = await saveIndexExternal(serial, '00123456', dt);
        ok(`SaveIndex: ${JSON.stringify(res)}`);
    } catch (e) {
        err(`SaveIndex falló: ${e.message}`);
    }

    // ── 4. GetMeters ──────────────────────────────────────────────────
    console.log('\n[ 4/5 ] GetMeters (http_get_data/getMeters)');
    try {
        const res = await getMetersExternal();
        ok(`GetMeters: ${JSON.stringify(res).substring(0, 120)}…`);
    } catch (e) {
        err(`GetMeters falló: ${e.message}`);
    }

    // ── 5. GetIndexsByMeter ───────────────────────────────────────────
    console.log('\n[ 5/5 ] GetIndexsByMeter (Reporte)');
    const dates = ['202410', '2024-10-01', '20241001', '202501', '202502'];
    for (const d of dates) {
        console.log(`\n  --- Probando con meterCutoffDate=${d} ---`);
        
        // 5a. Sin arrivalCutoffDate
        try {
            console.log(`  > Solicitud: meterSerial=${serial}&meterCutoffDate=${d}`);
            const res = await getMetersIndicesExternal(serial, d);
            ok(`Respuesta (sin arrival): ${JSON.stringify(res).substring(0, 150)}…`);
        } catch (e) {
            err(`Error (sin arrival): ${e.message}`);
        }

        // 5b. Con arrivalCutoffDate (usando 202502 para ver si hay algo recién registrado)
        try {
            const arr = '202502';
            console.log(`  > Solicitud: meterSerial=${serial}&meterCutoffDate=${d}&arrivalCutoffDate=${arr}`);
            const res = await getMetersIndicesExternal(serial, d, arr);
            ok(`Respuesta (con arrival=${arr}): ${JSON.stringify(res).substring(0, 150)}…`);
        } catch (e) {
            err(`Error (con arrival): ${e.message}`);
        }
    }

    console.log('\n' + sep);
    console.log('  ✔️   Prueba completada');
    console.log(sep + '\n');
    process.exit(0);
})();
