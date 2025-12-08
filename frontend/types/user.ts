export type UserRole = "admin" | "operator";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
