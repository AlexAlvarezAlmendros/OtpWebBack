const Beat = require('../models/Beat');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const mongoose = require('mongoose');
const { isUserAdmin } = require('../utils/authHelpers');
const { buildFilter, buildQueryOptions, validateFilters, FILTER_CONFIGS } = require('../utils/filterHelpers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connectDB = require('../utils/dbConnection');
const { uploadImageToImgBB } = require('../utils/imageUpload');

// Helper function to validate licenses
const validateLicenses = (licenses) => {
    const errors = [];
    
    licenses.forEach((license, index) => {
        // Validar que tenga nombre
        if (!license.name || license.name.trim() === '') {
            errors.push(`Licencia ${index + 1}: El nombre es requerido`);
        }
        
        // Validar que tenga precio válido
        if (typeof license.price !== 'number' || license.price < 0) {
            errors.push(`Licencia ${index + 1}: El precio debe ser un número positivo`);
        }
        
        // Validar que tenga al menos un formato
        if (!license.formats || license.formats.length === 0) {
            errors.push(`Licencia ${index + 1}: Debe tener al menos un formato (MP3, WAV, STEMS)`);
        }
        
        // Validar que los formatos sean válidos
        const validFormats = ['MP3', 'WAV', 'STEMS'];
        if (license.formats) {
            license.formats.forEach(format => {
                if (!validFormats.includes(format)) {
                    errors.push(`Licencia ${index + 1}: Formato inválido "${format}". Use: MP3, WAV, STEMS`);
                }
            });
        }
        
        // Validar que las URLs correspondan con los formatos seleccionados
        if (license.files && license.formats) {
            if (license.formats.includes('MP3') && !license.files.mp3Url) {
                errors.push(`Licencia ${index + 1}: Falta URL del archivo MP3`);
            }
            if (license.formats.includes('WAV') && !license.files.wavUrl) {
                errors.push(`Licencia ${index + 1}: Falta URL del archivo WAV`);
            }
            if (license.formats.includes('STEMS') && !license.files.stemsUrl) {
                errors.push(`Licencia ${index + 1}: Falta URL del archivo STEMS`);
            }
        }
    });
    
    return errors;
};

// GET all beats with filtering
const getBeats = async (req, res) => {
    try {
        // Ensure database connection
        await connectDB();
        
        // Validate filter parameters
        const validation = validateFilters(req.query);
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Invalid filter parameters', 
                details: validation.errors 
            });
        }

        // Build filter and options
        const filter = buildFilter(req.query, FILTER_CONFIGS.beats);
        
        // Add specific filtering for bpm range if provided
        if (req.query.bpmMin || req.query.bpmMax) {
            filter.bpm = {};
            if (req.query.bpmMin) filter.bpm.$gte = parseInt(req.query.bpmMin);
            if (req.query.bpmMax) filter.bpm.$lte = parseInt(req.query.bpmMax);
        }

        // Add specific filtering for price range if provided
        if (req.query.priceMin || req.query.priceMax) {
            filter.price = {};
            if (req.query.priceMin) filter.price.$gte = parseFloat(req.query.priceMin);
            if (req.query.priceMax) filter.price.$lte = parseFloat(req.query.priceMax);
        }

        // Search in tags
        if (req.query.tag) {
            filter.tags = { $in: [req.query.tag] };
        }

        const options = buildQueryOptions(req.query);

        // Execute query with filters
        const beats = await Beat.find(filter)
            .populate('producer', 'name artistType img') // Populate producer info from Artist
            .sort(options.sort)
            .limit(options.limit)
            .skip(options.skip);

        // Get total count for pagination info
        const totalCount = await Beat.countDocuments(filter);

        // Response with pagination metadata
        res.status(200).json({
            data: beats,
            pagination: {
                page: parseInt(req.query.page) || 1,
                count: options.limit,
                total: totalCount,
                pages: Math.ceil(totalCount / options.limit)
            },
            filters: filter
        });
    } catch (error) {
        console.error('Error getting beats:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET a single beat
const getBeat = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de beat no válido' });
    }
    try {
        const beat = await Beat.findById(id).populate('producer', 'name artistType img');
        if (!beat) {
            return res.status(404).json({ error: 'Beat no encontrado' });
        }
        res.status(200).json(beat);
    } catch (error) {
        console.error(`Error getting beat ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new beat
const createBeat = async (req, res) => {
    try {
        console.log('📝 POST /api/beats - Body:', JSON.stringify(req.body, null, 2));
        
        // El productor(es) vienen en el campo 'artists' del body
        // No usar el usuario autenticado como productor
        const beatData = { ...req.body };
        
        // Si se subió una imagen de portada, subirla a ImgBB
        if (req.file) {
            beatData.coverUrl = await uploadImageToImgBB(req.file.buffer, req.body.title);
        }
        
        // Si viene el campo 'artists', usar el primer artista como productor
        // (asumiendo que 'producer' debe ser un solo ID y 'artists' es un array)
        if (beatData.artists && Array.isArray(beatData.artists) && beatData.artists.length > 0) {
            beatData.producer = beatData.artists[0];
            console.log(`👤 Producer set from artists field: ${beatData.producer}`);
        }
        
        // Validar licenses si están presentes
        if (beatData.licenses && beatData.licenses.length > 0) {
            const validationErrors = validateLicenses(beatData.licenses);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    error: 'Validación de licencias fallida',
                    details: validationErrors
                });
            }
        }
        
        const beat = await Beat.create(beatData);
        console.log('✅ Beat created successfully:', beat._id);
        res.status(201).json(beat);
    } catch (error) {
        console.error('❌ Error creating beat:', error);
        res.status(400).json({ 
            error: error.message,
            details: error.errors // Mongoose validation errors details
        });
    }
};

// UPDATE a beat
const updateBeat = async (req, res) => {
    const { id } = req.params;
    console.log('PUT/PATCH /beats/:id - req.body:', JSON.stringify(req.body, null, 2));
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de beat no válido' });
    }
    
    try {
        const userAuth = req.auth || req.user;
        const auth0Id = userAuth.sub;
        
        let updateData = { ...req.body };
        
        // Si se subió una nueva imagen de portada, subirla a ImgBB
        if (req.file) {
            updateData.coverUrl = await uploadImageToImgBB(req.file.buffer, req.body.title);
        }

        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(userAuth)) {
            const existingBeat = await Beat.findById(id);
            if (!existingBeat) {
                return res.status(404).json({ error: 'Beat no encontrado' });
            }
            
            // Buscar usuario local para comparar
            const dbUser = await User.findOne({ auth0Id: auth0Id });
            if (!dbUser) {
                 return res.status(403).json({ error: 'Usuario no identificado' });
            }

            // Check against producer field
            if (existingBeat.producer.toString() !== dbUser._id.toString()) {
                return res.status(403).json({ error: 'No tienes permisos para modificar este beat' });
            }
        }
        
        // Validar licenses si están presentes en el update
        if (updateData.licenses && updateData.licenses.length > 0) {
            const validationErrors = validateLicenses(updateData.licenses);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    error: 'Validación de licencias fallida',
                    details: validationErrors
                });
            }
        }
        
        const beat = await Beat.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!beat) {
            return res.status(404).json({ error: 'Beat no encontrado' });
        }
        res.status(200).json(beat);
    } catch (error) {
        console.error(`Error updating beat ${id}:`, error);
        res.status(400).json({ error: error.message });
    }
};

// DELETE a beat
const deleteBeat = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'ID de beat no válido' });
    }
    
    try {
        const userAuth = req.auth || req.user;
        const auth0Id = userAuth.sub;

        // Si no es admin, verificar que sea el dueño del recurso
        if (!isUserAdmin(userAuth)) {
            const existingBeat = await Beat.findById(id);
            if (!existingBeat) {
                return res.status(404).json({ error: 'Beat no encontrado' });
            }
            
            // Buscar usuario local
            const dbUser = await User.findOne({ auth0Id: auth0Id });
            if (!dbUser) {
                 return res.status(403).json({ error: 'Usuario no identificado' });
            }

            if (existingBeat.producer.toString() !== dbUser._id.toString()) {
                return res.status(403).json({ error: 'No tienes permisos para eliminar este beat' });
            }
        }
        
        const beat = await Beat.findByIdAndDelete(id);
        if (!beat) {
            return res.status(404).json({ error: 'Beat no encontrado' });
        }
        res.status(200).json({ message: 'Beat eliminado correctamente' });
    } catch (error) {
        console.error(`Error deleting beat ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE Stripe Checkout Session for Beat Purchase
const createCheckoutSession = async (req, res) => {
    try {
        console.log('💳 CREATE CHECKOUT SESSION - Request body:', JSON.stringify(req.body, null, 2));
        
        const { beatId, licenseId, customerEmail, customerName } = req.body;
        
        console.log('💳 Extracted values:', { beatId, licenseId, customerEmail, customerName });
        
        // Validate required fields
        if (!beatId || !licenseId || !customerEmail || !customerName) {
            console.error('❌ Missing required fields:', {
                beatId: !!beatId,
                licenseId: !!licenseId,
                customerEmail: !!customerEmail,
                customerName: !!customerName
            });
            return res.status(400).json({ 
                error: 'Faltan datos requeridos: beatId, licenseId, customerEmail, customerName',
                received: { beatId, licenseId, customerEmail, customerName }
            });
        }
        
        // Validate beat ID
        if (!mongoose.Types.ObjectId.isValid(beatId)) {
            return res.status(404).json({ error: 'ID de beat no válido' });
        }
        
        // Find beat
        const beat = await Beat.findById(beatId);
        if (!beat) {
            return res.status(404).json({ error: 'Beat no encontrado' });
        }
        
        // Find license in beat
        const license = beat.licenses.find(l => l.id === licenseId);
        if (!license) {
            return res.status(404).json({ 
                error: 'Licencia no encontrada en este beat',
                availableLicenses: beat.licenses.map(l => ({ id: l.id, name: l.name }))
            });
        }
        
        // Validate Stripe configuration
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('❌ STRIPE_SECRET_KEY no configurada');
            return res.status(500).json({ error: 'Configuración de pagos incompleta' });
        }
        
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${beat.title} - ${license.name}`,
                        description: license.description || 'Beat License',
                        images: beat.coverUrl ? [beat.coverUrl] : []
                    },
                    unit_amount: Math.round(license.price * 100) // Convert to cents
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/beats?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/beats?canceled=true`,
            customer_email: customerEmail,
            metadata: {
                beatId: beatId,
                licenseId: licenseId,
                beatTitle: beat.title,
                licenseName: license.name,
                customerName: customerName,
                formats: JSON.stringify(license.formats)
                // Note: files and terms are retrieved from DB in webhook (URLs too long for metadata)
            }
        });
        
        console.log('✅ Stripe checkout session created:', session.id);
        
        res.status(200).json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('❌ Error creating checkout session:', error);
        res.status(500).json({ 
            error: 'Error al crear la sesión de pago',
            details: error.message 
        });
    }
};

// Handle Stripe Webhook for Beat Purchases
const handleBeatWebhook = async (req, res) => {
    console.log('🔔 Webhook received at /api/beats/webhook');
    
    // Ensure MongoDB connection before processing
    try {
        await connectDB();
    } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        return res.status(503).send('Database connection error');
    }
    
    console.log('📝 Body type:', typeof req.body);
    console.log('📝 Body is Buffer:', Buffer.isBuffer(req.body));
    console.log('📝 Headers:', req.headers);
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_BEATS;
    
    console.log('🔐 Webhook secret exists:', !!webhookSecret);
    console.log('🔐 Signature exists:', !!sig);
    
    if (!webhookSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET_BEATS not configured');
        return res.status(500).send('Webhook secret not configured');
    }
    
    if (!sig) {
        console.error('❌ No stripe-signature header found');
        return res.status(400).send('No signature header');
    }
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('🔔 Webhook event received:', event.type);
    
    // Only process checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
        console.log('ℹ️  Event type not handled, ignoring:', event.type);
        return res.json({ received: true });
    }
    
    // Process checkout.session.completed event
    const session = event.data.object;
    
    try {
        // Extract metadata
        const {
            beatId,
            licenseId,
            beatTitle,
            licenseName,
            customerName,
            formats
        } = session.metadata;
        
        const customerEmail = session.customer_email;
        const formatsArray = JSON.parse(formats);
        
        console.log('📦 Processing purchase:', {
            beatId,
            licenseId,
            customerEmail,
            amount: session.amount_total / 100
        });
        
        // Retrieve beat and license from database to get files and terms
        const beat = await Beat.findById(beatId);
        if (!beat) {
            throw new Error(`Beat ${beatId} not found`);
        }
        
        const license = beat.licenses.find(l => l.id === licenseId);
        if (!license) {
            throw new Error(`License ${licenseId} not found in beat ${beatId}`);
        }
        
        const files = license.files || {};
        const terms = license.terms || {};
        
        console.log('📂 Files and terms retrieved from database');
        
        // Save purchase to database
        await Purchase.create({
            beatId,
            licenseId,
            customerEmail,
            customerName,
            amount: session.amount_total / 100,
            stripeSessionId: session.id,
            status: 'completed',
            purchasedAt: new Date()
        });
        
        console.log('✅ Purchase saved to database');
        
        // Send email with beat files
        const EmailService = require('../services/emailService');
        const emailService = new EmailService();
        
        await emailService.sendBeatDeliveryEmail({
            to: customerEmail,
            customerName,
            beatTitle,
            licenseName,
            formats: formatsArray,
            files: files,
            licenseTerms: terms
        });
        
        console.log('✅ Beat delivery email sent to:', customerEmail);
        
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        // Still return 200 to acknowledge receipt to Stripe
        return res.status(200).json({ 
            received: true, 
            error: error.message 
        });
    }
    
    res.json({ received: true });
};

module.exports = {
    getBeats,
    getBeat,
    createBeat,
    updateBeat,
    deleteBeat,
    createCheckoutSession,
    handleBeatWebhook
};
