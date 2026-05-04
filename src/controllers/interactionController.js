import Comment from '../models/Comment.js';
import Article from '../models/Article.js';

// @desc    Add comment to article
// @route   POST /api/v1/articles/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { text, parentCommentId } = req.body;
    const articleId = req.params.id;

    const comment = await Comment.create({
      article: articleId,
      author: req.user._id,
      text,
      parentComment: parentCommentId || null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name profile doctorDetails');

    res.status(201).json({
      success: true,
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for an article
// @route   GET /api/v1/articles/:id/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ article: req.params.id })
      .populate('author', 'name profile doctorDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike an article
// @route   PATCH /api/v1/articles/:id/like
// @access  Private
export const toggleLikeArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404);
      throw new Error('Article not found');
    }

    const userId = req.user._id;
    const isLiked = article.likes.includes(userId);

    if (isLiked) {
      article.likes = article.likes.filter(id => id.toString() !== userId.toString());
    } else {
      article.likes.push(userId);
      // Remove from dislikes if present
      article.dislikes = article.dislikes.filter(id => id.toString() !== userId.toString());
    }

    await article.save();

    res.json({
      success: true,
      likes: article.likes,
      dislikes: article.dislikes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dislike/Undislike an article
// @route   PATCH /api/v1/articles/:id/dislike
// @access  Private
export const toggleDislikeArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404);
      throw new Error('Article not found');
    }

    const userId = req.user._id;
    const isDisliked = article.dislikes.includes(userId);

    if (isDisliked) {
      article.dislikes = article.dislikes.filter(id => id.toString() !== userId.toString());
    } else {
      article.dislikes.push(userId);
      // Remove from likes if present
      article.likes = article.likes.filter(id => id.toString() !== userId.toString());
    }

    await article.save();

    res.json({
      success: true,
      likes: article.likes,
      dislikes: article.dislikes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike a comment
// @route   PATCH /api/v1/comments/:id/like
// @access  Private
export const toggleLikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const userId = req.user._id;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
      comment.likes.push(userId);
      comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
    }

    await comment.save();

    res.json({
      success: true,
      likes: comment.likes,
      dislikes: comment.dislikes
    });
  } catch (error) {
    next(error);
  }
};
