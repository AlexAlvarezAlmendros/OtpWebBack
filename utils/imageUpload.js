const axios = require('axios');
const FormData = require('form-data');

/**
 * Sube una imagen a ImgBB
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {string} imageName - Nombre opcional para la imagen
 * @returns {Promise<string>} URL de la imagen subida
 */
const uploadImageToImgBB = async (imageBuffer, imageName = '') => {
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
    
    if (!IMGBB_API_KEY) {
        throw new Error('API Key de ImgBB no configurada en las variables de entorno');
    }

    try {
        const base64Image = imageBuffer.toString('base64');
        const formData = new FormData();
        formData.append('image', base64Image);
        
        if (imageName) {
            formData.append('name', imageName);
        }

        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            formData,
            {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        if (response.data.success) {
            return response.data.data.url;
        } else {
            throw new Error('ImgBB no retornó éxito en la respuesta');
        }
    } catch (error) {
        console.error('Error al subir imagen a ImgBB:', error.message);
        throw new Error(`Error al subir imagen a ImgBB: ${error.message}`);
    }
};

module.exports = {
    uploadImageToImgBB
};
