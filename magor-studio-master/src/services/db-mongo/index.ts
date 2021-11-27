import mongoose from 'mongoose';
import logger from '../../config/logger';

const DEFAULT_MONGO_URI = "mongodb://localhost:27017/magor";
const mongoURI = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

export const initializeMongoDB = () => {
    return new Promise((resolve, reject) => {
        logger.info(`mongodb.init.start ${mongoURI}`)
        mongoose.Promise = global.Promise;
        mongoose.connection.on('error', console.log);
        // TODO handle disconnection
        mongoose.connect(
            mongoURI,
            {
                keepAlive: true,
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true,
                useFindAndModify: false
            },
            err => {
                if (err) {
                    logger.error(`mongodb.init.error ${err}`)
                    reject(err);
                }
                logger.info(`mongodb.init.success ${mongoURI}`)
                resolve(true);
            });
    });
};
