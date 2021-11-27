import { check, query } from "express-validator";

export const validateFindMediaById = [
  query("id").notEmpty().isString().isMongoId(),
];

export const validateDeleteMediaById = [
  query("id").notEmpty().isString().isMongoId(),
];

export const validateCreateMedia = [check("title").notEmpty().isString()];

export const validateHandleAutoTranscribe = [
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

export const validateUpdateMediaById = [
  query("id").notEmpty().isString().isMongoId(),
  check("updates").isObject(),
];
