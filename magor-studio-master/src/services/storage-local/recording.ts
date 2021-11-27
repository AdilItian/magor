import { Request, Response, RequestHandler} from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path, { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// TODO(zerefwayne) Replace paths with environment variables
const recordingsPath = path.resolve(process.env.STORAGE_LOCAL_RECORDINGS_PATH || "./public/recordings");
const recordingRequestKey = 'recording';
const recordingMimes = ['audio', 'video'];

/**============================================
 **    PRIVATE FUNCTIONS
 *=============================================**/

const filterRecordingByMime = (types: string[]) => {
  //TODO(zerefwayne) Simplify logic by using mime package 
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (types.indexOf(file.mimetype.split('/')[0]) === -1) {
      return cb(Error(`Error - Only ${types.join(',')} files supported. Received ${file.mimetype}`));
    }
    return cb(null, true);
  }
};

const getRecordingFilename = (file: string) => {
  //TODO(zerefwayne) unit test
  return new Promise<string>((resolve, reject) => {
    //TODO(zerefwayne) Implement error handling 
    const filename = uuidv4();
    const extension = extname(file);
    const newRecordingName = `${filename}${extension}`;
    resolve(newRecordingName);
  });
};

const getRecordingStorageObject = (path: string) => {
  return new Promise<StorageEngine>((resolve, reject) => {
    //TODO(zerefwayne) Implement error handling 
    const storageObject = multer.diskStorage({
      destination: path,
      filename: async (req, file, cb) => {
        const filename = await getRecordingFilename(file.originalname);
        cb(null, filename);
      }
    });
    resolve(storageObject);
  });
};

const getRecordingUploadFunction = (key: string) => {
  return new Promise<RequestHandler>(async (resolve, reject) => {
    const upload = multer({
      storage: await getRecordingStorageObject(recordingsPath),
      fileFilter: filterRecordingByMime(recordingMimes)
    }).single(key);
    resolve(upload);
  });
};

/**============================================
 **               PUBLIC FUNCTIONS
 *=============================================**/

export const uploadRecordingLocal = (req: Request, res: Response) => {
  return new Promise<string>(async (resolve, reject) => {
    const upload = await getRecordingUploadFunction(recordingRequestKey);
    upload(req, res, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(req.file.path);
      }
    });
  });
};
