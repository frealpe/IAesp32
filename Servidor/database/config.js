const mongoose = require('mongoose');

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN);
        console.log('📦 Base de datos MongoDB en línea');
    } catch (error) {
        console.error(error);
        throw new Error('❌ Error de conexión a la BD');
    }
}

module.exports = {
    dbConnection
}
