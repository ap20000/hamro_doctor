import News from '../models/News.js';

// @desc    Create news
// @route   POST /api/v1/news
// @access  Private (Admin/Doctor)
export const createNews = async (req, res, next) => {
  try {
    const news = await News.create({
      ...req.body,
      author: req.user._id
    });

    res.status(201).json({
      success: true,
      news
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all published news
// @route   GET /api/v1/news
// @access  Public
export const getNews = async (req, res, next) => {
  try {
    const { category, pradesh, language, isFeatured } = req.query;
    const filter = { status: 'published' };

    if (category) filter.category = category;
    if (pradesh) filter.pradesh = pradesh;
    if (language) filter.language = language;
    if (isFeatured) filter.isFeatured = isFeatured === 'true';

    const news = await News.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: news.length,
      news
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to news
// @route   POST /api/v1/news/:id/comments
// @access  Public
export const addComment = async (req, res, next) => {
  try {
    const { text, name } = req.body;
    const news = await News.findById(req.params.id);

    if (!news) {
      res.status(404);
      throw new Error('News not found');
    }

    news.comments.push({
      user: req.user ? req.user._id : null,
      name: req.user ? req.user.name : name,
      text,
      isApproved: false // Moderation required
    });

    await news.save();

    res.json({
      success: true,
      message: 'Comment submitted for moderation'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate comment
// @route   PATCH /api/v1/news/:id/comments/:commentId
// @access  Private (Admin)
export const moderateComment = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const news = await News.findById(req.params.id);

    if (!news) {
      res.status(404);
      throw new Error('News not found');
    }

    const comment = news.comments.id(req.params.commentId);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    comment.isApproved = isApproved;
    await news.save();

    res.json({
      success: true,
      message: `Comment ${isApproved ? 'approved' : 'unapproved'}`
    });
  } catch (error) {
    next(error);
  }
};
