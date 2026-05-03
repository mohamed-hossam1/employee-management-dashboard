import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-detail',
  imports: [],
  template: `
    <main class="employee-detail" role="main" aria-labelledby="employee-detail-heading">
      <h1 id="employee-detail-heading">Employee detail</h1>
      <p>Employee profile will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .employee-detail {
        padding: 1.5rem;
        max-width: 48rem;
        margin: 0 auto;
      }
    `
  ]
})
export class EmployeeDetailPage {}
