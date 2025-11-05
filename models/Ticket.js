const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
	eventId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Event',
		required: true
	},
	purchaseId: {
		type: String,  // ID de la compra (Stripe Session ID)
		required: true,
		unique: true
	},
	customerEmail: {
		type: String,
		required: true
	},
	customerName: {
		type: String,
		required: true
	},
	quantity: {
		type: Number,
		required: true,
		min: 1
	},
	totalAmount: {
		type: Number,
		required: true
	},
	currency: {
		type: String,
		default: 'EUR'
	},
	status: {
		type: String,
		enum: ['pending', 'completed', 'cancelled', 'refunded'],
		default: 'pending'
	},
	ticketCode: {
		type: String,
		unique: true,
		required: true
	},
	qrCode: {
		type: String  // Base64 del QR
	},
	validated: {
		type: Boolean,
		default: false
	},
	validatedAt: {
		type: Date,
		default: null
	}
}, {
	timestamps: true
});

// Índices para optimizar búsquedas
ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ customerEmail: 1 });
ticketSchema.index({ ticketCode: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
