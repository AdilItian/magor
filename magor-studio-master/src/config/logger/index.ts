import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.simple(),
      ),
    })
  ]
});

export class WinstonStream {
  write(message: string) {
    message = message.replace(/\n$/, '');
    logger.info(message);
  }
};

export default logger;
