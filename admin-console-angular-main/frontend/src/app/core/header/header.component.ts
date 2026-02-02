import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { interval, startWith, switchMap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule, MatBadgeModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() isSidebarOpen = false;
  currentUser: string = 'User';
  currentUserId: string = '';
  @Output() sidebarToggled = new EventEmitter<void>();

  appTitle = 'Admin Console';
  isProfileMenuOpen = false;

  isNotificationsOpen = false;
  notifications: Notification[] = [];

  isHealthCheckOpen = false;
  healthServices = [
    { name: 'Scheduler', status: 'RUNNING' },
    { name: 'Consumer 1', status: 'RUNNING' },
    { name: 'Consumer 2', status: 'RUNNING' },
    { name: 'PostgreSQL', status: 'RUNNING' },
    { name: 'RabbitMQ', status: 'RUNNING' }
  ];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const userName = this.authService.getCurrentUserName();
    if (userName) {
      this.currentUser = userName;
    }

    const token = this.authService.getToken();
    if (token) {
      try {
        const payload: any = jwtDecode(token);
        this.currentUserId = payload.sub;
      } catch (err) {
        console.error("Token decode failed:", err);
        this.authService.logout();
      }
    }

    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationService.getNotifications())
      )
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
        },
        error: (err) => {
          console.error("Failed to fetch notifications:", err);
        }
      });
  }

  toggleSidebar(): void {
    this.sidebarToggled.emit();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isNotificationsOpen = false;
      this.isHealthCheckOpen = false;
    }
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isProfileMenuOpen = false;
      this.isHealthCheckOpen = false;
    }
  }

  toggleHealthCheck(): void {
    this.isHealthCheckOpen = !this.isHealthCheckOpen;
    if (this.isHealthCheckOpen) {
      this.isNotificationsOpen = false;
      this.isProfileMenuOpen = false;
    }
  }

  dismissNotification(id: number): void {
    this.notificationService.dismissNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      },
      error: (err) => {
        console.error("Failed to dismiss notification:", err);
      }
    });
  }

  logout(): void {
    console.log('Logging out...');
    this.isProfileMenuOpen = false;
    this.authService.logout();
  }

  changePassword(): void {
    this.isProfileMenuOpen = false;

    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { userId: this.currentUserId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Password successfully changed!');
      } else {
        console.log('Password change cancelled or failed.');
      }
    });
  }
}