import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
 
interface NavItem {
    name: string;
    route: string;
    icon: string;
    minRole: 'Admin' | 'Super Admin';
}
 
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  
  private authService = inject(AuthService);
  currentUserRole: string | null = null;

  fullNavItems: NavItem[] = [
    { name: 'Configuration', route: '/configure', icon: 'settings', minRole: 'Super Admin' },
    { name: 'Trigger Management', route: '/trigger', icon: 'event_note', minRole: 'Admin' },
    { name: 'User Management', route: '/users', icon: 'person_add', minRole: 'Super Admin' },
    { name: 'Reporting', route: '/report', icon: 'monitoring', minRole: 'Admin' },
    { name: 'Maintenance Window', route: '/maintenance', icon: 'build', minRole: 'Super Admin' },
    { name: 'Certificate Watcher', route: '/certificate', icon: 'card_membership', minRole: 'Super Admin' },
  ];
  
  navItems: NavItem[] = [];

  activeRoute = '/configure'; 
 
  ngOnInit(): void {
    this.currentUserRole = this.authService.getUserRole();
    this.filterNavItems();
  }
 
  filterNavItems(): void {
    const role = this.currentUserRole;
 
    if (role === 'Super Admin') {
        this.navItems = this.fullNavItems;
    } else if (role === 'Admin') {
        this.navItems = this.fullNavItems.filter(item => item.minRole === 'Admin');
        this.activeRoute = '/report';
    } else {
        this.navItems = [];
    }
  }

  setActive(route: string): void {
      this.activeRoute = route;
  }
}