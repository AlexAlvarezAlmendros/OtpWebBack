const Studio = require('../models/Studio');
const mongoose = require('mongoose');
const { isUserAdmin } = require('../utils/authHelpers');

// GET all studios
const getStudios = async (req, res) => {
	try {
		const studios = await Studio.find({}).sort({ date: -1 });
		res.status(200).json(studios);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// GET a single studio
const getStudio = async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({ error: 'ID de estudio no válido' });
	}
	try {
		const studio = await Studio.findById(id);
		if (!studio) {
			return res.status(404).json({ error: 'Estudio no encontrado' });
		}
		res.status(200).json(studio);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// CREATE a new studio
const createStudio = async (req, res) => {
	try {
		// Obtener userId del token JWT
		const userId = req.user.sub;
		
		const studioData = {
			...req.body,
			userId: userId // Asegurar que el userId viene del token
		};
		
		const studio = await Studio.create(studioData);
		res.status(201).json(studio);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

// UPDATE a studio
const updateStudio = async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({ error: 'ID de estudio no válido' });
	}
	
	try {
		const userId = req.user.sub;
		
		
		// Si no es admin, verificar que sea el dueño del recurso
		if (!isUserAdmin(req.user)) {
			const existingStudio = await Studio.findById(id);
			if (!existingStudio) {
				return res.status(404).json({ error: 'Estudio no encontrado' });
			}
			if (existingStudio.userId !== userId) {
				return res.status(403).json({ error: 'No tienes permisos para modificar este estudio' });
			}
		}
		
		const studio = await Studio.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
		if (!studio) {
			return res.status(404).json({ error: 'Estudio no encontrado' });
		}
		res.status(200).json(studio);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

// DELETE a studio
const deleteStudio = async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({ error: 'ID de estudio no válido' });
	}
	
	try {
		const userId = req.user.sub;
		
		
		// Si no es admin, verificar que sea el dueño del recurso
		if (!isUserAdmin(req.user)) {
			const existingStudio = await Studio.findById(id);
			if (!existingStudio) {
				return res.status(404).json({ error: 'Estudio no encontrado' });
			}
			if (existingStudio.userId !== userId) {
				return res.status(403).json({ error: 'No tienes permisos para eliminar este estudio' });
			}
		}
		
		const studio = await Studio.findByIdAndDelete(id);
		if (!studio) {
			return res.status(404).json({ error: 'Estudio no encontrado' });
		}
		res.status(200).json({ message: 'Estudio eliminado correctamente' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	getStudios,
	getStudio,
	createStudio,
	updateStudio,
	deleteStudio
};
