import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastHost } from './shared/components/toast-host/toast-host';
import { LoaderComponent } from './shared/components/loader/loader';
import { NavigationLoadingService } from './core/services/navigation-loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly navigationLoading = inject(NavigationLoadingService);

  protected readonly title = signal('employee-management-dashboard');
  protected readonly navLoading = this.navigationLoading.isLoading;
}
