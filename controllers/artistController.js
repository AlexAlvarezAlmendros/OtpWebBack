const Artist = require('../models/Artist');
const mongoose = require('mongoose');
const { isUserAdmin } = require('../utils/authHelpers');

// GET all artists
const getArtists = async (req, res) => {
    try {
        const artists = await Artist.find({}).sort({ date: -1 });
        res.status(200).json(artists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET a single artist
const getArtist = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de artista no válido' });
    }
    try {
        const artist = await Artist.findById(id);
        if (!artist) {
            return res.status(404).json({ error: 'Artista no encontrado' });
        }
        res.status(200).json(artist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new artist
const createArtist = async (req, res) => {
    try {
        // Obtener userId del token JWT
        const userId = req.user.sub;
        
        const artistData = {
            ...req.body,
            userId: userId // Asegurar que el userId viene del token
        };
        
        const artist = await Artist.create(artistData);
        res.status(201).json(artist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// UPDATE a artist
const updateArtist = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de artista no válido' });
    }
    
    try {
        const userId = req.user.sub;
        
        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(req.user)) {
            const existingArtist = await Artist.findById(id);
            if (!existingArtist) {
                return res.status(404).json({ error: 'Artista no encontrado' });
            }
            if (existingArtist.userId !== userId) {
                return res.status(403).json({ error: 'No tienes permisos para modificar este artista' });
            }
        }
        
        const artist = await Artist.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!artist) {
            return res.status(404).json({ error: 'Artista no encontrado' });
        }
        res.status(200).json(artist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE a artist
const deleteArtist = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de artista no válido' });
    }
    
    try {
        const userId = req.user.sub;
        
        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(req.user)) {
            const existingArtist = await Artist.findById(id);
            if (!existingArtist) {
                return res.status(404).json({ error: 'Artista no encontrado' });
            }
            if (existingArtist.userId !== userId) {
                return res.status(403).json({ error: 'No tienes permisos para eliminar este artista' });
            }
        }
        
        const artist = await Artist.findByIdAndDelete(id);
        if (!artist) {
            return res.status(404).json({ error: 'Artista no encontrado' });
        }
        res.status(200).json({ message: 'Artista eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getArtists,
    getArtist,
    createArtist,
    updateArtist,
    deleteArtist
};
