const express = require('express');
const {
    getReleases,
    getRelease,
    createRelease,
    updateRelease,
    deleteRelease
} = require('../controllers/releaseController');

const router = express.Router();

// GET todos los releases
router.get('/', getReleases);

// GET un solo release por ID
router.get('/:id', getRelease);

// POST (crear) un nuevo release
router.post('/', createRelease);

// PATCH (actualizar) un release
router.patch('/:id', updateRelease);

// DELETE un release
router.delete('/:id', deleteRelease);

module.exports = router;

