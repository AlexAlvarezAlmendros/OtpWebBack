const Studio = require('../models/Studio');
const mongoose = require('mongoose');

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
		const studio = await Studio.create(req.body);
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
	const studio = await Studio.findByIdAndDelete(id);
	if (!studio) {
		return res.status(404).json({ error: 'Estudio no encontrado' });
	}
	res.status(200).json({ message: 'Estudio eliminado correctamente' });
};

module.exports = {
	getStudios,
	getStudio,
	createStudio,
	updateStudio,
	deleteStudio
};
