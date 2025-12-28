const multer = require('multer');

// Configurar multer para procesar imágenes en memoria
const storage = multer.memoryStorage();

const imageUploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 32 * 1024 * 1024 }, // 32MB límite de ImgBB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
    }
  }
});

module.exports = imageUploadMiddleware;
