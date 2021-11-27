const { BlobServiceClient } = require('@azure/storage-blob');

const defaultRecordingContainerName = 'recordings';
const defaultTranscriptContainerName = 'transcripts';

const connectionString = process.env.AZURE_BLOB_STORAGE_CONN_STRING;
const recordingContainerName = process.env.AZURE_BLOB_STORAGE_RECORDING_CONTAINER || defaultRecordingContainerName;
const transcriptContainerName = process.env.AZURE_BLOB_STORAGE_TRANSCRIPT_CONTAINER || defaultTranscriptContainerName;

// TODO Check if connection string is undefined
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

const initializeAzureStorage = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Containers that need to be available
            const requiredContainerNames = [
                recordingContainerName,
                transcriptContainerName
            ];
            // TODO(zerefwayne) Improve logging
            for (const containerName of requiredContainerNames) {
                const containerServiceClient = blobServiceClient.getContainerClient(containerName);
                const data = await containerServiceClient.createIfNotExists();
                await containerServiceClient.setAccessPolicy('blob');
                console.log(`*  Initialized Azure storage container: ${containerName}`);
            }
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    azureStorageClient: blobServiceClient,
    initAzure: initializeAzureStorage
};
