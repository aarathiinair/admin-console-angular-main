export interface User {
  user_id: string;
  username: string;
  email_id: string;
  role: string;
  created_at: Date;
  created_by: string;
  plain_password: string;
}

export interface UserCreateRequest {
  username: string;
  email_id: string;
  role: string;
}

export interface UserUpdateRequest {
  email_id?: string;
  role?: string;
}

export interface UserTableItem extends User {
  isEditing: boolean;
  isPasswordVisible: boolean;
  editEmail: string;
  editRole: string;
}
 
export interface DeleteUserResponse {
  message: string;
}