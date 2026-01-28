// User Types for the application

export type UserRole = 'admin' | 'user' | 'assessor' | 'manager' | 'viewer';

export interface User {
  id: string; // UUID from Supabase Auth
  email: string;
  full_name?: string | null;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  is_active: boolean;
  last_login?: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  department?: string;
  position?: string;
  phone?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  department?: string;
  position?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  department?: string | null;
  position?: string | null;
}
