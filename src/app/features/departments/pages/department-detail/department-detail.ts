import { Component } from '@angular/core';

@Component({
  selector: 'app-department-detail',
  imports: [],
  template: `
    <main class="department-detail" role="main" aria-labelledby="department-detail-heading">
      <h1 id="department-detail-heading">Department detail</h1>
      <p>Department profile will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .department-detail {
        padding: 1.5rem;
        max-width: 56rem;
        margin: 0 auto;
      }
    `
  ]
})
export class DepartmentDetailPage {}
