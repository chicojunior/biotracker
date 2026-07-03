/**
 * Import/export envelope validation (SPEC §I.envelope, §V11). Reuses the React
 * app's `dailyHealthEntrySchema` as the single source of truth for entry shape;
 * only the envelope wrapper is defined here.
 */
import { z } from 'zod';

import { dailyHealthEntrySchema } from '../../../src/lib/validation/healthSchemas';

export const IMPORT_ENVELOPE_VERSION = 1;

// Version is checked separately from entries so a future version maps to
// unsupported_version rather than a generic invalid_payload (V11).
export const envelopeVersionSchema = z
  .object({ version: z.number().int() })
  .passthrough();

// Extra top-level keys (savedAt, updatedAt, exportedAt) are tolerated.
export const importEnvelopeSchema = z
  .object({
    version: z.literal(IMPORT_ENVELOPE_VERSION),
    entries: z.array(dailyHealthEntrySchema),
  })
  .passthrough();

export type ImportEnvelope = z.infer<typeof importEnvelopeSchema>;
