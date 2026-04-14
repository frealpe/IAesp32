const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const Usuario = require('../models/usuario');

dotenv.config();

const createUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN);
        console.log('📦 Conectado a MongoDB');

        const userData = {
            nombre: 'Fabio Realpe',
            correo: 'frealpe@gmail.com',
            password: '123456',
            rol: 'ADMIN_ROLE'
        };

        const existeUsuario = await Usuario.findOne({ correo: userData.correo });

        if (existeUsuario) {
            console.log('⚠️ El usuario ya existe');
            process.exit();
        }

        const usuario = new Usuario(userData);

        // Encriptar la contraseña
        const salt = bcryptjs.genSaltSync();
        usuario.password = bcryptjs.hashSync(userData.password, salt);

        await usuario.save();
        console.log('✅ Usuario creado exitosamente:', userData.correo);
        process.exit();
    } catch (error) {
        console.error('❌ Error al crear el usuario:', error);
        process.exit(1);
    }
};

createUser();
