const express = require('express');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

const router = express.Router();

// GET todos los eventos
router.get('/', getEvents);

// GET un solo evento por ID
router.get('/:id', getEvent);

// POST (crear) un nuevo evento
router.post('/', createEvent);

// PATCH (actualizar) un evento
router.patch('/:id', updateEvent);

// DELETE un evento
router.delete('/:id', deleteEvent);

module.exports = router;

