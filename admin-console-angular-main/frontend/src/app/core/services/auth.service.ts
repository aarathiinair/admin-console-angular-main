import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../shared/models/auth.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; 
  private loginUrl = `${this.apiUrl}/auth/login`;
 
  constructor(private http: HttpClient, private router: Router) { }
 
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const body = new URLSearchParams(); 
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<LoginResponse>(this.loginUrl, body.toString(), { headers })
      .pipe(
        tap(response => {
          this.saveToken(response.access_token);
          sessionStorage.setItem('current_user_name', response.user.username);
          sessionStorage.setItem('user_role', response.user.role);
        })
      );
  }

  private saveToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    return sessionStorage.getItem("user_role");
  }

  getCurrentUserName(): string | null {
    return sessionStorage.getItem("current_user_name");
  }

  logout(): void {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('current_user_name');
    this.router.navigate(['/login']);
  }
}