import { Injectable } from '@angular/core';

export interface CsvParseResult {
  valid: Record<string, string>[];
  errors: { row: number; message: string }[];
}

@Injectable({ providedIn: 'root' })
export class CsvService {
  export(rows: Record<string, unknown>[], filename: string): void {
    if (rows.length === 0) {
      return;
    }
    const headers = Array.from(
      rows.reduce<Set<string>>((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );

    const escape = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.map(escape).join(',')];
    for (const row of rows) {
      lines.push(headers.map((header) => escape(row[header])).join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async parse(file: File, requiredColumns: string[] = []): Promise<CsvParseResult> {
    const text = await file.text();
    const lines = this.splitLines(text).filter((line) => line.trim().length > 0);
    const errors: { row: number; message: string }[] = [];

    if (lines.length === 0) {
      return { valid: [], errors: [{ row: 0, message: 'File is empty' }] };
    }

    const parseRow = (line: string): string[] => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cells.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells.map((cell) => cell.trim());
    };

    const headers = parseRow(lines[0]);
    for (const required of requiredColumns) {
      if (!headers.includes(required)) {
        errors.push({ row: 0, message: `Missing required column: ${required}` });
      }
    }
    if (errors.length > 0) {
      return { valid: [], errors };
    }

    const valid: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      const rowNumber = i + 1;
      const record: Record<string, string> = {};
      let missing = false;
      headers.forEach((header, index) => {
        const value = cells[index] ?? '';
        record[header] = value;
        if (requiredColumns.includes(header) && value === '') {
          missing = true;
        }
      });
      if (missing) {
        errors.push({ row: rowNumber, message: 'Missing required field(s)' });
      }
      valid.push(record);
    }

    return { valid, errors };
  }

  private splitLines(text: string): string[] {
    return text.split(/\r\n|\n|\r/);
  }
}
