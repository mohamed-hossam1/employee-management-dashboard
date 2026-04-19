import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink],
  template: `
    <main role="main" style="padding:1.5rem">
      <h1>403 &mdash; Unauthorized</h1>
      <p>You do not have permission to access this resource.</p>
      <a routerLink="/projects">Back to dashboard</a>
    </main>
  `
})
export class UnauthorizedPage {}
