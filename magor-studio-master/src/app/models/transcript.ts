import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ObjectId = mongoose.SchemaTypes.ObjectId;

/*
  Required Fields:
    1. mediaId
    2. format
    3. transcriptType
*/
const TranscriptSchema = new mongoose.Schema({
  azureUploadStatus: {
    type: String,
    enum: ["pending", "queue", "progress", "success", "error", "failure"],
    default: "pending"
  },
  azureResourceUrl: {
    type: String,
    default: ""
  },
  azureUploadInfo: {
    type: String,
    default: ""
  },
  format: {
    required: true,
    type: String,
    enum: ['srt', 'json', 'xml', 'youtube.json', 'textgrid', 'stm'],
  },
  isAutoGenerated: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    enum: ['english', 'malay', 'mandarin', 'english-malay', 'english-mandarin'],
    default: "english"
  },
  mediaId: {
    required: true,
    type: ObjectId,
  },
  name: {
    type: String,
    default: ""
  },
  tempUploadStatus: {
    type: String,
    enum: ["pending", "progress", "success", "error"],
    default: "pending"
  },
  tempResourceUrl: {
    type: String,
    default: ""
  },
  transcriptType: {
    required: true,
    type: String,
    enum: ["transcript", "imageCaption", "soundCaption"]
  },
  uploaderId: {
    // TODO change to proper user ID
    type: String,
    default: "zerefwayne"
  },
}, {
  versionKey: false,
  timestamps: true,
});

TranscriptSchema.plugin(mongoosePaginate);

export default mongoose.model('transcript', TranscriptSchema);
