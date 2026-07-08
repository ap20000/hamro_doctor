import mongoose from 'mongoose';

const chatbotSessionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['user', 'bot'],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        attachment: {
          type: String, // Store base64 encoded image
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ChatbotSession = mongoose.model('ChatbotSession', chatbotSessionSchema);

export default ChatbotSession;
