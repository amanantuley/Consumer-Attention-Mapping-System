export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role_id: number;
  role: Role;
  created_at: string;
  updated_at: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Store {
  id: number;
  name: string;
  location: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Shelf {
  id: number;
  store_id: number;
  camera_id: number | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Camera {
  id: number;
  store_id: number;
  name: string;
  stream_url: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}
