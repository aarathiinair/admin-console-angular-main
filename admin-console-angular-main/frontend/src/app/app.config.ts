import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

import { registerLocaleData, DatePipe } from '@angular/common'; 
import localeEn from '@angular/common/locales/en';
import { authInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(localeEn);
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'en-US' },
    DatePipe,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS, 
      useValue: { hasBackdrop: true }
    }
  ]
};