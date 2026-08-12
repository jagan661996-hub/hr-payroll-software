import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import { AppError } from "../middleware/errorHandler";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = authService.login(email, password);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "Email and password are required"));
    }
    next(err);
  }
}

export function getMe(req: Request, res: Response) {
  res.json(req.user);
}
