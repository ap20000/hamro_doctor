import { Blog, Event, Video } from '../models/Content.js';
import { Page, Testimonial } from '../models/Metadata.js';

// --- Blog Management ---
export const manageBlog = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let blog;
    if (id) {
      blog = await Blog.findByIdAndUpdate(id, data, { new: true });
    } else {
      blog = await Blog.create({ ...data, author: req.user._id });
    }
    res.json({ success: true, blog });
  } catch (error) { next(error); }
};

// --- Event Management ---
export const manageEvent = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let event;
    if (id) {
      event = await Event.findByIdAndUpdate(id, data, { new: true });
    } else {
      event = await Event.create(data);
    }
    res.json({ success: true, event });
  } catch (error) { next(error); }
};

// --- Video Management ---
export const manageVideo = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let video;
    if (id) {
      video = await Video.findByIdAndUpdate(id, data, { new: true });
    } else {
      video = await Video.create(data);
    }
    res.json({ success: true, video });
  } catch (error) { next(error); }
};

// --- Page Management ---
export const managePage = async (req, res, next) => {
  try {
    const { slug, ...data } = req.body;
    const page = await Page.findOneAndUpdate({ slug }, data, { upsert: true, new: true });
    res.json({ success: true, page });
  } catch (error) { next(error); }
};
