import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
 
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  
  const userRole = authService.getUserRole();
  const requiredRole = route.data['role'];
  
  if (!userRole) {
    authService.logout();
    return false;
  }
  
  if (userRole === requiredRole || userRole === 'Super Admin') {
    return true;
  }

  snackBar.open(`Access Denied. Only ${requiredRole} can view this page.`, 'Dismiss', { duration: 5000 });

  if (userRole === 'Admin') {
    return router.createUrlTree(['/report']);
  }
  return router.createUrlTree(['/login']);
};