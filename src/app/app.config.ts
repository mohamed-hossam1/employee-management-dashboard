import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';

import { routes } from './app.routes';
import { InMemoryDataService } from './core/data/in-memory-data.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { ProjectService } from './core/services/project.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    importProvidersFrom(
      HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
        dataEncapsulation: false,
        delay: 300,
        passThruUnknownUrl: true,
        apiBase: 'api'
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.autoLogin(),
      deps: [AuthService],
      multi: true
    },
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
