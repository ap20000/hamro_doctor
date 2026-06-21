import User from '../models/User.js';
import Article from '../models/Article.js';
import Comment from '../models/Comment.js';

// @desc    Get all users with filters
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { role, isApproved, isVerified } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isApproved !== undefined) {
      if (role === 'doctor') query['doctorDetails.isApproved'] = isApproved === 'true';
      if (role === 'hospital') query['hospitalDetails.listingRequestStatus'] = isApproved === 'true' ? 'approved' : { $ne: 'approved' };
    }
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const users = await User.find(query).sort('-createdAt');
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject doctor or hospital
// @route   PUT /api/v1/admin/approve/:id
// @access  Private/Admin
export const approveUser = async (req, res, next) => {
  try {
    const { status, type } = req.body; // status: true/false for doctor, 'approved'/'rejected' for hospital
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'doctor') {
      user.doctorDetails.isApproved = status;
    } else if (user.role === 'hospital') {
      user.hospitalDetails.listingRequestStatus = status ? 'approved' : 'rejected';
    }

    await user.save();

    res.json({
      success: true,
      message: `${user.role} ${status ? 'approved' : 'rejected'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user by Admin
// @route   POST /api/v1/admin/onboard
// @access  Private/Admin
export const onboardUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      isVerified: true, // Admin created users are verified by default
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all articles with search (by title or doctor name)
// @route   GET /api/v1/admin/articles
// @access  Private/Admin
export const getAdminArticles = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      // Find doctors whose name matches the search term
      const matchingDoctors = await User.find({
        role: 'doctor',
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const authorIds = matchingDoctors.map(doc => doc._id);

      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $in: authorIds } }
        ]
      };
    }

    const articles = await Article.find(query)
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

// @desc    Delete article and associated comments by Admin
// @route   DELETE /api/v1/admin/articles/:id
// @access  Private/Admin
export const deleteAdminArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      res.status(404);
      throw new Error('Article not found');
    }

    // Delete associated comments
    await Comment.deleteMany({ article: req.params.id });

    // Delete the article
    await Article.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Article and associated comments deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
