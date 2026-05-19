export const MAX_AVATAR_BYTES = 500_000;

export type AvatarValidationError = 'type' | 'size' | 'read';

export interface AvatarReadResult {
  ok: true;
  dataUrl: string;
}

export interface AvatarReadFailure {
  ok: false;
  error: AvatarValidationError;
  message: string;
}

export function validateAvatarFile(file: File): AvatarReadFailure | null {
  if (!file.type.startsWith('image/')) {
    return {
      ok: false,
      error: 'type',
      message: 'Avatar must be an image file (PNG, JPG, or GIF).'
    };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: 'size',
      message: 'Avatar must be 500KB or smaller.'
    };
  }
  return null;
}

export function readFileAsDataUrl(file: File): Promise<AvatarReadResult | AvatarReadFailure> {
  const validation = validateAvatarFile(file);
  if (validation) {
    return Promise.resolve(validation);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        resolve({
          ok: false,
          error: 'read',
          message: 'Unable to read the selected file.'
        });
        return;
      }
      resolve({ ok: true, dataUrl: result });
    };
    reader.onerror = () => {
      resolve({
        ok: false,
        error: 'read',
        message: 'Unable to read the selected file.'
      });
    };
    reader.readAsDataURL(file);
  });
}
