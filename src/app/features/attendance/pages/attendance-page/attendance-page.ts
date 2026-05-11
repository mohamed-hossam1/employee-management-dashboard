import { Component } from '@angular/core';

@Component({
  selector: 'app-attendance-page',
  imports: [],
  template: `
    <main class="attendance-page" role="main" aria-labelledby="attendance-heading">
      <h1 id="attendance-heading">Attendance</h1>
      <p>Attendance tracking will load here.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .attendance-page {
        padding: 1.5rem;
        max-width: 72rem;
        margin: 0 auto;
      }
    `
  ]
})
export class AttendancePage {}
