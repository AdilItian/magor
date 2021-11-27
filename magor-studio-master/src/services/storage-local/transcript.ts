import { Request, Response, RequestHandler, NextFunction } from 'express';
import multer, { StorageEngine, Multer, FileFilterCallback } from 'multer';
import path, { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const transcriptsPath = path.resolve(process.env.STORAGE_LOCAL_TRANSCRIPTS_PATH || "./public/transcripts");
const transcriptRequestKey = 'transcript';

/**============================================
 **    PRIVATE FUNCTIONS
 *=============================================**/

const filterTranscriptByMime = () => {
    //TODO(zerefwayne) Simplify logic by using mime package 
    return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!file.originalname.match(/\.(srt|vtt|stm|textgrid|xml|json)$/i)) {
            return cb(Error(`Error - Transcript Type not supported`),);
        }
        return cb(null, true);
    }
};

const getTranscriptFilename = (file: string) => {
    //TODO(zerefwayne) unit test
    return new Promise<string>((resolve, reject) => {
        //TODO(zerefwayne) Implement error handling 
        const filename = uuidv4();
        const extension = extname(file);
        const newTranscriptName = `${filename}${extension}`;
        resolve(newTranscriptName);
    });
};

const getTranscriptStorageObject = (path: string) => {
    return new Promise<StorageEngine>((resolve, reject) => {
        //TODO(zerefwayne) Implement error handling 
        const storageObject = multer.diskStorage({
            destination: path,
            filename: async (req, file, cb) => {
                const filename = await getTranscriptFilename(file.originalname);
                cb(null, filename);
            }
        });
        resolve(storageObject);
    });
};

const getTranscriptUploadFunction = (key: string) => {
    return new Promise<RequestHandler>(async (resolve, reject) => {
        const upload = multer({
            storage: await getTranscriptStorageObject(transcriptsPath),
            fileFilter: filterTranscriptByMime()
        }).single(key);
        resolve(upload);
    });
};

/**============================================
 **               PUBLIC FUNCTIONS
 *=============================================**/

export const uploadTranscriptLocal = (req: Request, res: Response) => {
    return new Promise<string>(async (resolve, reject) => {
        const upload = await getTranscriptUploadFunction(transcriptRequestKey);
        upload(req, res, (err: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(req.file.path);
            }
        });
    });
};
