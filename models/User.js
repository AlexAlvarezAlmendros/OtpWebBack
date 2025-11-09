const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  // ID del usuario de Auth0
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Información básica
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  // Sistema de roles
  role: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    default: 'user'
  },
  
  // Permisos específicos por evento (opcional)
  eventPermissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Metadata
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
userSchema.index({ auth0Id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
