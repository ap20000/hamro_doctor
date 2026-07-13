import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserImage from '../models/UserImage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Helper to convert buffer/file to Base64 data URL if needed
const toBase64DataUrl = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

// @desc    Upload an image file and store it user-wise in DB
// @route   POST /api/v1/images/upload  (or POST /api/v1/images)
// @access  Private
export const uploadImage = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const uploadedDocuments = [];

    // 1. Check if files came through multer (req.file or req.files)
    const files = req.files || (req.file ? [req.file] : []);

    if (files.length > 0) {
      for (const file of files) {
        // Read file buffer from disk
        const buffer = fs.readFileSync(file.path);
        const base64String = toBase64DataUrl(buffer, file.mimetype);

        const imageDoc = await UserImage.create({
          user: userId,
          filename: file.originalname || file.filename,
          mimetype: file.mimetype,
          size: file.size || buffer.length,
          imageData: base64String,
          fileUrl: `/src/uploads/${file.filename}`,
        });

        uploadedDocuments.push(imageDoc);
      }
    } else if (req.body.image || req.body.file || req.body.imageData) {
      // 2. Fallback check if base64 string was sent directly in req.body
      const base64Input = req.body.image || req.body.file || req.body.imageData;
      
      let mimetype = 'image/jpeg';
      let base64Data = base64Input;

      if (base64Input.startsWith('data:')) {
        const parts = base64Input.split(';');
        mimetype = parts[0].split(':')[1] || 'image/jpeg';
        base64Data = parts[1].replace(/^base64,/, '');
      } else {
        base64Data = base64Input.replace(/^data:image\/\w+;base64,/, '');
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `image-${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, filename);

      // Save to disk for static serving if possible
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);

      const fullBase64String = base64Input.startsWith('data:')
        ? base64Input
        : `data:${mimetype};base64,${base64Data}`;

      const imageDoc = await UserImage.create({
        user: userId,
        filename,
        mimetype,
        size: buffer.length,
        imageData: fullBase64String,
        fileUrl: `/src/uploads/${filename}`,
      });

      uploadedDocuments.push(imageDoc);
    } else {
      res.status(400);
      throw new Error('No image file or image base64 data provided for upload');
    }

    // Format response
    const formattedImages = uploadedDocuments.map(img => ({
      ...img.toObject(),
      viewUrl: `/api/v1/images/${img._id}/view`,
      url: `/api/v1/images/${img._id}`,
    }));

    res.status(201).json({
      success: true,
      message: 'Image uploaded and stored in database user-wise successfully',
      count: formattedImages.length,
      image: formattedImages[0], // convenient single image field
      images: formattedImages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all uploaded images for current user
// @route   GET /api/v1/images
// @access  Private
export const getMyImages = async (req, res, next) => {
  try {
    const images = await UserImage.find({ user: req.user._id }).sort({ createdAt: -1 });

    const formattedImages = images.map(img => ({
      ...img.toObject(),
      viewUrl: `/api/v1/images/${img._id}/view`,
      url: `/api/v1/images/${img._id}`,
    }));

    res.status(200).json({
      success: true,
      count: formattedImages.length,
      images: formattedImages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific image document (with full imageData base64) by ID
// @route   GET /api/v1/images/:id
// @access  Private
export const getImageById = async (req, res, next) => {
  try {
    const image = await UserImage.findById(req.params.id);

    if (!image) {
      res.status(404);
      throw new Error('Image not found in database');
    }

    // Check user authorization (user-wise check)
    if (image.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this image');
    }

    res.status(200).json({
      success: true,
      image: {
        ...image.toObject(),
        viewUrl: `/api/v1/images/${image._id}/view`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Directly view/render the image stream stored in database
// @route   GET /api/v1/images/:id/view
// @access  Private (Supports token via Bearer header or ?token= query param)
export const viewImageFromDb = async (req, res, next) => {
  try {
    const image = await UserImage.findById(req.params.id);

    if (!image) {
      res.status(404);
      throw new Error('Image not found in database');
    }

    // Check user authorization (user-wise check)
    if (image.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this image');
    }

    // Extract Base64 part from stored imageData
    const base64Data = image.imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', image.mimetype || 'image/jpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=86400'); // Cache for 1 day in browser
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image from database and disk
// @route   DELETE /api/v1/images/:id
// @access  Private
export const deleteImage = async (req, res, next) => {
  try {
    const image = await UserImage.findById(req.params.id);

    if (!image) {
      res.status(404);
      throw new Error('Image not found in database');
    }

    if (image.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this image');
    }

    // Delete from DB
    await UserImage.findByIdAndDelete(req.params.id);

    // Optionally delete from disk if file exists locally
    if (image.fileUrl) {
      const localFilename = path.basename(image.fileUrl);
      const localFilePath = path.join(uploadsDir, localFilename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (err) {
          console.warn('Could not delete local file:', err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted from database successfully',
    });
  } catch (error) {
    next(error);
  }
};
