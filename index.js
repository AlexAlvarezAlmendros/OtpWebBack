require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const releaseRoutes = require('./routes/releaseRoutes');
const artistRoutes = require('./routes/artistRoutes');
const studioRoutes = require('./routes/studioRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Para parsear el body de las peticiones a JSON

// Conexión a la base de datos
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5001;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Conectado a MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto: ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error de conexión a la base de datos:', error);
    });

// Ruta de la api
app.use('/api/releases', releaseRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/studios', studioRoutes);
