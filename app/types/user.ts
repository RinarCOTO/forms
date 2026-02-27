// User Types for the application

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'tax_mapper'
  | 'municipal_tax_mapper'
  | 'laoo'
  | 'assistant_provincial_assessor'
  | 'provincial_assessor'
  | 'accountant'
  | 'user';

export type Municipality =
  | 'barlig'
  | 'bauko'
  | 'besao'
  | 'bontoc'
  | 'natonin'
  | 'paracellis'
  | 'sabangan'
  | 'sagada'
  | 'sadanga'
  | 'tadian';

export const MUNICIPALITIES: Municipality[] = [
  'barlig',
  'bauko',
  'besao',
  'bontoc',
  'natonin',
  'paracellis',
  'sabangan',
  'sagada',
  'sadanga',
  'tadian',
];

export const MUNICIPALITY_LABELS: Record<Municipality, string> = {
  barlig:     'Barlig',
  bauko:      'Bauko',
  besao:      'Besao',
  bontoc:     'Bontoc',
  natonin:    'Natonin',
  paracellis: 'Paracellis',
  sabangan:   'Sabangan',
  sagada:     'Sagada',
  sadanga:    'Sadanga',
  tadian:     'Tadian',
};

export interface User {
  id: string; // UUID from Supabase Auth
  email: string;
  full_name?: string | null;
  role: UserRole;
  municipality?: Municipality | null;
  laoo_level?: number | null; // 1–4, only relevant for laoo role
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
  municipality?: Municipality | null;
  laoo_level?: number | null;
  department?: string;
  position?: string;
  phone?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  municipality?: Municipality | null;
  laoo_level?: number | null;
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
  municipality?: Municipality | null;
  department?: string | null;
  position?: string | null;
}
