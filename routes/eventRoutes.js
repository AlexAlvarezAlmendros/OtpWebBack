const express = require('express');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { checkJwt } = require('../middleware/auth');
const { checkPermissions, checkOwnership } = require('../middleware/permissions');

const router = express.Router();

// GET todos los eventos (público)
router.get('/', getEvents);

// GET un solo evento por ID (público)
router.get('/:id', getEvent);

// POST (crear) un nuevo evento (requiere autenticación y permisos)
router.post('/', 
  checkJwt, 
  checkPermissions(['write:events']), 
  createEvent
);

// PATCH (actualizar) un evento (requiere ser dueño o admin)
router.patch('/:id', 
  checkJwt, 
  checkPermissions(['write:events']), 
  checkOwnership,
  updateEvent
);

// DELETE un evento (requiere ser dueño o admin)
router.delete('/:id', 
  checkJwt, 
  checkPermissions(['delete:events']), 
  checkOwnership,
  deleteEvent
);

module.exports = router;

