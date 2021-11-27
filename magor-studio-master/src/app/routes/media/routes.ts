import { Router } from "express";
import * as controller from "./controller";
import * as validator from "./validator";
import * as httpUtils from "../../../utils/http";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

router.get(
  "/",
  validator.validateFindMediaById,
  httpUtils.handleValidationError,
  controller.handleFindMediaById
);

router.post(
  "/",
  authenticate,
  validator.validateCreateMedia,
  httpUtils.handleValidationError,
  controller.handleCreateMedia
);

router.put(
  "/",
  authenticate,
  validator.validateUpdateMediaById,
  httpUtils.handleValidationError,
  controller.handleUpdateMediaById
);

router.delete(
  "/",
  authenticate,
  validator.validateDeleteMediaById,
  httpUtils.handleValidationError,
  controller.handleDeleteMediaById
);

router.post(
  "/transcribe",
  validator.validateHandleAutoTranscribe,
  httpUtils.handleValidationError,
  controller.handleAutoTranscibe
);

export default router;
