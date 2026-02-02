export interface LoginRequest {
  username: string;
  password: string;
}

interface UserResponse {
  user_id: string;
  username: string;
  email_id: string;
  role: string;
  created_at: string;
  created_by: string;
  plain_password?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: UserResponse;
}