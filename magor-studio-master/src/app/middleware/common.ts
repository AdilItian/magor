import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import parser from "body-parser";
import { WinstonStream } from "../../config/logger";
import morgan from 'morgan';

import { Router } from "express";

export const handleBodyRequestParser = (router: Router) => {
    router.use(parser.urlencoded({ extended: true }));
    router.use(parser.json());
};

export const handleCompression = (router: Router) => {
    router.use(compression());
}

export const handleCors = (router: Router) => {
    // default configuration
    router.use(cors());
};

export const handleHelmet = (router: Router) => {
    router.use(helmet());
}

export const handleLogging = (router: Router) => {
    // TODO Improve API log output
    router.use(morgan('dev', { stream: new WinstonStream() }))
}
