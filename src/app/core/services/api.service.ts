import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthState } from '../state/auth.state';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthState);
  private readonly restUrl = `${environment.supabaseUrl}/rest/v1`;
  private readonly apiKey = environment.supabasePublishableKey;

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    const { table, id } = this.parsePath(path);
    let httpParams = new HttpParams().set('select', '*');

    if (id) {
      httpParams = httpParams.set('id', `eq.${id}`).set('limit', '1');
    }

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        httpParams = httpParams.set(this.toSnakeCase(key), `eq.${value}`);
      }
    }

    return this.http
      .get<unknown>(this.tableUrl(table), {
        headers: this.headers(),
        params: httpParams
      })
      .pipe(
        map((payload) => {
          const mapped = this.fromDatabase(payload);
          if (id) {
            return (Array.isArray(mapped) ? mapped[0] ?? null : mapped) as T;
          }
          return mapped as T;
        })
      );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    const { table } = this.parsePath(path);
    return this.http
      .post<unknown>(this.tableUrl(table), this.toDatabase(body), {
        headers: this.headers({ Prefer: 'return=representation' })
      })
      .pipe(map((payload) => this.unwrapSingle<T>(payload)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    const { table, id } = this.parsePath(path);
    if (!id) {
      throw new Error(`Missing record id for update path "${path}".`);
    }

    return this.http
      .patch<unknown>(this.tableUrl(table), this.toDatabase(body), {
        headers: this.headers({ Prefer: 'return=representation' }),
        params: new HttpParams().set('id', `eq.${id}`)
      })
      .pipe(map((payload) => this.unwrapSingle<T>(payload)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.put<T>(path, body);
  }

  upsert<T>(path: string, body: unknown, onConflict = 'id'): Observable<T> {
    const { table } = this.parsePath(path);
    return this.http
      .post<unknown>(this.tableUrl(table), this.toDatabase(body), {
        headers: this.headers({
          Prefer: 'resolution=merge-duplicates,return=representation'
        }),
        params: new HttpParams().set('on_conflict', onConflict)
      })
      .pipe(map((payload) => this.unwrapSingle<T>(payload)));
  }

  delete<T>(path: string): Observable<T> {
    const { table, id } = this.parsePath(path);
    if (!id) {
      throw new Error(`Missing record id for delete path "${path}".`);
    }

    return this.http
      .delete(this.tableUrl(table), {
        headers: this.headers(),
        params: new HttpParams().set('id', `eq.${id}`)
      })
      .pipe(map(() => undefined as T));
  }

  rpc<T>(fn: string, body?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<unknown>(`${this.restUrl}/rpc/${fn}`, this.toDatabase(body ?? {}), {
        headers: this.headers()
      })
      .pipe(map((payload) => this.fromDatabase(payload) as T));
  }

  private unwrapSingle<T>(payload: unknown): T {
    const mapped = this.fromDatabase(payload);
    return (Array.isArray(mapped) ? mapped[0] ?? null : mapped) as T;
  }

  private tableUrl(table: string): string {
    return `${this.restUrl}/${table}`;
  }

  private headers(extra: Record<string, string> = {}): HttpHeaders {
    const token = this.authState.token();
    return new HttpHeaders({
      apikey: this.apiKey,
      Authorization: `Bearer ${token ?? this.apiKey}`,
      'Content-Type': 'application/json',
      ...extra
    });
  }

  private parsePath(path: string): { table: string; id: string | null } {
    const clean = path.replace(/^\/+|\/+$/g, '');
    const [table, id] = clean.split('/');
    if (!table) {
      throw new Error(`Invalid API path "${path}".`);
    }
    return { table: this.toSnakeCase(table), id: id ?? null };
  }

  private toDatabase(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.toDatabase(item));
    }
    if (this.isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [
          this.toSnakeCase(key),
          this.toDatabase(nested)
        ])
      );
    }
    return value;
  }

  private fromDatabase(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.fromDatabase(item));
    }
    if (this.isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [
          this.toCamelCase(key),
          this.fromDatabase(nested)
        ])
      );
    }
    return value;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private toSnakeCase(value: string): string {
    return value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  private toCamelCase(value: string): string {
    return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
  }
}
