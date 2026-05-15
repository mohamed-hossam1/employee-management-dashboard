import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  template: `
    <main class="dashboard-page" role="main" aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading">Dashboard</h1>
      <p>Project overview will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .dashboard-page {
        padding: 1.5rem;
        max-width: 72rem;
        margin: 0 auto;
      }
    `
  ]
})
export class DashboardPage {}
