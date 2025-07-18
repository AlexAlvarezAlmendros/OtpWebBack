const express = require('express');
const {
    getReleases,
    getRelease,
    createRelease,
    updateRelease,
    deleteRelease
} = require('../controllers/releaseController');
const { checkJwt, logJwtResult } = require('../middleware/auth');
const { checkPermissions, checkOwnership } = require('../middleware/permissions');

const router = express.Router();

// GET todos los releases (público)
router.get('/', getReleases);

// GET un solo release por ID (público)
router.get('/:id', getRelease);

// POST (crear) un nuevo release (requiere autenticación y permisos)
router.post('/', 
  checkJwt, 
  logJwtResult,
  checkPermissions(['write:releases']), 
  createRelease
);

// PATCH (actualizar) un release (requiere ser dueño o admin)
router.patch('/:id', 
  checkJwt, 
  checkPermissions(['write:releases']), 
  checkOwnership,
  updateRelease
);

// DELETE un release (requiere ser dueño o admin)
router.delete('/:id', 
  checkJwt, 
  checkPermissions(['delete:releases']), 
  checkOwnership,
  deleteRelease
);

module.exports = router;

