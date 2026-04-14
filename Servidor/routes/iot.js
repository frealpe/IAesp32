const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { 
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
} = require('../controllers/iot');

const router = Router();

/**
 * @route   POST /api/iot/auth/default
 * @desc    Auth usando HTTP_USER_NAME y HTTP_PASSWORD del .env (sin enviar credenciales desde el frontend)
 * @access  Public
 */
router.post('/auth/default', authIoTDefault);

/**
 * @route   POST /api/iot/auth
 * @desc    Autenticación para dispositivos ESP32
 * @access  Public
 */
router.post('/auth', [
    check('name', 'El nombre (http_user_name) es obligatorio').not().isEmpty(),
    check('key', 'La clave (http_password) es obligatoria').not().isEmpty(),
    validarCampos
], authIoT);

/**
 * @route   POST /api/iot/register
 * @desc    Registro inicial del medidor (Requiere JWT y payload cifrado)
 * @access  Private (JWT)
 */
router.post('/register', [
    validarJWT,
    check('data', 'El payload cifrado es obligatorio').not().isEmpty(),
    validarCampos
], registerDevice);

/**
 * @route   POST /api/iot/saveIndex
 * @desc    Guardar lectura de índice (Requiere JWT y payload cifrado)
 * @access  Private (JWT)
 */
router.post('/saveIndex', [
    validarJWT,
    check('data', 'El payload cifrado es obligatorio').not().isEmpty(),
    validarCampos
], saveIndex);

/**
 * @route   POST /api/iot/saveAlarm
 * @desc    Guardar alarma del medidor (Requiere JWT y payload cifrado)
 * @access  Private (JWT)
 */
router.post('/saveAlarm', [
    validarJWT,
    check('data', 'El payload cifrado es obligatorio').not().isEmpty(),
    validarCampos
], saveAlarm);

/**
 * @route   POST /api/iot/saveBatch
 * @desc    Guardar lote de lecturas (Requiere JWT y payload cifrado)
 * @access  Private (JWT)
 */
router.post('/saveBatch', [
    validarJWT,
    check('data', 'El payload cifrado es obligatorio').not().isEmpty(),
    validarCampos
], saveBatch);

router.get('/lecturas', [
    validarJWT,
    validarCampos
], getLecturas);

/**
 * @route   GET /api/iot/getIndex
 * @desc    Consultar el índice/lectura actual del medidor (http_get_index_path)
 * @access  Private (JWT)
 */
router.get('/getIndex', [
    validarJWT,
    validarCampos
], getIndex);

/**
 * @route   GET /api/iot/getMeters
 * @desc    Obtener lista de medidores (http_get_meters_path)
 * @access  Private (JWT)
 */
router.get('/getMeters', [
    validarJWT,
    validarCampos
], getMeters);

/**
 * @route   GET /api/iot/getMetersIndices
 * @desc    Consultar lecturas históricas por serial y fecha
 * @access  Private (JWT)
 */
router.get('/getMetersIndices', [
    validarJWT,
    validarCampos
], getMetersIndices);

/**
 * @route   POST /api/iot/encryptTest
 * @desc    Prueba de cifrado AES-256-CBC (http_encrypt_test_path)
 *          Recibe { data } cifrado y devuelve el payload descifrado
 * @access  Private (JWT)
 */
router.post('/encryptTest', [
    validarJWT,
    check('data', 'El payload cifrado es obligatorio').not().isEmpty(),
    validarCampos
], encryptTest);

/**
 * @route   POST /api/iot/manualDispatcher
 * @desc    Replica de http_manual_dispatcher(): prueba manual de cualquier path
 *          Body: { path, method, extraData? }
 * @access  Private (JWT)
 */
router.post('/manualDispatcher', [
    validarJWT,
    check('path', 'El path es obligatorio').not().isEmpty(),
    check('method', 'El método (GET/POST) es obligatorio').not().isEmpty(),
    validarCampos
], manualDispatcher);

/**
 * @route   POST /api/iot/test-acueducto
 * @desc    Prueba interna de conexión con Acueducto
 * @access  Private (JWT)
 */
router.post('/test-acueducto', [
    validarJWT,
    validarCampos
], testAcueducto);

module.exports = router;
