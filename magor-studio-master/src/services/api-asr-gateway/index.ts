import _ from "lodash";
import axios from "axios";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";

const formData = require("form-data");

// CONSTANTS

const HOST_NAME =
  process.env.GATEWAY_HOSTNAME || "https://gateway.speechlab.sg";
const LOGIN_PATH = process.env.GATEWAY_LOGIN_PATH || "/auth/login";
const SPEECH_PATH = process.env.GATEWAY_SPEECH_PATH || "/speech";

const statusPath = (id: string) => `${HOST_NAME}${SPEECH_PATH}/${id}`;
const resultPath = (id: string) => `${HOST_NAME}${SPEECH_PATH}/${id}/result`;

const STORAGE_PUBLIC_PATH = path.resolve("public");
console.log(STORAGE_PUBLIC_PATH);
const BASE_ZIP_PATH = path.join(STORAGE_PUBLIC_PATH, "temp");
const BASE_TX_PATH = path.join(STORAGE_PUBLIC_PATH, "transcripts");

// PRIVATE FUNCTIONS

const login = async () => {
  try {
    const data = await axios.post(`${HOST_NAME}${LOGIN_PATH}`, {
      email: process.env.GATEWAY_EMAIL,
      password: process.env.GATEWAY_PASSWORD,
    });
    return data.data.accessToken;
  } catch (err) {
    throw err.response.statusText;
  }
};

const generateFormData = async (
  fileUrl: string,
  language: string,
  audioType: string,
  audioTrack: string
) => {
  const DEFAULT_AUDIO_TYPE = "closetalk";
  const DEFAULT_AUDIO_TRACK = "single";
  const WEBHOOK_URL = `${process.env.GATEWAY_WEBHOOK_URL}/recordings/status`;

  const form = new formData();

  form.append("file", fs.createReadStream(fileUrl), {
    knownLength: fs.statSync(fileUrl).size,
  });
  form.append("lang", language);
  form.append("audioType", audioType || DEFAULT_AUDIO_TYPE);
  form.append("audioTrack", audioTrack || DEFAULT_AUDIO_TRACK);
  form.append("webhook", WEBHOOK_URL);
  form.append("outputFormats[]", "xml");

  return form;
};

const upload = async (
  fileUrl: string,
  language: string,
  audioType: string,
  audioTrack: string,
  token: string
) => {
  try {
    const form = await generateFormData(
      fileUrl,
      language,
      audioType,
      audioTrack
    );
    const data = await axios.post(`${HOST_NAME}${SPEECH_PATH}`, form, {
      headers: {
        ...form.getHeaders(),
        "Content-Length": form.getLengthSync(),
        Authorization: `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return data.data._id;
  } catch (err) {
    if (err.response) {
      throw `ASR: ${err.response.data.error}`;
    } else if (err.request) {
      throw err.request;
    }
    throw err;
  }
};

const fetchTranscriptZip = (
  asrId: string,
  token: string,
  transcriptUrl: string = ""
) => {
  return new Promise<string>(async (resolve, reject) => {
    const fileName = `${BASE_ZIP_PATH}/t-${Number(new Date())}.zip`;
    const out = fs.createWriteStream(fileName);
    if (transcriptUrl === "") {
      try {
        const data = await axios.get(resultPath(asrId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        transcriptUrl = data.data.url;
      } catch (err) {
        reject(err);
      }
    }
    const zipStream = await axios.get(transcriptUrl, {
      responseType: "stream",
    });
    zipStream.data.pipe(out);
    out.once("finish", () => resolve(fileName));
    out.on("error", reject);
  });
};

const unzipAndMoveTranscriptFile = async (zipPath: string) => {
  let subtitlePath;
  try {
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Parse())
      .on("entry", (entry) => {
        if (entry.path.match(/\.xml$/i)) {
          subtitlePath = entry.path.match(/[^/.]+\.xml$/i)[0][1];
          subtitlePath = `${BASE_TX_PATH}/${subtitlePath}-${Number(
            new Date()
          )}.xml`;
          entry.pipe(fs.createWriteStream(subtitlePath));
        } else {
          entry.autodrain();
        }
      })
      .promise();
    return subtitlePath;
  } catch (err) {
    throw err;
  }
};

const deleteTranscriptZip = (zipPath: string) => {
  return new Promise(async (resolve, reject) => {
    fs.unlink(zipPath, (err) => {
      if (err) {
        reject(err);
      }
      resolve(true);
    });
  });
};

// PUBLIC FUNCTIONS

export const uploadFile = async (
  fileUrl: string,
  language: string,
  audioType: string,
  audioTrack: string
) => {
  try {
    const token = await login();
    const asrId = await upload(fileUrl, language, audioType, audioTrack, token);
    return asrId;
  } catch (err) {
    throw err;
  }
};

export const checkStatus = async (asrId: string) => {
  try {
    const token = await login();
    const data = await axios.get(statusPath(asrId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data.data;
  } catch (err) {
    throw err;
  }
};

export const retrieveTranscript = async (
  asrId: string,
  transcriptUrl?: string
) => {
  try {
    let zipPath: string;
    if (transcriptUrl) {
      zipPath = await fetchTranscriptZip(asrId, "", transcriptUrl);
    } else {
      const token = await login();
      zipPath = await fetchTranscriptZip(asrId, token);
    }
    const transcriptPath = await unzipAndMoveTranscriptFile(zipPath);
    await deleteTranscriptZip(zipPath);
    return transcriptPath;
  } catch (err) {
    throw err;
  }
};
