/* eslint-disable */

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const ObjectId = mongoose.Types.ObjectId;

const TranscriptionRequestSchema = new mongoose.Schema({
  mediaId: {
    type: ObjectId,
    required: true
  },
  asrId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "queue", "progress", "success", "error", "failure"],
    default: "pending"
  },
}, {
  versionKey: false,
  timestamps: true
});

TranscriptionRequestSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('transcriptionRequest', TranscriptionRequestSchema);
