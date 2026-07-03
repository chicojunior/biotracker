/**
 * Service-boundary Result envelope (SPEC §C7 / V19). Every service and
 * repository function returns a Result instead of throwing across the
 * boundary, mirroring the React app's `HealthStorageResult` contract so the
 * two layers speak the same shape.
 *
 * @example
 *   const result = await entriesRepository.upsert(db, entry);
 *   if (!result.ok) return reply.code(422).send(result);
 *   return reply.send(result.data);
 */

// SPEC §I.error.codes, extended with not_found for REST lookups.
export type ResultErrorCode =
  | 'malformed_json'
  | 'unsupported_version'
  | 'invalid_payload'
  | 'write_failed'
  | 'not_found';

export type ResultError = {
  code: ResultErrorCode;
  message: string;
  details?: string[];
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ResultError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(
  code: ResultErrorCode,
  message: string,
  details?: string[],
): Result<never> {
  return {
    ok: false,
    error: details && details.length > 0 ? { code, message, details } : { code, message },
  };
}

// SPEC §I.error.codes → HTTP. Internal codes translate to 422 (client payload
// problems), 404 (missing resource), or 500 (server-side write failure).
export function httpStatusForError(code: ResultErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'write_failed':
      return 500;
    case 'malformed_json':
    case 'unsupported_version':
    case 'invalid_payload':
      return 422;
    default:
      return 422;
  }
}
