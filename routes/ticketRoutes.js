const express = require('express');
const router = express.Router();
const {
	createCheckoutSession,
	handleWebhook,
	verifyTicket,
	validateTicket,
	getMyTickets,
	getEventSales
} = require('../controllers/ticketController');
const { checkJwt } = require('../middleware/auth');
const { checkPermissions } = require('../middleware/permissions');

/**
 * POST /api/tickets/create-checkout-session
 * Crear una sesión de Stripe Checkout
 * Público
 */
router.post('/create-checkout-session', createCheckoutSession);

/**
 * NOTA: El webhook está configurado directamente en index.js
 * porque necesita express.raw() antes de express.json()
 * Ver: app.post('/api/tickets/webhook', ...)
 */

/**
 * GET /api/tickets/verify/:ticketCode
 * Verificar la validez de un ticket
 * Público (para que puedan verificar en la puerta)
 */
router.get('/verify/:ticketCode', verifyTicket);

/**
 * POST /api/tickets/validate/:ticketCode
 * Marcar un ticket como validado (usado en el evento)
 * Requiere autenticación de admin
 */
router.post('/validate/:ticketCode', checkJwt, checkPermissions(['admin:all']), validateTicket);

/**
 * GET /api/tickets/my-tickets
 * Obtener los tickets del usuario autenticado
 * Requiere autenticación
 */
router.get('/my-tickets', checkJwt, getMyTickets);

/**
 * GET /api/tickets/event/:eventId/sales
 * Obtener estadísticas de ventas de un evento
 * Requiere autenticación de admin
 */
router.get('/event/:eventId/sales', checkJwt, checkPermissions(['admin:all']), getEventSales);

module.exports = router;
