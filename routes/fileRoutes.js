const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/fileController');

// Rutas para subir archivos (con manejo de errores de multer)
router.post('/upload/audio', (req, res, next) => {
  uploadAudio.single('file')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    uploadAudioFile(req, res, next);
  });
});

router.post('/upload/archive', (req, res, next) => {
  uploadArchive.single('file')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    uploadArchiveFile(req, res, next);
  });
});

// Rutas CRUD
router.get('/', getAllFiles);
router.get('/:id', getFileById);
router.patch('/:id', updateFile);
router.delete('/:id', deleteFile);

// Ruta para obtener URL de descarga
router.get('/:id/download', getDownloadUrl);

module.exports = router;
