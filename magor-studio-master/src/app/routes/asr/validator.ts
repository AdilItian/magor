import { check, query } from "express-validator";

export const validateGenerateTranscript = [
  query("id").notEmpty().isString().isMongoId(),
  check("language")
    .notEmpty()
    .isIn(["english", "malay", "mandarin", "english-malay", "english-mandarin"])
    .default("english"),
  check("audioType")
    .notEmpty()
    .isIn(["closetalk", "telephony"])
    .default("closetalk"),
  check("audioTrack").notEmpty().isIn(["single", "multi"]).default("single"),
];

export const validateFetchStatus = [
  query("media").notEmpty().isString().isMongoId(),
  query("asr").notEmpty().isString(),
];

export const validateFetchCurrentRequests = [
  query("id").notEmpty().isString().isMongoId(),
];
