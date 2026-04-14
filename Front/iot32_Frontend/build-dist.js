import fs from 'fs/promises';
import path from 'path';

const DIST_PATH = './dist';
const OUTPUT_PATH = '../../AP/src/iotesp32.h';

async function convertToHex(filePath) {
    try {
        const data = await fs.readFile(filePath);
        const hexArray = [];
        for (let i = 0; i < data.length; i++) {
            let hex = '0x' + data[i].toString(16).padStart(2, '0');
            // Agregamos un salto de línea cada 16 bytes para que el archivo sea legible y compatible
            if (i > 0 && i % 16 === 0) {
                hex = '\n  ' + hex;
            }
            hexArray.push(hex);
        }
        return {
            hexString: hexArray.join(','),
            length: data.length
        };
    } catch (err) {
        console.error(`ERROR: No se pudo leer ${filePath}`);
        return null;
    }
}

async function run() {
    console.log("INFO: ¡Convertidor de archivos para ESP32 iniciado!");

    // Definimos los archivos que realmente existen en el nuevo build de Vite
    const files = [
        { name: 'index_html', path: path.join(DIST_PATH, 'index.html.gz'), original: 'index.html' },
        { name: 'app_js', path: path.join(DIST_PATH, 'assets/iot32.js.gz'), original: 'assets/iot32.js' },
        { name: 'app_js2', path: path.join(DIST_PATH, 'assets/iot322.js.gz'), original: 'assets/iot322.js' },
        { name: 'favicon_svg', path: path.join(DIST_PATH, 'favicon.svg'), original: 'favicon.svg' },
        { name: 'icons_svg', path: path.join(DIST_PATH, 'icons.svg'), original: 'icons.svg' },
        { name: 'acueducto_jpeg', path: path.join(DIST_PATH, 'assets/acueducto.jpeg'), original: 'assets/acueducto.jpeg' },
        { name: 'logo_jpeg', path: path.join(DIST_PATH, 'assets/Logo.jpeg'), original: 'assets/Logo.jpeg' }
    ];

    let content = `#include <pgmspace.h>\n\n`;

    for (const file of files) {
        console.log(`PROCESANDO: ${file.path}...`);
        const result = await convertToHex(file.path);
        
        if (result) {
            content += `#define ${file.name}_length ${result.length}\n`;
            content += `const uint8_t ${file.name}[] PROGMEM = {${result.hexString}};\n\n`;
        }
    }

    try {
        // Aseguramos que el directorio de salida exista
        const outputDir = path.dirname(OUTPUT_PATH);
        await fs.mkdir(outputDir, { recursive: true });

        await fs.writeFile(OUTPUT_PATH, content, 'utf8');
        console.log(`INFO: ¡Archivo (${path.basename(OUTPUT_PATH)}) creado correctamente en ${OUTPUT_PATH}!`);
    } catch (err) {
        console.error(`ERROR: No se pudo escribir el archivo de salida: ${err.message}`);
    }
}

run();