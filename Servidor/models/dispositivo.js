const { Schema, model } = require('mongoose');

const DispositivoSchema = Schema({
    id: {
        type: String,
        required: [true, 'El ID alfanumérico es obligatorio'],
        unique: true
    },
    uid: {
        type: String,
        required: [true, 'El UID es obligatorio'],
        unique: true
    },
    estado: {
        type: Boolean,
        default: true
    }
});

DispositivoSchema.methods.toJSON = function() {
    const { __v, ...dispositivo  } = this.toObject();
    return dispositivo;
}

module.exports = model('Dispositivo', DispositivoSchema);
