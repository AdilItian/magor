import { Request, Response } from "express";
import {
  uploadRecordingToAzure,
  uploadTranscriptToAzure,
} from "../../../services/storage-azure";
import {
  uploadRecordingLocal,
  uploadTranscriptLocal,
} from "../../../services/storage-local";
import Media from "../../models/media";
import Transcript from "../../models/transcript";
import { getVideoDurationInSeconds } from "get-video-duration";
import mime from "mime-types";
import Ffmpeg from "fluent-ffmpeg";
import fs from 'fs';
import {transcriptsPath} from '../../../services/storage-local/transcript';

const defaultImage = "public/images/default.png";

const genThumbnail = (path: any) => {
  return new Promise((resolve) => {
    try {
      const mimeLookupPath = mime.lookup(path);
      if (mimeLookupPath && mimeLookupPath.split("/")[0] === "video") {
        const out = path.match(/([^/.]*)\..*$/)[1];
        const outPath = `public/images/${out}.jpg`;
        Ffmpeg(path)
          .outputOptions(["-vframes 1", "-ss 10"])
          .output(outPath)
          .on("error", () => resolve(defaultImage))
          .on("end", () => resolve(outPath))
          .run();
      } else {
        resolve(defaultImage);
      }
    } catch (err) {
      console.error(err);
      resolve(defaultImage);
    }
  });
};

export const handleUploadRecording = async (req: Request, res: Response) => {
  try {
    const mediaID = req.query.id ? req.query.id.toString() : "";
    // upload recording to local
    const path = await uploadRecordingLocal(req, res);
    console.log("video uploaded to local");
    // update mongodb
    let media = await Media.findById(mediaID);
    console.log("media fetched", media);
    media["tempResourceUrl"] = path;
    media["tempUploadStatus"] = "success";
    
    media["duration"] = await getVideoDurationInSeconds(path);
    console.log("media sdfrwer");
    media["thumbnailPath"] = await genThumbnail(path);
    console.log("save media", media);
    console.log("Setting media duration", media["duration"]);
    await media.save();
    // upload to azure
    uploadRecordingToAzure(mediaID, path);
    // send status response
    res.status(200).send(media);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

export const handleUploadTranscript = async (req: Request, res: Response) => {
  try {
    const transcriptId = req.query.id ? req.query.id.toString() : "";
    // upload recording to local
    const path = await uploadTranscriptLocal(req, res);
    const transcript = await Transcript.findById(transcriptId);
    transcript["tempResourceUrl"] = path;
    transcript["tempUploadStatus"] = "success";
    await transcript.save();
    // upload to azure
    uploadTranscriptToAzure(transcriptId, path);
    res.status(200).send(transcript);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

export const handleUpdateTranscript = async (req: Request, res: Response) => {
  try {
    const {fileName, data} = req.body;
    fs.writeFile(`${transcriptsPath}/${fileName}`, data, err => {
      if (err) {
        console.error(err)
        return
      }
      //file written successfully
    })
    res.status(200).send("Transcript updated");
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};
