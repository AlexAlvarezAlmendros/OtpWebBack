const User = require('../models/User');
const connectDB = require('../utils/dbConnection');

/**
 * GET /api/users/me
 * Obtener información del usuario actual (incluye rol)
 */
const getCurrentUser = async (req, res) => {
  try {
    // Ensure database connection
    await connectDB();
    
    const authData = req.auth || req.user;
    
    console.log('🔍 getCurrentUser - Auth data:', JSON.stringify(authData, null, 2));
    
    const auth0Id = authData.sub;
    
    // El email puede estar en diferentes lugares según la configuración de Auth0
    const email = authData.email 
      || authData['https://otp-records.com/email'] 
      || authData['http://otp-records.com/email'];
    
    const name = authData.name 
      || authData['https://otp-records.com/name']
      || authData.nickname 
      || email?.split('@')[0]; // Fallback: usar parte antes del @ del email

    console.log('📧 Extracted email:', email);
    console.log('👤 Extracted name:', name);

    if (!email) {
      return res.status(400).json({ 
        error: 'Email no encontrado en el token',
        debug: {
          availableKeys: Object.keys(authData)
        }
      });
    }

    // Buscar o crear usuario en BD local
    let user = await User.findOne({ auth0Id });

    if (!user) {
      // Crear usuario con rol 'user' por defecto
      user = await User.create({
        auth0Id,
        email,
        name: name || email,
        role: 'user'
      });
      console.log(`✅ Created new user: ${email} with role 'user'`);
    } else {
      // Actualizar lastLogin
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      id: user._id,
      auth0Id: user.auth0Id,
      name: user.name,
      email: user.email,
      role: user.role,
      eventPermissions: user.eventPermissions,
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

/**
 * GET /api/users
 * Listar todos los usuarios (solo admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ active: true })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/**
 * PUT /api/users/:id/role
 * Cambiar el rol de un usuario (solo admin)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar rol
    const validRoles = ['user', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Rol inválido',
        validRoles 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log(`✅ Updated user ${user.email} role to: ${role}`);

    res.json({
      success: true,
      message: 'Rol actualizado correctamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

/**
 * PUT /api/users/:id/event-permissions
 * Asignar permisos de eventos específicos a un usuario staff (solo admin)
 */
const updateEventPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventIds } = req.body;

    if (!Array.isArray(eventIds)) {
      return res.status(400).json({ 
        error: 'eventIds debe ser un array' 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { eventPermissions: eventIds },
      { new: true, runValidators: true }
    ).populate('eventPermissions', 'name date');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Permisos actualizados correctamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        eventPermissions: user.eventPermissions
      }
    });

  } catch (error) {
    console.error('Error updating event permissions:', error);
    res.status(500).json({ error: 'Error al actualizar permisos' });
  }
};

module.exports = {
  getCurrentUser,
  getAllUsers,
  updateUserRole,
  updateEventPermissions
};
