import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * Marks the form touched and scrolls/focuses the first invalid control.
 */
export function scrollToFirstInvalid(
  form: FormGroup,
  root: ParentNode | null = typeof document !== 'undefined' ? document : null
): void {
  form.markAllAsTouched();
  if (form.valid || !root) {
    return;
  }

  const firstInvalidName = findFirstInvalidControlName(form);
  if (!firstInvalidName) {
    return;
  }

  const selector = `[formControlName="${firstInvalidName}"], #${firstInvalidName}, [id="${firstInvalidName}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    return;
  }

  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  // Prefer focusing the control itself when focusable
  if (typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

function findFirstInvalidControlName(control: AbstractControl, path = ''): string | null {
  if (control instanceof FormGroup) {
    for (const [key, child] of Object.entries(control.controls)) {
      const childPath = path ? `${path}.${key}` : key;
      const found = findFirstInvalidControlName(child, childPath);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return control.invalid ? path.split('.').pop() ?? path : null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
