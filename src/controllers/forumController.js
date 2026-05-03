import Question from '../models/Question.js';

// @desc    Ask a question
// @route   POST /api/v1/forum/questions
// @access  Private
export const askQuestion = async (req, res, next) => {
  try {
    const { title, content, isAnonymous } = req.body;
    const question = await Question.create({
      user: req.user._id,
      title,
      content,
      isAnonymous
    });

    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Answer a question
// @route   POST /api/v1/forum/questions/:id/answer
// @access  Private (Doctor)
export const answerQuestion = async (req, res, next) => {
  try {
    const { content } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    question.answers.push({
      doctor: req.user._id,
      content
    });

    await question.save();

    res.json({
      success: true,
      message: 'Answer posted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions
// @route   GET /api/v1/forum/questions
// @access  Public
export const getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find()
      .populate('user', 'name')
      .populate('answers.doctor', 'name doctorDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    next(error);
  }
};
