export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  is_active: number;
  created_at: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: User["role"];
}
