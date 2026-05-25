import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/error-handler';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { ProjectService } from './core/services/project.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: (themeService: ThemeService) => () => themeService.init(),
      deps: [ThemeService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService, projectService: ProjectService) => async () => {
        const authed = await authService.autoLogin();
        if (authed) {
          const user = authService.getCurrentUser();
          if (user) {
            await projectService.loadActiveProject(user.id);
          }
        }
      },
      deps: [AuthService, ProjectService],
      multi: true
    }
  ]
};
