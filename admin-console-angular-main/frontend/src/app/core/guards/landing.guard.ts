import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
 
export const landingGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const role = authService.getUserRole();
 
    if (role === 'Super Admin') {
        return router.createUrlTree(['/configure']);
    }
    if (role === 'Admin') {
        return router.createUrlTree(['/report']);
    }
 
    // Default fallback to prevent routing errors if the user is somehow logged in 
    // but has an invalid role (AuthGuard should run first, but this is defensive)
    authService.logout();
    return router.createUrlTree(['/login']);
};