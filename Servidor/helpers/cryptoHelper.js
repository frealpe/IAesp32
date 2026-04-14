const crypto = require('crypto');

/**
 * Encrypts a plaintext string using AES-256-CBC with PKCS7 padding.
 * 
 * @param {string} text - The plaintext to encrypt.
 * @param {string} b64Key - The AES-256 key in Base64 format (32 bytes decoded).
 * @param {string} b64IV - The initialization vector in Base64 format (16 bytes decoded).
 * @returns {string} The encrypted data in Base64 format.
 */
const encrypt = (text, b64Key, b64IV) => {
    try {
        const key = Buffer.from(b64Key, 'base64');
        const iv = Buffer.from(b64IV, 'base64');

        if (key.length !== 32) throw new Error('Key must be 32 bytes (Base64 encoded)');
        if (iv.length !== 16) throw new Error('IV must be 16 bytes (Base64 encoded)');

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error.message);
        throw error;
    }
};

/**
 * Decrypts a Base64-encoded ciphertext using AES-256-CBC with PKCS7 padding.
 * 
 * @param {string} encryptedText - The ciphertext in Base64 format.
 * @param {string} b64Key - The AES-256 key in Base64 format (32 bytes decoded).
 * @param {string} b64IV - The initialization vector in Base64 format (16 bytes decoded).
 * @returns {string} The decrypted plaintext.
 */
const decrypt = (encryptedText, b64Key, b64IV) => {
    try {
        const key = Buffer.from(b64Key, 'base64');
        const iv = Buffer.from(b64IV, 'base64');

        if (key.length !== 32) throw new Error('Key must be 32 bytes (Base64 encoded)');
        if (iv.length !== 16) throw new Error('IV must be 16 bytes (Base64 encoded)');

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw error;
    }
};

module.exports = {
    encrypt,
    decrypt
};
