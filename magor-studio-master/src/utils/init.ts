import { initializeMongoDB } from "../services/db-mongo";
import { initializeAzureStorage } from "../services/storage-azure";
import logger from "../config/logger";

export const initServices = () => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.info(`services.init.start`);
            await initializeMongoDB();
            await initializeAzureStorage();
            logger.info(`services.init.success`);
            resolve(true);
        } catch (err) {
            reject(err);
        }
    });
};
