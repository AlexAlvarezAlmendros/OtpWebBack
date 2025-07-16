const Release = require('../models/Release');
const mongoose = require('mongoose');

// GET all releases
const getReleases = async (req, res) => {
    try {
        const releases = await Release.find({}).sort({ date: -1 });
        res.status(200).json(releases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET a single release
const getRelease = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de release no válido' });
    }
    try {
        const release = await Release.findById(id);
        if (!release) {
            return res.status(404).json({ error: 'Release no encontrado' });
        }
        res.status(200).json(release);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new release
const createRelease = async (req, res) => {
    try {
        const release = await Release.create(req.body);
        res.status(201).json(release);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// UPDATE a release
const updateRelease = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de release no válido' });
    }
    try {
        const release = await Release.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!release) {
            return res.status(404).json({ error: 'Release no encontrado' });
        }
        res.status(200).json(release);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE a release
const deleteRelease = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de release no válido' });
    }
    const release = await Release.findByIdAndDelete(id);
    if (!release) {
        return res.status(404).json({ error: 'Release no encontrado' });
    }
    res.status(200).json({ message: 'Release eliminado correctamente' });
};

module.exports = {
    getReleases,
    getRelease,
    createRelease,
    updateRelease,
    deleteRelease
};

