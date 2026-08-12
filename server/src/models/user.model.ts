export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  is_active: number;
  created_at: string;
}

// Never send password_hash back to the client - this is the safe
// subset that goes into JWT payloads and API responses.
export interface AuthUser {
  id: number;
  email: string;
  role: User["role"];
}
