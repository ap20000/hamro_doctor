import Article from '../models/Article.js';
import jwt from 'jsonwebtoken';

// @desc    Create new article
// @route   POST /api/v1/articles
// @access  Private (Doctor)
export const createArticle = async (req, res, next) => {
  try {
    const { title, content, category, tags, featureImage } = req.body;
    let processedImage = featureImage;

    // Compress image if provided
    if (featureImage && featureImage.startsWith('data:image')) {
      try {
        const base64Data = featureImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const compressedBuffer = await sharp(buffer)
          .resize(1200, 675, { fit: 'cover' }) // 16:9 aspect ratio for articles
          .jpeg({ quality: 80 })
          .toBuffer();
        
        processedImage = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      } catch (sharpError) {
        console.error('Sharp processing error:', sharpError);
        // Fallback to original image if compression fails
      }
    }

    const article = await Article.create({
      title,
      content,
      category,
      tags,
      featureImage: processedImage,
      author: req.user._id,
      status: 'published' // Direct publishing enabled for now
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

// @desc    Get single article and increment views uniquely
// @route   GET /api/v1/articles/:id
// @access  Public
export const getArticle = async (req, res, next) => {
  try {
    let article = await Article.findById(req.params.id);

    if (!article) {
      res.status(404);
      throw new Error('Article not found');
    }

    let visitorKey = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Optional user authentication from authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          visitorKey = decoded.id.toString();
        }
      } catch (err) {
        // Fallback to IP address on token verify error
      }
    }

    // Ensure viewedBy is initialized
    if (!article.viewedBy) {
      article.viewedBy = [];
    }

    // If this visitor key hasn't viewed the article, add it and update views count
    if (!article.viewedBy.includes(visitorKey)) {
      article.viewedBy.push(visitorKey);
      article.views = article.viewedBy.length;
      await article.save();
    }

    // Populate author details
    await article.populate('author', 'name profile doctorDetails');

    res.json({
      success: true,
      article
    });
  } catch (error) {
    next(error);
  }
};
