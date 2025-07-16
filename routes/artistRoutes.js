const express = require('express');
const {
    getArtists,
    getArtist,
    createArtist,
    updateArtist,
    deleteArtist
} = require('../controllers/artistController');

const router = express.Router();

// GET todos los artistas
router.get('/', getArtists);

// GET un solo artista por ID
router.get('/:id', getArtist);

// POST (crear) un nuevo artista
router.post('/', createArtist);

// PATCH (actualizar) un artista
router.patch('/:id', updateArtist);

// DELETE un artista
router.delete('/:id', deleteArtist);

module.exports = router;

