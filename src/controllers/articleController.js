import Article from '../models/Article.js';

// @desc    Create new article
// @route   POST /api/v1/articles
// @access  Private (Doctor)
export const createArticle = async (req, res, next) => {
  try {
    const article = await Article.create({
      ...req.body,
      author: req.user._id,
      status: 'pending' // Always pending until admin approves
    });

    res.status(201).json({
      success: true,
      article
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all published articles
// @route   GET /api/v1/articles
// @access  Public
export const getArticles = async (req, res, next) => {
  try {
    const articles = await Article.find({ status: 'published' })
      .populate('author', 'name profile doctorDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single article and increment views
// @route   GET /api/v1/articles/:id
// @access  Public
export const getArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name profile doctorDetails');

    if (!article) {
      res.status(404);
      throw new Error('Article not found');
    }

    res.json({
      success: true,
      article
    });
  } catch (error) {
    next(error);
  }
};
