import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Types.ObjectId;

const IcRequestSchema = new mongoose.Schema(
  {
    mediaId: {
      type: ObjectId,
      required: true,
    },
    icrId: {
      type: String,
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

IcRequestSchema.plugin(mongoosePaginate);

export default mongoose.model(
  "icRequest",
  IcRequestSchema
);
