const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
	// Usaremos el _id de MongoDB en lugar de un id UUID por simplicidad MERN.
	// Si necesitas el UUID, podemos usar una librería como 'uuid'.
	name: { type: String, required: true },
	location: { type: String, required: true },
	colaborators: { type: String, required: false },
	youtubeLink: { type: String, required: false },
	instagramLink: { type: String, required: false },
	img: { type: String, required: true },
	detailpageUrl: { type: String, required: false },
	eventType: { 
		type: String, 
		required: true,
		enum: ['Concert', 'Festival', 'Showcase', 'Party'] // Puedes definir los tipos permitidos
	},
	date: { type: Date, required: true },
	userId: { type: String, required: true } // Podría ser un ObjectId si tienes una colección de Users
}, {
	timestamps: true // Esto añade createdAt y updatedAt automáticamente
});

// Nota sobre el campo 'id':
// Mongoose por defecto crea un campo virtual 'id' que es una representación en string del '_id' de MongoDB.
// Así que no necesitamos definirlo explícitamente en el schema.

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

