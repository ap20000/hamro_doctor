import User from '../models/User.js';
import SurgicalProduct from '../models/SurgicalProduct.js';
import SurgicalOrder from '../models/SurgicalOrder.js';

// @desc    Get surgical distributor dashboard stats
// @route   GET /api/v1/surgical/dashboard
// @access  Private (Surgical)
export const getSurgicalDashboard = async (req, res, next) => {
  try {
    const distributorId = req.user._id;

    const [
      productCount,
      ordersCount,
      distributor
    ] = await Promise.all([
      SurgicalProduct.countDocuments({ distributor: distributorId }),
      SurgicalOrder.countDocuments({ distributor: distributorId }),
      User.findById(distributorId).select('surgicalDetails')
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts: productCount,
        totalOrders: ordersCount,
        ...distributor.surgicalDetails.stats
      },
      subscription: {
        isSubscribed: distributor.surgicalDetails.isSubscribed,
        expiry: distributor.surgicalDetails.subscriptionExpiry
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage surgical products (Add/Update)
// @route   POST /api/v1/surgical/products
// @access  Private (Surgical)
export const manageProduct = async (req, res, next) => {
  try {
    const { id, ...productData } = req.body;
    let product;

    if (id) {
      product = await SurgicalProduct.findOneAndUpdate(
        { _id: id, distributor: req.user._id },
        productData,
        { new: true }
      );
    } else {
      product = await SurgicalProduct.create({
        ...productData,
        distributor: req.user._id
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for distributor
// @route   GET /api/v1/surgical/orders
// @access  Private (Surgical)
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await SurgicalOrder.find({ distributor: req.user._id })
      .populate('customer', 'name phone')
      .populate('products.product', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Boost surgical profile
// @route   POST /api/v1/surgical/boost
// @access  Private (Surgical)
export const boostSurgical = async (req, res, next) => {
  try {
    const distributor = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'surgicalDetails.isBoosted': true,
        'surgicalDetails.boostExpiry': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Surgical distributor profile boosted for 30 days',
      boostExpiry: distributor.surgicalDetails.boostExpiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Renew Subscription
// @route   POST /api/v1/surgical/subscribe
// @access  Private (Surgical)
export const subscribe = async (req, res, next) => {
  try {
    const distributor = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'surgicalDetails.isSubscribed': true,
        'surgicalDetails.subscriptionExpiry': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Subscription activated successfully for 1 year',
      subscriptionExpiry: distributor.surgicalDetails.subscriptionExpiry
    });
  } catch (error) {
    next(error);
  }
};
