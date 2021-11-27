import { check, query } from 'express-validator';

export const validateUploadRecording = [
  query('id').notEmpty().isMongoId()
]

export const validateUploadTranscript = [
  query('id').notEmpty().isMongoId()
]
