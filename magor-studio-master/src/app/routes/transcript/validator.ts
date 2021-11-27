import { check, query } from "express-validator";

export const validateCreateTranscript = [
  check("mediaId").notEmpty(),
  check("format")
    .notEmpty()
    .isIn(["srt", "json", "xml", "youtube.json", "textgrid", "stm"]),
  check("language")
    .notEmpty()
    .isIn([
      "english",
      "malay",
      "mandarin",
      "english-malay",
      "english-mandarin",
    ]),
  check("transcriptType")
    .notEmpty()
    .isIn(["transcript", "imageCaption", "soundCaption"]),
];

export const validateDeleteTranscript = [query("id").notEmpty().isMongoId()];

export const validateUpdateTranscript = [
  query("id").notEmpty().isMongoId(),
  check("name").notEmpty().isString(),
];
