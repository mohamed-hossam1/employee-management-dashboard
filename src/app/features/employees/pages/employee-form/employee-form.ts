import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-form',
  imports: [],
  template: `
    <main class="employee-form" role="main" aria-labelledby="employee-form-heading">
      <h1 id="employee-form-heading">Employee form</h1>
      <p>Create and edit form will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .employee-form {
        padding: 1.5rem;
        max-width: 40rem;
        margin: 0 auto;
      }
    `
  ]
})
export class EmployeeFormPage {}
