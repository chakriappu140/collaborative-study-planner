import express from 'express';
import { upload, uploadFile, getGroupFiles, deleteFile } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
    .post(protect, upload.single('document'), uploadFile)
    .get(protect, getGroupFiles);

router.route('/:fileId')
    .delete(protect, deleteFile);

export default router;
