import { Campaign, Ad } from '../models/Marketing.js';
import User from '../models/User.js';

// --- Campaign Management ---
export const createCampaign = async (req, res, next) => {
  try {
    const { type, title, content, targetGroups, recipients, scheduledAt } = req.body;
    
    let finalRecipients = recipients || [];
    
    // If target groups are specified, fetch their emails/phones
    if (targetGroups && targetGroups.length > 0) {
      const users = await User.find({ role: { $in: targetGroups } });
      const groupRecipients = type === 'email' 
        ? users.map(u => u.email).filter(e => e)
        : users.map(u => u.phone).filter(p => p);
      
      finalRecipients = [...new Set([...finalRecipients, ...groupRecipients])];
    }

    const campaign = await Campaign.create({
      type,
      title,
      content,
      targetGroups,
      recipients: finalRecipients,
      scheduledAt,
      stats: { total: finalRecipients.length },
      createdBy: req.user._id,
      status: 'queued'
    });

    res.status(201).json({
      success: true,
      campaign
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) { next(error); }
};

// --- Ads Management ---
export const manageAd = async (req, res, next) => {
  try {
    const { id, ...adData } = req.body;
    let ad;
    if (id) {
      ad = await Ad.findByIdAndUpdate(id, adData, { new: true });
    } else {
      ad = await Ad.create(adData);
    }
    res.json({ success: true, ad });
  } catch (error) { next(error); }
};

export const getAds = async (req, res, next) => {
  try {
    const ads = await Ad.find({ status: 'active' }).populate('institute', 'name');
    res.json({ success: true, ads });
  } catch (error) { next(error); }
};

// --- Tracking ---
export const trackAdView = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (ad) {
      ad.currentViews += 1;
      if (ad.viewCap > 0 && ad.currentViews >= ad.viewCap) {
        ad.status = 'expired';
      }
      await ad.save();
    }
    res.json({ success: true });
  } catch (error) { next(error); }
};
