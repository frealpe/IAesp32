const { response } = require('express');
const crypto = require('crypto');
const Dispositivo = require('../models/dispositivo');
const { registerMeterExternal } = require('../helpers/acueductoService');

const getDispositivos = async (req, res = response) => {
    try {
        const dispositivos = await Dispositivo.find();
        res.json({ dispositivos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
}

const crearDispositivo = async (req, res = response) => {
    const { id, estado } = req.body;
    const uid = crypto.randomUUID(); 
    
    try {
        if (estado === true) {
            const extResult = await registerMeterExternal(id);
            if (!extResult.success) {
                return res.status(400).json({ msg: `Error en API externa: ${extResult.message}` });
            }
        }

        const dispositivo = new Dispositivo({ id, uid, estado });
        await dispositivo.save();
        res.status(201).json(dispositivo);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: `El ID ${id} ya está registrado` });
        }
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
}

const actualizarDispositivo = async (req, res = response) => {
    const { id: mongoId } = req.params;
    const { _id, uid, ...resto } = req.body;

    try {
        if (resto.estado === true) {
            // Buscamos el ID (serial) actual si no viene en el resto
            const currentDev = await Dispositivo.findById(mongoId);
            const serialToRegister = resto.id || currentDev.id;
            
            const extResult = await registerMeterExternal(serialToRegister);
            if (!extResult.success) {
                return res.status(400).json({ msg: `Error en API externa: ${extResult.message}` });
            }
        }

        const dispositivo = await Dispositivo.findByIdAndUpdate(mongoId, resto, { new: true });
        res.json(dispositivo);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: `El ID ya está registrado en otro dispositivo` });
        }
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
}

const borrarDispositivo = async (req, res = response) => {
    const { id } = req.params;
    try {
        await Dispositivo.findByIdAndDelete(id);
        res.json({ msg: 'Dispositivo eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
}

module.exports = {
    getDispositivos,
    crearDispositivo,
    actualizarDispositivo,
    borrarDispositivo
}
