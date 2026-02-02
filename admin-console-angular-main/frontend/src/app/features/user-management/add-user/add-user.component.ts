import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { 
  User, 
  UserCreateRequest, 
  UserTableItem, 
  UserUpdateRequest 
} from '../../../shared/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; 
import { jwtDecode } from 'jwt-decode';
import { ImageBannerComponent } from '../../../shared/components/image-banner/image-banner.component';
 
@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSortModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ImageBannerComponent
  ],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit, AfterViewInit {
  
  userForm!: FormGroup;
  dataSource = new MatTableDataSource<UserTableItem>([]);
  displayedColumns: string[] = ['username', 'plain_password', 'email_id', 'role', 'actions'];
  roles = ['Admin', 'Super Admin'];

  currentUserId: string = ''; 
  currentUserRole: string = '';
  isLoading: boolean = false;
  
  @ViewChild(MatSort) sort!: MatSort;
 
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }
 
  ngOnInit(): void {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email_id: ['', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      role: ['Admin', Validators.required]
    });
    
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload: any = jwtDecode(token);
        this.currentUserId = payload.sub || '';
        this.currentUserRole = payload.role || '';
      } catch (e) {
        console.error("Failed to decode token:", e);
        this.snackBar.open('Session token is invalid or expired. Please log in.', 'Dismiss', { duration: 5000 });
        this.authService.logout();
      }
    }

    this.loadUsers();
  }
  
  ngAfterViewInit(): void {
    if (this.dataSource && this.sort) {
        this.dataSource.sort = this.sort;
    }
  }
 
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (users: User[]) => {
        const tableData: UserTableItem[] = users.map(user => ({
          ...user,
          isEditing: false,
          isPasswordVisible: false,
          editEmail: user.email_id,
          editRole: user.role
        }));
        this.dataSource.data = tableData;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.snackBar.open(err.error?.detail || 'Failed to load users.', 'Dismiss', { duration: 5000 });
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.snackBar.open('Please correct the form errors.', 'Dismiss', { duration: 3000 });
      return;
    }
 
    const request: UserCreateRequest = this.userForm.value;
    
    this.userService.createUser(request).subscribe({
      next: (newUser) => {
        const newItem: UserTableItem = {
          ...newUser,
          isEditing: false,
          isPasswordVisible: false,
          editEmail: newUser.email_id,
          editRole: newUser.role
        };
        this.dataSource.data = [newItem, ...this.dataSource.data];
        this.userForm.reset({ role: 'Admin' });
        this.snackBar.open(`User ${newUser.username} created. Default password: ${newUser.plain_password}`, 'Dismiss', { duration: 10000 });
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.snackBar.open(err.error?.detail || 'Failed to create user.', 'Dismiss', { duration: 5000 });
      }
    });
  }

  startEdit(row: UserTableItem): void {
    if (this.currentUserRole !== 'Super Admin') {
        this.snackBar.open('You do not have permission to edit users.', 'Dismiss', { duration: 3000 });
        return;
    }
    row.editEmail = row.email_id;
    row.editRole = row.role;
    row.isEditing = true;
  }

  cancelEdit(row: UserTableItem): void {
    row.isEditing = false;
    row.editEmail = row.email_id;
    row.editRole = row.role;
  }

  saveEdit(row: UserTableItem): void {
    if (row.editEmail === row.email_id && row.editRole === row.role) {
      this.snackBar.open('No changes detected.', 'Dismiss', { duration: 2000 });
      row.isEditing = false;
      return;
    }
    
    if (!row.editEmail || !this.isValidEmail(row.editEmail)) {
      this.snackBar.open('Invalid email format.', 'Dismiss', { duration: 3000 });
      return;
    }

    if (row.user_id === this.currentUserId && row.editRole !== row.role) {
        this.snackBar.open('You cannot change your own role.', 'Dismiss', { duration: 5000 });
        row.editRole = row.role; 
        return;
    }
 
    const updateRequest: UserUpdateRequest = {
      email_id: row.editEmail,
      role: (row.user_id !== this.currentUserId && row.editRole !== row.role) ? row.editRole : undefined
    };

    if (row.user_id === this.currentUserId && row.editEmail !== row.email_id) {
        updateRequest.role = undefined;
    }
    
    this.userService.updateUser(row.user_id as string, updateRequest).subscribe({
      next: (updatedUser) => {
        row.email_id = updatedUser.email_id;
        row.role = updatedUser.role;
        row.isEditing = false;
        this.snackBar.open(`User ${row.username} updated successfully.`, 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        console.error('Update failed:', err);
        row.editEmail = row.email_id;
        row.editRole = row.role;
        row.isEditing = false;
        this.snackBar.open(err.error?.detail || 'Failed to update user.', 'Dismiss', { duration: 5000 });
      }
    });
  }
  
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  openDeleteDialog(row: UserTableItem): void {
    if (this.currentUserRole !== 'Super Admin') {
        this.snackBar.open('You do not have permission to delete users.', 'Dismiss', { duration: 3000 });
        return;
    }
    
    if (row.user_id === this.currentUserId) {
        this.snackBar.open('You cannot delete yourself!', 'Dismiss', { duration: 5000 });
        return;
    }
 
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete user "${row.username}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: 'warn'
      }
    });
 
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete(row);
      }
    });
  }
 
  performDelete(row: UserTableItem): void {
    this.userService.deleteUser(row.user_id as string).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(u => u.user_id !== row.user_id);
        this.snackBar.open(`User ${row.username} deleted successfully.`, 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.snackBar.open(err.error?.detail || 'Failed to delete user.', 'Dismiss', { duration: 5000 });
      }
    });
  }

  togglePasswordVisibility(row: UserTableItem): void {
    row.isPasswordVisible = !row.isPasswordVisible;
  }

  canEditRole(row: UserTableItem): boolean {
    return this.currentUserRole === 'Super Admin' && row.user_id !== this.currentUserId;
  }

  canEditEmail(row: UserTableItem): boolean {
    return this.currentUserRole === 'Super Admin' || row.user_id === this.currentUserId;
  }
}