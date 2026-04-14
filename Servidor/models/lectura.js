const { Schema, model } = require('mongoose');

const LecturaSchema = Schema({
    meterSerial: {
        type: String,
        required: [true, 'El serial del medidor es obligatorio']
    },
    meterIndex: {
        type: String,
        required: [true, 'El índice del medidor es obligatorio']
    },
    meterDateTime: {
        type: String,
        required: [true, 'La fecha y hora del medidor es obligatoria']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    dataRaw: {
        type: Object
    }
});

LecturaSchema.index({ meterSerial: 1, timestamp: -1 });

module.exports = model('Lectura', LecturaSchema);
