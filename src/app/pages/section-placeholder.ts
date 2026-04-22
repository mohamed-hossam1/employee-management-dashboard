import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-section-placeholder',
  template: `
    <section style="padding:1.5rem" role="region" [attr.aria-label]="title + ' section'">
      <h2 style="margin-top:0">{{ title }}</h2>
      <p style="color:var(--muted)">This section is coming in a later phase.</p>
    </section>
  `
})
export class SectionPlaceholder {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['section'] as string | undefined) ?? 'Section';
}
