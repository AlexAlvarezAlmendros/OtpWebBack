const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const QRCode = require('qrcode');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const EmailService = require('../services/emailService');

// Inicializar el servicio de email
const emailService = new EmailService();

/**
 * Genera un código único de ticket
 */
function generateUniqueTicketCode() {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substr(2, 9).toUpperCase();
	return `TICKET-${timestamp}-${random}`;
}

/**
 * Genera un código QR en formato base64
 */
async function generateQRCode(ticketCode) {
	try {
		return await QRCode.toDataURL(ticketCode);
	} catch (error) {
		console.error('Error generando QR Code:', error);
		throw error;
	}
}

/**
 * POST /api/tickets/create-checkout-session
 * Crea una sesión de Stripe Checkout para comprar tickets
 */
const createCheckoutSession = async (req, res) => {
	try {
		const { eventId, quantity, customerEmail, customerName } = req.body;

		// Validar datos de entrada
		if (!eventId || !quantity || !customerEmail || !customerName) {
			return res.status(400).json({ 
				error: 'Faltan datos requeridos: eventId, quantity, customerEmail, customerName' 
			});
		}

		// 1. Verificar que el evento existe y tiene tickets disponibles
		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({ error: 'Evento no encontrado' });
		}

		if (!event.ticketsEnabled) {
			return res.status(400).json({ error: 'Este evento no tiene venta de entradas habilitada' });
		}

		// 2. Verificar disponibilidad de tickets
		if (event.availableTickets < quantity) {
			return res.status(400).json({ 
				error: `Solo quedan ${event.availableTickets} entradas disponibles` 
			});
		}

		// 3. Verificar fechas de venta
		const now = new Date();
		if (event.saleStartDate && now < new Date(event.saleStartDate)) {
			return res.status(400).json({ 
				error: 'La venta de entradas aún no ha comenzado' 
			});
		}
		if (event.saleEndDate && now > new Date(event.saleEndDate)) {
			return res.status(400).json({ 
				error: 'La venta de entradas ha finalizado' 
			});
		}

		// 4. Crear sesión de Stripe Checkout
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [{
				price_data: {
					currency: event.ticketCurrency.toLowerCase(),
					product_data: {
						name: `Entrada - ${event.name}`,
						description: `${quantity} entrada(s) para ${event.name}`,
						images: event.img ? [event.img] : []
					},
					unit_amount: Math.round(event.ticketPrice * 100) // Stripe usa centavos
				},
				quantity: quantity
			}],
			mode: 'payment',
			success_url: `${process.env.FRONTEND_URL}/eventos/${eventId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.FRONTEND_URL}/eventos/${eventId}?canceled=true`,
			customer_email: customerEmail,
			metadata: {
				eventId: eventId.toString(),
				eventName: event.name,
				customerName: customerName,
				quantity: quantity.toString()
			}
		});

		res.json({
			sessionId: session.id,
			url: session.url
		});

	} catch (error) {
		console.error('Error creating checkout session:', error);
		res.status(500).json({ 
			error: 'Error al crear sesión de pago',
			details: error.message 
		});
	}
};

/**
 * POST /api/tickets/webhook
 * Recibe notificaciones de Stripe sobre el estado del pago
 */
const handleWebhook = async (req, res) => {
	const sig = req.headers['stripe-signature'];
	let event;

	try {
		// Verificar la firma del webhook
		event = stripe.webhooks.constructEvent(
			req.body,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		console.error('Webhook signature verification failed:', err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	// Manejar el evento
	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		
		try {
			// 1. Generar código único de ticket y QR
			const ticketCode = generateUniqueTicketCode();
			const qrCodeData = await generateQRCode(ticketCode);
			
			// 2. Crear el ticket en la base de datos
			const ticket = await Ticket.create({
				eventId: session.metadata.eventId,
				purchaseId: session.id,
				customerEmail: session.customer_email,
				customerName: session.metadata.customerName,
				quantity: parseInt(session.metadata.quantity),
				totalAmount: session.amount_total / 100,
				currency: session.currency.toUpperCase(),
				status: 'completed',
				ticketCode: ticketCode,
				qrCode: qrCodeData
			});
			
			// 3. Actualizar el evento (reducir tickets disponibles)
			const updatedEvent = await Event.findByIdAndUpdate(
				session.metadata.eventId,
				{
					$inc: {
						availableTickets: -parseInt(session.metadata.quantity),
						ticketsSold: parseInt(session.metadata.quantity)
					}
				},
				{ new: true }
			);
			
			// 4. Enviar email con el ticket
			await emailService.sendTicketEmail(ticket, session.metadata.eventName, updatedEvent);
			
			console.log(`✅ Ticket creado exitosamente: ${ticketCode}`);
			
		} catch (error) {
			console.error('Error processing webhook:', error);
			// Registrar el error pero no fallar el webhook
			// Stripe reintentará si falla
		}
	}

	res.json({ received: true });
};

/**
 * GET /api/tickets/verify/:ticketCode
 * Verificar validez de un ticket por su código
 */
const verifyTicket = async (req, res) => {
	try {
		const { ticketCode } = req.params;

		const ticket = await Ticket.findOne({ ticketCode }).populate('eventId');
		
		if (!ticket) {
			return res.status(404).json({ 
				valid: false,
				error: 'Ticket no encontrado' 
			});
		}

		if (ticket.status !== 'completed') {
			return res.status(400).json({ 
				valid: false,
				error: 'El ticket no está activo',
				status: ticket.status
			});
		}

		if (ticket.validated) {
			return res.status(200).json({
				valid: true,
				alreadyUsed: true,
				message: 'Este ticket ya fue validado anteriormente',
				validatedAt: ticket.validatedAt,
				ticket: {
					code: ticket.ticketCode,
					customerName: ticket.customerName,
					quantity: ticket.quantity,
					eventName: ticket.eventId.name,
					eventDate: ticket.eventId.date
				}
			});
		}

		res.json({
			valid: true,
			alreadyUsed: false,
			ticket: {
				code: ticket.ticketCode,
				customerName: ticket.customerName,
				customerEmail: ticket.customerEmail,
				quantity: ticket.quantity,
				eventName: ticket.eventId.name,
				eventDate: ticket.eventId.date,
				eventLocation: ticket.eventId.location
			}
		});

	} catch (error) {
		console.error('Error verifying ticket:', error);
		res.status(500).json({ 
			error: 'Error al verificar el ticket' 
		});
	}
};

/**
 * POST /api/tickets/validate/:ticketCode
 * Marcar un ticket como validado (usado en el evento)
 */
const validateTicket = async (req, res) => {
	try {
		const { ticketCode } = req.params;

		const ticket = await Ticket.findOne({ ticketCode }).populate('eventId');
		
		if (!ticket) {
			return res.status(404).json({ 
				error: 'Ticket no encontrado' 
			});
		}

		if (ticket.validated) {
			return res.status(400).json({ 
				error: 'Este ticket ya fue validado anteriormente',
				validatedAt: ticket.validatedAt
			});
		}

		if (ticket.status !== 'completed') {
			return res.status(400).json({ 
				error: 'El ticket no está en estado válido para ser usado',
				status: ticket.status
			});
		}

		// Marcar como validado
		ticket.validated = true;
		ticket.validatedAt = new Date();
		await ticket.save();

		res.json({
			success: true,
			message: 'Ticket validado correctamente',
			ticket: {
				code: ticket.ticketCode,
				customerName: ticket.customerName,
				quantity: ticket.quantity,
				eventName: ticket.eventId.name,
				validatedAt: ticket.validatedAt
			}
		});

	} catch (error) {
		console.error('Error validating ticket:', error);
		res.status(500).json({ 
			error: 'Error al validar el ticket' 
		});
	}
};

/**
 * GET /api/tickets/my-tickets
 * Obtener tickets del usuario actual (requiere autenticación)
 */
const getMyTickets = async (req, res) => {
	try {
		// express-jwt v8+ usa req.auth en lugar de req.user
		const user = req.auth || req.user;
		const userEmail = user?.email;

		if (!userEmail) {
			return res.status(401).json({ 
				error: 'Usuario no autenticado' 
			});
		}

		const tickets = await Ticket.find({ 
			customerEmail: userEmail,
			status: 'completed'
		})
		.populate('eventId')
		.sort({ createdAt: -1 });

		res.json({
			tickets: tickets.map(ticket => ({
				id: ticket._id,
				ticketCode: ticket.ticketCode,
				quantity: ticket.quantity,
				totalAmount: ticket.totalAmount,
				currency: ticket.currency,
				validated: ticket.validated,
				validatedAt: ticket.validatedAt,
				purchaseDate: ticket.createdAt,
				event: {
					id: ticket.eventId._id,
					name: ticket.eventId.name,
					date: ticket.eventId.date,
					location: ticket.eventId.location,
					img: ticket.eventId.img
				}
			}))
		});

	} catch (error) {
		console.error('Error fetching user tickets:', error);
		res.status(500).json({ 
			error: 'Error al obtener los tickets' 
		});
	}
};

/**
 * GET /api/tickets/event/:eventId/sales
 * Obtener estadísticas de ventas de un evento (solo admin)
 */
const getEventSales = async (req, res) => {
	try {
		const { eventId } = req.params;

		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({ error: 'Evento no encontrado' });
		}

		const tickets = await Ticket.find({ 
			eventId,
			status: 'completed'
		}).sort({ createdAt: -1 });

		const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);

		res.json({
			event: {
				id: event._id,
				name: event.name,
				date: event.date
			},
			sales: {
				totalTickets: event.totalTickets,
				ticketsSold: event.ticketsSold,
				availableTickets: event.availableTickets,
				totalRevenue: totalRevenue,
				currency: event.ticketCurrency
			},
			tickets: tickets.map(ticket => ({
				id: ticket._id,
				ticketCode: ticket.ticketCode,
				customerName: ticket.customerName,
				customerEmail: ticket.customerEmail,
				quantity: ticket.quantity,
				totalAmount: ticket.totalAmount,
				validated: ticket.validated,
				purchaseDate: ticket.createdAt
			}))
		});

	} catch (error) {
		console.error('Error fetching event sales:', error);
		res.status(500).json({ 
			error: 'Error al obtener estadísticas de ventas' 
		});
	}
};

module.exports = {
	createCheckoutSession,
	handleWebhook,
	verifyTicket,
	validateTicket,
	getMyTickets,
	getEventSales
};
