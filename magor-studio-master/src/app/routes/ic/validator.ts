import { check, query } from "express-validator";

export const validateGenerateImageCaption = [
  query("id").notEmpty().isString().isMongoId(),
];

export const validateFetchStatus = [
  query("media").notEmpty().isString().isMongoId(),
  query("icr").notEmpty().isString(),
];

export const validateFetchCurrentRequests = [
  query("id").notEmpty().isString().isMongoId(),
];
