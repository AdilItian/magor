import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';
import Queue from 'bull';
import Media from '../../app/models/media';
import Transcript from '../../app/models/transcript';
import logger from "../../config/logger";

const defaultRecordingContainerName = 'recordings';
const defaultTranscriptContainerName = 'transcripts';

// TODO Check if connection string is undefined
const connectionString = process.env.AZURE_BLOB_STORAGE_CONN_STRING || '';

const recordingContainerName = process.env.AZURE_BLOB_STORAGE_RECORDING_CONTAINER || defaultRecordingContainerName;
const transcriptContainerName = process.env.AZURE_BLOB_STORAGE_TRANSCRIPT_CONTAINER || defaultTranscriptContainerName;

const containerClients: { [key: string]: ContainerClient } = {};

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export const initializeAzureStorage = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Containers that need to be available
            const requiredContainerNames = [
                recordingContainerName,
                transcriptContainerName,
            ];
            for (const containerName of requiredContainerNames) {
                containerClients[containerName] = blobServiceClient.getContainerClient(containerName);
                let containerServiceClient = containerClients[containerName];
                const data = await containerServiceClient.createIfNotExists();
                await containerServiceClient.setAccessPolicy('blob');
                logger.info(`azure.container.init.${containerName}.success`)
            }
            logger.info(`azure.init.success`)
            resolve(true);
        } catch (error) {
            logger.error(`azure.container.init.error ${error}`)
            reject(error);
        }
    });
}

const uploadBlobToAzure = (containerName: string, name: string, path: string) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            const content = await fs.readFileSync(path);
            const blockBlobClient = containerClients[containerName].getBlockBlobClient(name);
            await blockBlobClient.upload(content, content.length);
            resolve(blockBlobClient.url);
        } catch (err) {
            reject(err);
        }
    });
}

/**============================================
 **         UPLOAD PROCESSING QUEUE
 *=============================================**/

//TODO(zerefwayne) Convert this into a class
// Queue declaration
const uploadQueue = new Queue('upload');

const CONCURRENT_UPLOAD_PROCESSES = 3;

// Queue processing function
uploadQueue.process(CONCURRENT_UPLOAD_PROCESSES, async (job, done) => {
    //TODO(zerefwayne) Modularize
    const filePathToBeUploaded = job.data.path;
    // File name
    const filename = path.basename(filePathToBeUploaded);

    const containerName = job.data.type === 'recording' ? recordingContainerName : transcriptContainerName

    try {
        const url = await uploadBlobToAzure(containerName, filename, filePathToBeUploaded);
        done(null, url);
    } catch (error) {
        done(error, null);
    }
});

uploadQueue.on('active', (job) => {
    console.log(`>  starting upload of ${job.data.path} to azure:${job.data.type}`);
});

uploadQueue.on('completed', async (job, result) => {
    if (!job.data.id) return;

    if (job.data.type === 'recording') {
        const media = await Media.findById(job.data.id);
        media["azureUploadStatus"] = "success";
        media["azureResourceUrl"] = result;
        await media.save();
        // console.log(media);
    }

    if (job.data.type === 'transcript') {
        const transcript = await Transcript.findById(job.data.id)
        transcript["azureUploadStatus"] = "success";
        transcript["azureResourceUrl"] = result;
        await transcript.save();
        // console.log(transcript);
    }

    console.log(`>  ${job.queue.name} | ${job.data.type} : job: ${job.data.id} completed.`);
});

uploadQueue.on('failed', (job, error) => {
    console.log(`>  ${job.queue.name}: job: ${job.data.id} failed.`);
    console.error(error);
});

uploadQueue.on('waiting', (jobId) => {
    console.log(`>  ${jobId} added to queue.`);
});

uploadQueue.on('removed', (job) => {
    // TODO update mongodb
    console.log(`>  ${job.data.id} removed from queue.`);
});

export const uploadRecordingToAzure = (id: string, path: string) => {
    // TODO Remove path as parameter and extract from database
    uploadQueue.add({
        type: 'recording',
        id,
        path,
    }, {
        attempts: 5,
        backoff: 10000,
    });
};

export const uploadTranscriptToAzure = (id: string, path: string) => {
    // TODO Remove path as parameter and extract from database
    uploadQueue.add({
        type: 'transcript',
        id,
        path,
    }, {
        attempts: 5,
        backoff: 10000,
    })
}
