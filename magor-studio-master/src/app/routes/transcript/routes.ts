import { Router } from "express";
import * as controller from "./controller";
import * as validator from "./validator";
import * as httpUtils from "../../../utils/http";

const router = Router();

router.post(
  "/",
  validator.validateCreateTranscript,
  httpUtils.handleValidationError,
  controller.handleCreateTranscript
);

router.delete(
  "/",
  validator.validateDeleteTranscript,
  httpUtils.handleValidationError,
  controller.handleDeleteTranscript
);

router.put(
  "/",
  validator.validateUpdateTranscript,
  httpUtils.handleValidationError,
  controller.handleUpdateTranscriptById
);

export default router;
