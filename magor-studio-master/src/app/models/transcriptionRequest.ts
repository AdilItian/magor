import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Types.ObjectId;

const TranscriptionRequestSchema = new mongoose.Schema(
  {
    mediaId: {
      type: ObjectId,
      required: true,
    },
    asrId: {
      type: String,
    },
    audioType: {
      type: String,
      required: true,
      enum: ["closetalk", "telephony"],
    },
    audioTrack: {
      type: String,
      required: true,
      enum: ["single", "multi"],
    },
    language: {
      type: String,
      required: true,
      enum: [
        "english",
        "mandarin",
        "malay",
        "english-mandarin",
        "english-malay",
      ],
    },
    status: {
      type: String,
      enum: ["pending", "queue", "progress", "success", "error", "failure"],
      default: "pending",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

TranscriptionRequestSchema.plugin(mongoosePaginate);

export default mongoose.model(
  "transcriptionRequest",
  TranscriptionRequestSchema
);
