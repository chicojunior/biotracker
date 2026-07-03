import type { ZodError } from 'zod';

/**
 * Flatten a ZodError into `path: message` strings for the Result error
 * `details[]` (SPEC §I.error.codes), matching the React app's
 * validationDetails() format.
 */
export function zodDetails(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}
