import Story from '../models/Story.js';
import sharp from 'sharp';

// @desc    Get active stories (visible for 24 hours of upload)
// @route   GET /api/v1/stories
// @access  Public
export const getStories = async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({ createdAt: { $gte: cutoff } })
      .populate('author', 'name profile doctorDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stories.length,
      stories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create story
// @route   POST /api/v1/stories
// @access  Private (Doctor/Admin)
export const createStory = async (req, res, next) => {
  try {
    const { title, content, category, tags, image } = req.body;
    let processedImage = image;

    // Compress image if provided in base64 format
    if (image && image.startsWith('data:image')) {
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const compressedBuffer = await sharp(buffer)
          .resize(800, 1200, { fit: 'cover' }) // Portrait aspect ratio (standard for stories)
          .jpeg({ quality: 80 })
          .toBuffer();
        
        processedImage = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      } catch (sharpError) {
        console.error('Sharp processing error for story image:', sharpError);
      }
    }

    const story = await Story.create({
      title,
      content,
      category: category || 'Health Tips',
      tags: tags || [],
      image: processedImage,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      story,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current doctor's stories (active and archived)
// @route   GET /api/v1/stories/my-stories
// @access  Private (Doctor)
export const getMyStories = async (req, res, next) => {
  try {
    const stories = await Story.find({ author: req.user._id })
      .populate('author', 'name profile doctorDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stories.length,
      stories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete story
// @route   DELETE /api/v1/stories/:id
// @access  Private (Doctor/Admin)
export const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      res.status(404);
      throw new Error('Story not found');
    }

    // Allow deletion if admin or if the authenticated user is the author
    if (req.user.role !== 'admin' && story.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this story');
    }

    await Story.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendations
// @route   GET /api/v1/stories/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    // Simple logic: Get stories tagged with user's interests or just latest 5
    const stories = await Story.find().sort({ createdAt: -1 }).limit(5);
    res.json({
      success: true,
      recommendations: stories,
    });
  } catch (error) {
    next(error);
  }
};
