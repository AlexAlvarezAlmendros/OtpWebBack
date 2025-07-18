const express = require('express');
const {
    getArtists,
    getArtist,
    createArtist,
    updateArtist,
    deleteArtist
} = require('../controllers/artistController');
const { checkJwt } = require('../middleware/auth');
const { checkPermissions, checkOwnership } = require('../middleware/permissions');

const router = express.Router();

// GET todos los artistas (público)
router.get('/', getArtists);

// GET un solo artista por ID (público)
router.get('/:id', getArtist);

// POST (crear) un nuevo artista (requiere autenticación y permisos)
router.post('/', 
  checkJwt, 
  checkPermissions(['write:artists']), 
  createArtist
);

// PATCH (actualizar) un artista (requiere ser dueño o admin)
router.patch('/:id', 
  checkJwt, 
  checkPermissions(['write:artists']), 
  checkOwnership,
  updateArtist
);

// DELETE un artista (requiere ser dueño o admin)
router.delete('/:id', 
  checkJwt, 
  checkPermissions(['delete:artists']), 
  checkOwnership,
  deleteArtist
);

module.exports = router;

