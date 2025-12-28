const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const File = require('../models/File');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento de Cloudinary para archivos de audio
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'audio_files',
    resource_type: 'video' // Cloudinary usa 'video' para archivos de audio
    // Removemos allowed_formats y transformation para evitar problemas con archivos grandes
  }
});

// Configurar almacenamiento de Cloudinary para archivos comprimidos
const archiveStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'archive_files',
    resource_type: 'raw' // Para archivos que no son imágenes/videos
    // No especificamos allowed_formats para archivos raw, dejamos que multer valide
  }
});

// Middleware de multer para audio
const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB límite para audio (Cloudinary permite más para resource_type: video)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan .mp3, .wav, .ogg, .flac'), false);
    }
  }
});

// Middleware de multer para archivos comprimidos
const uploadArchive = multer({
  storage: archiveStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite para raw files (plan gratuito de Cloudinary)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/zip', 
      'application/x-zip-compressed', 
      'application/x-rar-compressed', 
      'application/x-rar',
      'application/octet-stream', // Algunos navegadores usan este tipo genérico
      'application/x-7z-compressed'
    ];
    const allowedExtensions = ['.zip', '.rar', '.7z'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    // Aceptar si tiene el tipo MIME correcto O la extensión correcta
    if (allowedTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan .zip, .rar, .7z'), false);
    }
  }
});

// Controlador para subir archivo de audio
const uploadAudioFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se proporcionó ningún archivo' 
      });
    }

    // Crear registro en la base de datos
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: 'audio',
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryId: req.file.filename,
      cloudinaryUrl: req.file.path,
      secureUrl: req.file.path,
      resourceType: 'video',
      format: req.file.format || req.file.originalname.split('.').pop(),
      duration: req.body.duration || null,
      uploadedBy: req.body.uploadedBy || null,
      description: req.body.description || '',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      isPublic: req.body.isPublic === 'true'
    };

    const newFile = await File.create(fileData);

    res.status(201).json({
      success: true,
      message: 'Archivo de audio subido exitosamente',
      data: newFile
    });

  } catch (error) {
    console.error('Error al subir archivo de audio:', error);
    
    // Si hubo error, intentar eliminar el archivo de Cloudinary
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' });
      } catch (cleanupError) {
        console.error('Error al limpiar archivo de Cloudinary:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al subir el archivo de audio',
      error: error.message
    });
  }
};

// Controlador para subir archivo comprimido
const uploadArchiveFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se proporcionó ningún archivo' 
      });
    }

    // Crear registro en la base de datos
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: 'archive',
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryId: req.file.filename,
      cloudinaryUrl: req.file.path,
      secureUrl: req.file.path,
      resourceType: 'raw',
      format: req.file.format || req.file.originalname.split('.').pop(),
      uploadedBy: req.body.uploadedBy || null,
      description: req.body.description || '',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      isPublic: req.body.isPublic === 'true'
    };

    const newFile = await File.create(fileData);

    res.status(201).json({
      success: true,
      message: 'Archivo comprimido subido exitosamente',
      data: newFile
    });

  } catch (error) {
    console.error('Error al subir archivo comprimido:', error);
    
    // Si hubo error, intentar eliminar el archivo de Cloudinary
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
      } catch (cleanupError) {
        console.error('Error al limpiar archivo de Cloudinary:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al subir el archivo comprimido',
      error: error.message
    });
  }
};

// Obtener todos los archivos (con paginación y filtros)
const getAllFiles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      fileType, 
      uploadedBy, 
      isPublic,
      search 
    } = req.query;

    const query = {};
    
    if (fileType) query.fileType = fileType;
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await File.countDocuments(query);

    res.status(200).json({
      success: true,
      data: files,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalFiles: count
    });

  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los archivos',
      error: error.message
    });
  }
};

// Obtener un archivo por ID
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: file
    });

  } catch (error) {
    console.error('Error al obtener archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el archivo',
      error: error.message
    });
  }
};

// Actualizar información del archivo
const updateFile = async (req, res) => {
  try {
    const { description, tags, isPublic } = req.body;

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const file = await File.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Archivo actualizado exitosamente',
      data: file
    });

  } catch (error) {
    console.error('Error al actualizar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el archivo',
      error: error.message
    });
  }
};

// Eliminar archivo
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(file.cloudinaryId, { 
      resource_type: file.resourceType 
    });

    // Eliminar de la base de datos
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el archivo',
      error: error.message
    });
  }
};

// Descargar/obtener URL de descarga del archivo
const getDownloadUrl = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Generar URL de descarga temporal (válida por 1 hora)
    const downloadUrl = cloudinary.url(file.cloudinaryId, {
      resource_type: file.resourceType,
      flags: 'attachment',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hora
    });

    res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        filename: file.originalName,
        expiresIn: '1 hora'
      }
    });

  } catch (error) {
    console.error('Error al generar URL de descarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar URL de descarga',
      error: error.message
    });
  }
};

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const fileType = req.path.includes('audio') ? 'audio' : 'archivo comprimido';
      const limit = req.path.includes('audio') ? '100MB' : '10MB';
      return res.status(400).json({
        success: false,
        message: `El ${fileType} excede el límite de ${limit}`,
        error: 'LIMIT_FILE_SIZE'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
      error: error.code
    });
  }
  
  // Si es un error de Cloudinary relacionado con el tamaño
  if (error.message && error.message.includes('File size too large')) {
    return res.status(400).json({
      success: false,
      message: 'El archivo excede el límite permitido por Cloudinary. Para archivos comprimidos el límite es 10MB en el plan gratuito.',
      error: 'CLOUDINARY_SIZE_LIMIT'
    });
  }
  
  next(error);
};

module.exports = {
  uploadAudio,
  uploadArchive,
  uploadAudioFile,
  uploadArchiveFile,
  getAllFiles,
  getFileById,
  updateFile,
  deleteFile,
  getDownloadUrl,
  handleMulterError
};
