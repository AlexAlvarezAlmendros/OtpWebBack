const { getUserPermissionsAndRoles, isUserAdmin } = require('../utils/authHelpers');

const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      console.log('🚀 checkPermissions middleware started');
      console.log('🔍 req.user exists:', !!req.user);
      console.log('🔍 req.user content:', JSON.stringify(req.user, null, 2));
      
      if (!req.user) {
        console.log('❌ No user in request');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { permissions, roles } = getUserPermissionsAndRoles(req.user);

      console.log('🔍 Checking permissions for user:', req.user.email || req.user.sub);
      console.log('📋 Required permissions:', requiredPermissions);
      console.log('✅ User permissions:', permissions);
      console.log('👤 User roles:', roles);

      // Función para mapear roles a permisos (igual que en el frontend)
      const mapRolesToPermissions = (userRoles) => {
        let mappedPermissions = [];
        
        if (userRoles.includes('Admin') || userRoles.includes('admin')) {
          mappedPermissions = [
            'admin:all',
            'read:releases', 'write:releases', 'delete:releases',
            'read:artists', 'write:artists', 'delete:artists',
            'read:events', 'write:events', 'delete:events',
            'read:studios', 'write:studios', 'delete:studios'
          ];
        } else if (userRoles.includes('Editor') || userRoles.includes('editor')) {
          mappedPermissions = [
            'read:releases', 'write:releases',
            'read:artists', 'write:artists',
            'read:events', 'write:events',
            'read:studios', 'write:studios'
          ];
        } else if (userRoles.includes('User') || userRoles.includes('user')) {
          mappedPermissions = [
            'read:releases', 'read:artists', 'read:events', 'read:studios'
          ];
        }
        
        return mappedPermissions;
      };

      // Obtener permisos finales (directos o mapeados desde roles)
      let finalPermissions = [...permissions];
      
      // Si no hay permisos directos pero sí roles, mapear desde roles
      if (finalPermissions.length === 0 && roles.length > 0) {
        finalPermissions = mapRolesToPermissions(roles);
        console.log('🔄 Mapped permissions from roles:', finalPermissions);
      }

      // Verificar permisos
      const hasPermissions = requiredPermissions.every(permission => 
        finalPermissions.includes(permission) || finalPermissions.includes('admin:all')
      );
      
      if (!hasPermissions) {
        console.log('❌ Permission denied');
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermissions,
          userPermissions: finalPermissions,
          userRoles: roles
        });
      }

      console.log('✅ Permission granted');
      next();
    } catch (error) {
      console.error('❌ Error in permissions middleware:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

const checkOwnership = (req, res, next) => {
  try {
    const userId = req.user.sub;

    // Admin puede acceder a todo
    if (isUserAdmin(req.user)) {
      console.log('🔑 Admin access granted for user:', req.user.email || userId);
      return next();
    }
    
    // Para recursos existentes, verificar ownership en el controller
    req.checkOwnership = true;
    req.authenticatedUserId = userId;
    
    console.log('📝 Ownership check required for user:', req.user.email || userId);
    next();
  } catch (error) {
    console.error('❌ Error in ownership middleware:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { checkPermissions, checkOwnership };