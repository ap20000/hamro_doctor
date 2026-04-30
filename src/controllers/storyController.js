import Story from '../models/Story.js';

// @desc    Get all stories
// @route   GET /api/v1/stories
// @access  Public
export const getStories = async (req, res, next) => {
  try {
    const stories = await Story.find().populate('author', 'name profile doctorDetails');
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
    const story = await Story.create({
      ...req.body,
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
