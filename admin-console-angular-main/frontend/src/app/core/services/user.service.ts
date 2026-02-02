import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  DeleteUserResponse
} from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  /** Fetches all users (Super Admin only) */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /** Creates a new user */
  createUser(request: UserCreateRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  /** Updates an existing user (inline editing) */
  updateUser(userId: string, request: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, request);
  }

  /** Updates an existing user's password */
  updatePassword(userId: string, payload: { current_password: string; new_password: string }) {
    return this.http.put(`${this.apiUrl}/${userId}/password`, payload);
  }

  /** Deletes a user */
  deleteUser(userId: string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.apiUrl}/${userId}`);
  }
}