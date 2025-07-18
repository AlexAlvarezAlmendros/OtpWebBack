const Event = require('../models/Event');
const mongoose = require('mongoose');
const { isUserAdmin } = require('../utils/authHelpers');

// GET all events
const getEvents = async (req, res) => {
    try {
        const events = await Event.find({}).sort({ date: -1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// GET a single event
const getEvent = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de evento no válido' });
    }
    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new event
const createEvent = async (req, res) => {
    try {
        // Obtener userId del token JWT
        const userId = req.user.sub;
        
        const eventData = {
            ...req.body,
            userId: userId // Asegurar que el userId viene del token
        };
        
        const event = await Event.create(eventData);
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// UPDATE a event
const updateEvent = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de evento no válido' });
    }
    
    try {
        const userId = req.user.sub;
        
        
        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(req.user)) {
            const existingEvent = await Event.findById(id);
            if (!existingEvent) {
                return res.status(404).json({ error: 'Evento no encontrado' });
            }
            if (existingEvent.userId !== userId) {
                return res.status(403).json({ error: 'No tienes permisos para modificar este evento' });
            }
        }
        
        const event = await Event.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE a event
const deleteEvent = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de evento no válido' });
    }
    
    try {
        const userId = req.user.sub;
        
        
        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(req.user)) {
            const existingEvent = await Event.findById(id);
            if (!existingEvent) {
                return res.status(404).json({ error: 'Evento no encontrado' });
            }
            if (existingEvent.userId !== userId) {
                return res.status(403).json({ error: 'No tienes permisos para eliminar este evento' });
            }
        }
        
        const event = await Event.findByIdAndDelete(id);
        if (!event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(200).json({ message: 'Evento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
};
