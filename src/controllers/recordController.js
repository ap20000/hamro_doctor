import MedicalRecord from '../models/MedicalRecord.js';

// @desc    Add medical record
// @route   POST /api/v1/records
// @access  Private
export const addRecord = async (req, res, next) => {
  try {
    const { title, description, fileUrl, fileType, recordType } = req.body;

    const record = await MedicalRecord.create({
      user: req.user._id,
      title,
      description,
      fileUrl,
      fileType,
      recordType,
    });

    res.status(201).json({
      success: true,
      record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all records for current user
// @route   GET /api/v1/records
// @access  Private
export const getMyRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ user: req.user._id });
    res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Share record with doctor
// @route   POST /api/v1/records/:id/share
// @access  Private
export const shareRecord = async (req, res, next) => {
  try {
    const { doctorId, durationInHours } = req.body;
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      res.status(404);
      throw new Error('Record not found');
    }

    if (record.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to share this record');
    }

    const expireAt = new Date(Date.now() + durationInHours * 60 * 60 * 1000);

    record.sharedWith.push({
      doctor: doctorId,
      expireAt,
    });

    await record.save();

    res.json({
      success: true,
      message: `Record shared with doctor for ${durationInHours} hours`,
    });
  } catch (error) {
    next(error);
  }
};
