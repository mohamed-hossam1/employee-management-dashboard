import { Component } from '@angular/core';

@Component({
  selector: 'app-department-list',
  imports: [],
  template: `
    <main class="department-list" role="main" aria-labelledby="department-list-heading">
      <h1 id="department-list-heading">Departments</h1>
      <p>Department list will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .department-list {
        padding: 1.5rem;
        max-width: 72rem;
        margin: 0 auto;
      }
    `
  ]
})
export class DepartmentListPage {}
