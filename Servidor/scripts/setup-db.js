const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Role = require('../models/role');
const Usuario = require('../models/usuario');

dotenv.config({ path: path.join(__dirname, '../.env') });

const setupDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN);
        console.log('📦 Conectado a MongoDB');

        // 1. Importar Roles desde archivo
        const rolesPath = path.join(__dirname, 'roles');
        if (fs.existsSync(rolesPath)) {
            const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf-8'));
            for (const r of rolesData) {
                const query = r._id && r._id.$oid ? { _id: r._id.$oid } : { rol: r.rol };
                const existeRol = await Role.findOne(query);
                if (!existeRol) {
                    const data = { ...r };
                    if (data._id && data._id.$oid) data._id = data._id.$oid;
                    const nuevoRol = new Role(data);
                    await nuevoRol.save();
                    console.log(`✅ Rol importado: ${r.rol}`);
                }
            }
        }

        // 2. Importar Usuarios desde archivo
        const usuariosPath = path.join(__dirname, 'usuarios');
        if (fs.existsSync(usuariosPath)) {
            const usuariosData = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8'));
            for (const u of usuariosData) {
                const existeUsuario = await Usuario.findOne({ correo: u.correo });
                if (!existeUsuario) {
                    const data = { ...u };
                    if (data._id && data._id.$oid) data._id = data._id.$oid;
                    const usuario = new Usuario(data);
                    await usuario.save();
                    console.log(`✅ Usuario importado: ${u.correo}`);
                }
            }
        }

        console.log('🚀 Importación completada con éxito');
        process.exit();
    } catch (error) {
        console.error('❌ Error durante la importación:', error);
        process.exit(1);
    }
};

setupDB();
