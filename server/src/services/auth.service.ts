import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../config/database";
import { env } from "../config/env";
import { UserRepository } from "../repositories/user.repository";
import { AuthUser } from "../models/user.model";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "./auditLog.service";

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export function login(email: string, password: string): LoginResult {
  const db = getDb();
  const repo = new UserRepository(db);
  const user = repo.findByEmail(email);

  if (!user || !user.is_active) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(authUser, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  } as jwt.SignOptions);

  logAudit(db, user.id, "LOGIN", "users", user.id);

  return { token, user: authUser };
}
