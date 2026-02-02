import { Routes, Router } from '@angular/router';
import { LoginComponent } from './features/authentication/login/login.component';
import { LayoutComponent } from './core/layout/layout.component';
import { ConfigureParametersComponent } from './features/configuration/configure-parameters/configure-parameters.component';
import { GenerateReportComponent } from './features/reporting/generate-report/generate-report.component';
import { AddUserComponent } from './features/user-management/add-user/add-user.component';
import { TriggerListComponent } from './features/triggers/trigger-list/trigger-list.component';
import { authGuard } from './core/guards/auth.guard'; 
import { roleGuard } from './core/guards/role.guard';
import { landingGuard } from './core/guards/landing.guard';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { MaintenanceComponent } from './features/maintenance/maintenance/maintenance.component';
import { CertificateComponent } from './features/watcher/certificate-watcher/certificate-watcher.component';

export const routes: Routes = [
    { 
        path: 'login', 
        component: LoginComponent,
        title: 'Admin Login' 
    },
    {
        path: '',
        redirectTo: 'landing',
        pathMatch: 'full' 
    },
    {
        path: 'landing',
        canActivate: [authGuard, landingGuard], 
        component: LayoutComponent, 
    },
    {
        path: '',
        component: LayoutComponent, 
        canActivate: [authGuard],
        children: [
            {
                path: 'configure', 
                component: ConfigureParametersComponent, 
                title: 'Configure Parameters',
                canActivate: [roleGuard],
                data: { role: 'Super Admin' } 
            },
             {
                path: 'trigger',
                component: TriggerListComponent,
                title: 'Trigger List',
                canActivate: [roleGuard],
                data: { role: 'Admin' }
            },
            {
                path: 'users',
                component: AddUserComponent,
                title: 'Add User',
                canActivate: [roleGuard],
                data: { role: 'Super Admin' } 
            },
            {
                path: 'report',
                component: GenerateReportComponent,
                title: 'Generate Report',
                canActivate: [roleGuard],
                data: { role: 'Admin' } 
            },
            {
                path: 'maintenance',
                component: MaintenanceComponent,
                title: 'Maintenance',
                canActivate: [roleGuard],
                data: { role: 'Super Admin' } 
            },
            {
                path: 'certificate',
                component: CertificateComponent,
                title: 'Certificates',
                canActivate: [roleGuard],
                data: { role: 'Super Admin' } 
            },
        ]
    },
    {
        path: '**',
        redirectTo: 'login' 
    }
];