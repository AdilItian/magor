import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';

export const handleValidationError = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).jsonp(errors.array({ onlyFirstError: true }))
  }
  next()
}
