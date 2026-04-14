const { response } = require('express');
const bcryptjs = require('bcryptjs')

const Usuario = require('../models/usuario');

const { generarJWT } = require('../helpers/generar-jwt');


const login = async(req, res = response) => {

    const { correo, password } = req.body;

    try {
        console.log('Login attempt for:', correo);
        console.log('Request body:', JSON.stringify(req.body));

        // Verificar si el email existe
        const usuario = await Usuario.findOne({ correo });
        if ( !usuario ) {
            console.log('User not found:', correo);
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - correo'
            });
        }

        // SI el usuario está activo
        if ( !usuario.estado ) {
            console.log('User inactive:', correo);
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - estado: false'
            });
        }

        // Verificar la contraseña
        const validPassword = bcryptjs.compareSync(password, usuario.password);
        if ( !validPassword ) {
            console.log('Invalid password for:', correo);
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - password'
            });
        }

        // Generar el JWT
        console.log('Generating JWT for user ID:', usuario.id);
        const token = await generarJWT( usuario.id );

        console.log('Login successful for:', correo);
        res.json({
            usuario,
            token
        })

    } catch (error) {
        console.error('SERVER ERROR IN LOGIN:', error);
        res.status(500).json({
            msg: 'Hable con el administrador',
            error: error.message || error // Proporcionar más info durante depuración
        });
    }

}

const logout = async (req, res = response) => {
    res.json({
        msg: 'Logout exitoso'
    });
}

module.exports = {
    login,
    logout
}
