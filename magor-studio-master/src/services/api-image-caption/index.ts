import path from "path";
import fs from "fs";
import axios from "axios";
import unzipper from "unzipper";

const formData = require("form-data");

// CONSTANTS

const HOST_NAME = process.env.IC_HOSTNAME || "http://localhost:3004";

const defaultCaptionFormat = "xml";

const submitPath = () => `${HOST_NAME}/caption/final/${defaultCaptionFormat}`;
const statusPath = (id: string) =>
  `${HOST_NAME}/getJobStatus/${defaultCaptionFormat}/${id}`;
const resultPath = (id: string) =>
  `${HOST_NAME}/returnFile/${defaultCaptionFormat}/${id}`;

const STORAGE_PUBLIC_PATH = path.resolve("public");
// const BASE_ZIP_PATH = path.join(STORAGE_PUBLIC_PATH, "temp");
const BASE_IC_PATH = path.join(STORAGE_PUBLIC_PATH, "image-captions");

// PRIVATE FUNCTIONS

const generateFormData = async (fileUrl: string) => {
  const form = new formData();
  form.append("file", fs.createReadStream(fileUrl), {
    knownLength: fs.statSync(fileUrl).size,
  });
  return form;
};

const upload = async (fileUrl: string) => {
  try {
    const form = await generateFormData(fileUrl);
    const { data } = await axios.post(submitPath(), form, {
      headers: {
        ...form.getHeaders(),
        "Content-Length": form.getLengthSync(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    console.log("IC SUBMIT JOB RESULT", data);
    return data.file_id;
  } catch (err) {
    if (err.response) {
      throw `ASR: ${err.response.data.error}`;
    } else if (err.request) {
      throw err.request;
    }
    throw err;
  }
};

const fetchIc = (icrId: string) => {
  return new Promise<string>(async (resolve, reject) => {
    const fileName = `${BASE_IC_PATH}/ic-${Number(
      new Date()
    )}.${defaultCaptionFormat}`;
    const out = fs.createWriteStream(fileName);
    const fileStream = await axios.get(resultPath(icrId), {
      responseType: "stream",
    });
    fileStream.data.pipe(out);
    out.once("finish", () => resolve(fileName));
    out.on("error", reject);
  });
};

// const unzipAndMoveIcFile = async (zipPath: string) => {
//   let subtitlePath;
//   try {
//     await fs
//       .createReadStream(zipPath)
//       .pipe(unzipper.Parse())
//       .on("entry", (entry) => {
//         if (entry.path.match(/\.xml$/i)) {
//           subtitlePath = entry.path.match(/[^/.]+\.xml$/i)[0][1];
//           subtitlePath = `${BASE_IC_PATH}/${subtitlePath}-${Number(
//             new Date()
//           )}.xml`;
//           entry.pipe(fs.createWriteStream(subtitlePath));
//         } else {
//           entry.autodrain();
//         }
//       })
//       .promise();
//     return subtitlePath;
//   } catch (err) {
//     throw err;
//   }
// };

// const deleteIcZip = (zipPath: string) => {
//   return new Promise(async (resolve, reject) => {
//     fs.unlink(zipPath, (err) => {
//       if (err) {
//         reject(err);
//       }
//       resolve(true);
//     });
//   });
// };

/////// PUBLIC FUNCTIONS

export const uploadFile = async (fileUrl: string) => {
  try {
    const icrId = await upload(fileUrl);
    return icrId;
  } catch (err) {
    throw err;
  }
};

export const checkStatus = async (icrId: string) => {
  try {
    const { data } = await axios.get(statusPath(icrId));
    return data;
  } catch (err) {
    throw err;
  }
};

export const retrieveIc = async (icrId: string) => {
  try {
    let icPath: string = await fetchIc(icrId);
    return icPath;
  } catch (err) {
    throw err;
  }
};
