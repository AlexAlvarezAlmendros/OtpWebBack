const express = require('express');
const {
    getStudios,
    getStudio,
    createStudio,
    updateStudio,
    deleteStudio
} = require('../controllers/studioController');

const router = express.Router();

// GET todos los estudios
router.get('/', getStudios);

// GET un solo estudio por ID
router.get('/:id', getStudio);

// POST (crear) un nuevo estudio
router.post('/', createStudio);

// PATCH (actualizar) un estudio
router.patch('/:id', updateStudio);

// DELETE un estudio
router.delete('/:id', deleteStudio);

module.exports = router;

