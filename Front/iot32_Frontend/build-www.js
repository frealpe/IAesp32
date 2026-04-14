/**
 * build-www.js — Copy compiled frontend to /www/ for MicroPython LittleFS upload
 *
 * Usage:
 *   npm run www          → builds + copies dist/ to ../../Esp32/www/
 *
 * The output directory matches the ESP32 web server path:
 *   web.py  →  GET /  →  /www/index.html
 *
 * Recommended LittleFS upload command:
 *   mpremote connect /dev/ttyUSB0 fs cp -r www/ :www/
 */
import fs   from 'fs/promises';
import path from 'path';

const DIST_PATH = './dist';
const WWW_PATH  = '../../Esp32/www';  // served by web.py from LittleFS /www/

async function copyDir(src, dst, gzOnly = true) {
    await fs.mkdir(dst, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    // Build a set of filenames that have a .gz sibling
    const names = new Set(entries.map(e => e.name));

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, dstPath, gzOnly);
        } else {
            // Skip uncompressed file if a .gz version exists (web.py serves gz with encoding header)
            if (gzOnly && !entry.name.endsWith('.gz')) {
                const compressible = ['.js', '.css', '.html', '.json', '.svg'];
                const ext = path.extname(entry.name).toLowerCase();
                if (compressible.includes(ext) && names.has(entry.name + '.gz')) {
                    continue; // skip — gz version will be served
                }
            }
            await fs.copyFile(srcPath, dstPath);
            const stat = await fs.stat(dstPath);
            console.log(`  COPY  ${srcPath.replace(DIST_PATH, '')}  (${(stat.size / 1024).toFixed(1)} KB)`);
        }
    }
}

async function run() {
    console.log('\n[build-www] Preparing LittleFS /www/ folder...');

    // Clean target
    try {
        await fs.rm(WWW_PATH, { recursive: true, force: true });
    } catch (_) {}

    // Check dist exists
    try {
        await fs.access(DIST_PATH);
    } catch {
        console.error('[build-www] ERROR: dist/ not found. Run `npm run build` first.');
        process.exit(1);
    }

    // Copy dist → www
    await copyDir(DIST_PATH, WWW_PATH);

    // Report total size
    const files = await collectFiles(WWW_PATH);
    const totalKB = files.reduce((acc, f) => acc + f.size, 0) / 1024;
    console.log(`\n[build-www] Done! ${files.length} files → ${WWW_PATH}`);
    console.log(`[build-www] Total size: ${totalKB.toFixed(1)} KB`);

    if (totalKB > 900) {
        console.warn('[build-www] WARNING: Size > 900 KB — LittleFS partition may be too small!');
        console.warn('           Enable compression in vite.config.js and remove unused assets.');
    } else {
        console.log('[build-www] ✓ Size OK for 1 MB LittleFS partition.');
    }

    console.log('\nTo upload to ESP32 run:');
    console.log('  mpremote connect /dev/ttyUSB0 fs cp -r ../../Esp32/www/ :www/\n');
}

async function collectFiles(dir, acc = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            await collectFiles(p, acc);
        } else {
            const s = await fs.stat(p);
            acc.push({ path: p, size: s.size });
        }
    }
    return acc;
}

run().catch(err => { console.error(err); process.exit(1); });
