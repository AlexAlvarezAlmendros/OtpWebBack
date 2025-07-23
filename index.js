require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const releaseRoutes = require('./routes/releaseRoutes');
const artistRoutes = require('./routes/artistRoutes');
const studioRoutes = require('./routes/studioRoutes');
const eventRoutes = require('./routes/eventRoutes');
const spotifyRoutes = require('./routes/spotifyRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// Middlewares
// Logging de todas las requests
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // URL del frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));
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
app.use('/api/spotify', spotifyRoutes);
app.use('/api/contact', contactRoutes);

// Middleware de manejo de errores JWT
app.use((err, req, res, next) => {
  console.error('🚨 Error middleware triggered:');
  console.error('📛 Error name:', err.name);
  console.error('📛 Error message:', err.message);
  console.error('📛 Error code:', err.code);
  console.error('📛 Error status:', err.status);
  
  if (err.name === 'UnauthorizedError') {
    console.error('🔐 JWT Error details:');
    console.error('  - Code:', err.code);
    console.error('  - Message:', err.message);
    console.error('  - Inner error:', err.inner);
    
    res.status(401).json({ 
      error: 'Token inválido o expirado',
      message: err.message,
      code: err.code
    });
  } else {
    console.error('❌ Generic error:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: err.message
    });
  }
});
