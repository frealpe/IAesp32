const validarCampos = require('../middlewares/validar-campos');
const validarJWT = require('./validar-jwt');
const validaRoles = require('../middlewares/validar-roles');

module.exports = {
    ...validarCampos,
    ...validarJWT,
    ...validaRoles,
    validateRequest: validarJWT.validarJWT,
}
