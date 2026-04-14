const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { 
    getDispositivos, 
    crearDispositivo, 
    actualizarDispositivo, 
    borrarDispositivo 
} = require('../controllers/dispositivos');

const router = Router();

router.get('/', getDispositivos);

router.post('/', [
    check('id', 'El ID alfanumérico es obligatorio').not().isEmpty(),
    validarCampos
], crearDispositivo);

router.put('/:id', [
    check('id', 'El ID alfanumérico es obligatorio').not().isEmpty(),
    validarCampos
], actualizarDispositivo);

router.delete('/:id', borrarDispositivo);

module.exports = router;
