import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { AuthState } from '../core/state/auth.state';

@Component({
  selector: 'app-projects-placeholder',
  template: `
    <main role="main" style="padding:1.5rem">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
        <h1>Projects</h1>
        <button
          type="button"
          (click)="logout()"
          style="padding:0.5rem 1rem;border:1px solid var(--border);border-radius:0.5rem;background:var(--surface);color:var(--fg);cursor:pointer"
        >
          Sign out{{ auth.currentUser() ? ' (' + auth.currentUser()!.email + ')' : '' }}
        </button>
      </header>
      <p>Protected area. Requires authentication.</p>
    </main>
  `
})
export class ProjectsPlaceholder {
  protected readonly auth = inject(AuthState);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
