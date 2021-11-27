import { Router } from "express";
import * as controller from './controller';
import * as validator from './validator';
import * as httpUtils from '../../../utils/http';

const router = Router();

router.post(
    '/recording',
    validator.validateUploadRecording,
    httpUtils.handleValidationError,
    controller.handleUploadRecording
);

router.post(
    '/transcript',
    validator.validateUploadTranscript,
    httpUtils.handleValidationError,
    controller.handleUploadTranscript
);

router.put(
    '/transcript',
    controller.handleUpdateTranscript
);

export default router;
