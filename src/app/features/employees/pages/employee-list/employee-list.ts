import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-list',
  imports: [],
  template: `
    <main class="employee-list" role="main" aria-labelledby="employee-list-heading">
      <h1 id="employee-list-heading">Employees</h1>
      <p>Employee list will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .employee-list {
        padding: 1.5rem;
        max-width: 72rem;
        margin: 0 auto;
      }
    `
  ]
})
export class EmployeeListPage {}
