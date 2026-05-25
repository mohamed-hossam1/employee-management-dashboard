import { Injectable, inject } from '@angular/core';

export type StorageKey = 'token' | 'theme' | 'activeProjectId' | 'session';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(LocalStorageToken);

  get<T>(key: StorageKey): T | null {
    const raw = this.storage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  set(key: StorageKey, value: unknown): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  remove(key: StorageKey): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

import { InjectionToken } from '@angular/core';

export const LocalStorageToken = new InjectionToken<Storage>('local-storage', {
  providedIn: 'root',
  factory: () => localStorage
});
