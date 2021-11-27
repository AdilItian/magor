import { Router } from "express";
import * as controller from "./controller";
import * as validator from "./validator";
import * as httpUtils from "../../../utils/http";

const router = Router();

router.post(
  "/new",
  validator.validateGenerateTranscript,
  httpUtils.handleValidationError,
  controller.handleGenerateTranscription
);

router.get(
  "/status",
  validator.validateFetchStatus,
  httpUtils.handleValidationError,
  controller.handleFetchStatus
);

router.get(
  "/current",
  validator.validateFetchCurrentRequests,
  httpUtils.handleValidationError,
  controller.handleFetchCurrentRequests
)

router.post("/webhook", controller.handleStatusWebhook);

export default router;
