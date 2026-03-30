import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'exlabour_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    }
});

const upload = multer({ storage: storage });

export default upload;