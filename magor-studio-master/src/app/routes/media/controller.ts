import { Request, Response } from "express";
import _ from "lodash";
import Media from "../../models/media";
import Transcript from "../../models/transcript";
import TranscriptionRequest from "../../models/transcriptionRequest";
import { uploadFile } from "../../../services/api-asr-gateway";
import { addMediaToIndexQueue } from "../../../services/transcript-indexer";

export const handleAutoTranscibe = async (req: Request, res: Response) => {
  const {
    language = "english",
    audioType = "closetalk",
    audioTrack = "single",
  } = req.body;

  const { id } = req.query;

  try {
    const media = await Media.findById(id);
    const fileUrl = media["tempResourceUrl"];

    const transRequest = new TranscriptionRequest({
      mediaId: id,
      audioType,
      audioTrack,
      language,
    });

    await transRequest.save();

    const asrId = await uploadFile(fileUrl, language, audioType, audioTrack);

    transRequest["asrId"] = asrId;
    await transRequest.save();

    return res.status(200).json({
      success: true,
      transRequest,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error,
    });
  }
};

export const handleFindMediaById = async (req: Request, res: Response) => {
  const requestedMediaId = req.query.id;
  const media = await Media.findById(requestedMediaId)
    .populate("_transcripts")
    .populate("_imageCaptions")
    .populate("_soundCaptions");
  const payload = {
    media,
  };
  res.status(200).json(payload);
  return;
};

export const handleCreateMedia = async (req: Request, res: Response) => {
  const title = req.body.title;
  //@ts-ignore
  const { _id: uploaderId } = req.user;
  if (_.isUndefined(uploaderId) || _.isEmpty(uploaderId)) {
    return res.status(401).json({ success: false, error: "invalid user" });
  }
  const media = await new Media({ title, uploaderId }).save();
  res.send({ success: true, media });
  return;
};

export const handleDeleteMediaById = async (req: Request, res: Response) => {
  const id = req.query.id;
  try {
    const result = await Media.deleteOne({ _id: id });
    console.log(result);
    res
      .status(200)
      .json({ success: true, message: `Deleted ${id} successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, error });
    console.log(error);
  }
};

export const handleUpdateMediaById = async (req: Request, res: Response) => {
  try {
    const mediaId = req.query.id?.toString() || "";
    const media = await Media.findById(mediaId);
    const updates = req.body.updates;
    let reIndex = false;
    if (updates["tags"]) {
      updates["tags"] = updates["tags"].map((tag: string) => ({
        tagName: tag,
      }));
    }
    Object.keys(updates).forEach((key: string) => {
      media[key] = updates[key];
      // if default transcript, image caption or sound caption are updated
      // re index the media
      reIndex = key.search("_default") !== -1;
    });
    await media.save();
    reIndex && addMediaToIndexQueue(mediaId);
    res.status(200).json({ success: true, media });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error });
    console.log(error);
  }
};
