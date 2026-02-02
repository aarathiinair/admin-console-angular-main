import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
 
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule, 
    MatButtonModule,
    MatIconModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;

  hidePassword = true;
 
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }
 
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
 
  onSubmit(): void {
    this.errorMessage = null;
 
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }
 
    const { username, password } = this.loginForm.value;
 
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.router.navigate(['/configure']);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.errorMessage = err.error?.detail || 'Login failed. Please check your credentials.';
        this.loginForm.get('password')?.reset();
      }
    });
  }
}