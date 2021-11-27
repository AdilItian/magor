import _ from "lodash";
import { Request, Response } from "express";
import Transcript from "../../models/transcript";
import Media from "../../models/media";
import { addMediaToIndexQueue } from "../../../services/transcript-indexer";

const defaultKeys: {
  [key: string]: string;
} = {
  transcript: "_defaultTranscript",
  imageCaption: "_defaultImageCaption",
  soundCaption: "_defaultSoundCaption",
};

export const handleCreateTranscript = async (req: Request, res: Response) => {
  const { mediaId, language, format, transcriptType, ...other } = req.body;
  // TODO extract name
  const transcript = await new Transcript({
    mediaId,
    language,
    format,
    transcriptType,
    name: new Date().toUTCString(),
  }).save();
  // update media
  const media = await Media.findById(mediaId);
  media[`_${transcriptType}s`].push(transcript["_id"]);
  media[defaultKeys[transcriptType]] = transcript["_id"];
  await media.save();
  addMediaToIndexQueue(media["_id"]);
  console.log(media);
  res.send({ success: true, transcript });
};

export const handleDeleteTranscript = async (req: Request, res: Response) => {
  const { id } = req.query;
  try {
    const transcript = await Transcript.findById(id);

    const mediaId = transcript["mediaId"];
    const media = await Media.findById(mediaId);

    await Transcript.findByIdAndDelete(id);

    media[`_transcripts`].pull(id);
    await media.save();

    if (media[`_transcripts`].length === 0) {
      media[`_defaultTranscript`] = null;
    } else {
      if (media[`_defaultTranscript`] == id) {
        media[`_defaultTranscript`] = media["_transcripts"][0];
        addMediaToIndexQueue(media["_id"]);
      }
    }

    await media.save();
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, error });
  }
};

export const handleUpdateTranscriptById = async (
  req: Request,
  res: Response
) => {
  const { id } = req.query;
  const { name: newName } = req.body;
  try {
    const transcript = await Transcript.findById(id);
    transcript["name"] = newName;
    await transcript.save();
    console.log(transcript);
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, error });
  }
};
