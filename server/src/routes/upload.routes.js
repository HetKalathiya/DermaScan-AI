const express = require('express');
const router = express.Router();
const { cloudinary, upload } = require('../config/cloudinary');

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Public (or protected if you add auth middleware)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const imageUrl = req.file.path;
    const imagePublicId = req.file.filename;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      data: {
        url: imageUrl,
        publicId: imagePublicId
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message });
  }
});

// @route   POST /api/upload/delete
// @desc    Delete an image from Cloudinary
// @access  Public (or protected)
router.post('/delete', async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'No publicId provided' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Failed to delete image from Cloudinary' });
    }
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, message: 'Server error during deletion', error: error.message });
  }
});

module.exports = router;
