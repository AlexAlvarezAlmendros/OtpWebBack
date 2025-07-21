const Artist = require('../models/Artist');
const mongoose = require('mongoose');
const { isUserAdmin } = require('../utils/authHelpers');
const { buildFilter, buildQueryOptions, validateFilters, FILTER_CONFIGS } = require('../utils/filterHelpers');

// GET all artists with filtering
const getArtists = async (req, res) => {
    try {
        // Validate filter parameters
        const validation = validateFilters(req.query);
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Invalid filter parameters', 
                details: validation.errors 
            });
        }

        // Build filter and options
        const filter = buildFilter(req.query, FILTER_CONFIGS.artists);
        const options = buildQueryOptions(req.query);

        // Artists don't have a 'date' field, so we'll sort by createdAt
        if (options.sort.date) {
            options.sort = { createdAt: options.sort.date };
        }

        // Execute query with filters
        const artists = await Artist.find(filter)
            .sort(options.sort)
            .limit(options.limit)
            .skip(options.skip);

        // Get total count for pagination info
        const totalCount = await Artist.countDocuments(filter);

        // Response with pagination metadata
        res.status(200).json({
            data: artists,
            pagination: {
                page: parseInt(req.query.page) || 1,
                count: options.limit,
                total: totalCount,
                pages: Math.ceil(totalCount / options.limit)
            },
            filters: filter
        });
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
        const user = req.auth || req.user;
        const userId = user.sub;
        
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
    console.log('PUT/PATCH /artists/:id - req.body:', JSON.stringify(req.body, null, 2));
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de artista no válido' });
    }
    
    try {
        const user = req.auth || req.user;
        const userId = user.sub;
        
        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(user)) {
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
        const user = req.auth || req.user;
        const userId = user.sub;
        
        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(user)) {
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
