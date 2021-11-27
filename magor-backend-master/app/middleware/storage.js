const fs = require('fs');
const azure = require('@azure/storage-blob');

const { azureStorageClient } = require('../../config/azure');

const defaultRecordingContainerName = 'recordings';
const defaultTranscriptContainerName = 'transcripts';

const recordingContainerName = process.env.AZURE_BLOB_STORAGE_RECORDING_CONTAINER || defaultRecordingContainerName;
const transcriptContainerName = process.env.AZURE_BLOB_STORAGE_TRANSCRIPT_CONTAINER || defaultTranscriptContainerName;

const recordingContainerClient = azureStorageClient.getContainerClient(recordingContainerName);
const transcriptContainerClient = azureStorageClient.getContainerClient(transcriptContainerName);

// Upload recording from local path
exports.uploadRecordingFromPath = (path, recordingName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const content = await fs.readFileSync(path);
            const blockBlobClient = recordingContainerClient.getBlockBlobClient(recordingName);
            await blockBlobClient.upload(content, content.length);
            resolve(blockBlobClient.url);
        } catch (error) {
            reject(error);
        }
    });
};
