const express = require('express');
const {
    getBeats,
    getBeat,
    createBeat,
    updateBeat,
    deleteBeat,
    createCheckoutSession
} = require('../controllers/beatController');
const { checkJwt } = require('../middleware/auth');
const { checkPermissions, checkOwnership } = require('../middleware/permissions');

const router = express.Router();

// GET all beats (public)
router.get('/', getBeats);

// POST create checkout session for beat purchase (requires auth)
// IMPORTANTE: Debe estar ANTES de /:id para evitar conflictos
router.post('/create-checkout-session',
  checkJwt,
  createCheckoutSession
);

// GET a single beat by ID (public)
router.get('/:id', getBeat);

// POST (create) a new beat (requires auth and permissions)
router.post('/', 
  checkJwt, 
  checkPermissions(['write:beats']), 
  createBeat
);

// PATCH (update) a beat (requires owner or admin)
router.patch('/:id', 
  checkJwt, 
  checkPermissions(['write:beats']), 
  checkOwnership,
  updateBeat
);

// PUT (update) a beat (requires owner or admin)
router.put('/:id', 
  checkJwt, 
  checkPermissions(['write:beats']), 
  checkOwnership,
  updateBeat
);

// DELETE a beat (requires owner or admin)
router.delete('/:id', 
  checkJwt, 
  checkPermissions(['delete:beats']), 
  checkOwnership,
  deleteBeat
);

module.exports = router;
