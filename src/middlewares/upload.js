// import multer from 'multer';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import cloudinary from '../config/cloudinary.js';

// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'exlabour_uploads',
//         allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
//     }
// });

// const upload = multer({ storage });

// export default upload;

// import multer from 'multer';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import cloudinary from '../config/cloudinary.js';
// import path from 'path';

// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: async (req, file) => {
//         const ext = path.extname(file.originalname).toLowerCase();

//         const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);
//         const isDocument = ['.pdf', '.doc', '.docx'].includes(ext);

//         if (!isImage && !isDocument) {
//             throw new Error('Unsupported file format');
//         }

//         return {
//             folder: 'exlabour_uploads',
//             resource_type: isImage ? 'image' : 'raw',
//             public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
//         };
//     }
// });

// const fileFilter = (req, file, cb) => {
//     const allowedExtensions = /jpg|jpeg|png|pdf|doc|docx/;
//     const extname = allowedExtensions.test(
//         path.extname(file.originalname).toLowerCase()
//     );

//     if (extname) {
//         cb(null, true);
//     } else {
//         cb(new Error('Only jpg, jpeg, png, pdf, doc, and docx files are allowed'));
//     }
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
// });

// export default upload;



import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// --- FIX FOR "CloudinaryStorage is not a constructor" ---
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// -------------------------------------------------------

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'exlabour_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    }
});

const upload = multer({ storage: storage });

export default upload;