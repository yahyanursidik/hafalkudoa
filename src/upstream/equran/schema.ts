import { z } from "zod";

/**
 * Exact record shape observed from https://equran.id/api/doa and /api/doa/1
 * on 2026-09-18. This is intentionally an upstream-only contract; no domain
 * mapping or persistence belongs here.
 */
export const eQuranDuaSchema = z
  .object({
    id: z.number().int().positive(),
    grup: z.string(),
    nama: z.string(),
    ar: z.string(),
    tr: z.string(),
    idn: z.string(),
    tentang: z.string(),
    tag: z.array(z.string()),
  })
  .strict();

export const eQuranDuaListResponseSchema = z
  .object({
    status: z.literal("success"),
    total: z.number().int().nonnegative(),
    data: z.array(eQuranDuaSchema),
  })
  .strict();

export const eQuranDuaDetailResponseSchema = z
  .object({
    status: z.literal("success"),
    data: eQuranDuaSchema,
  })
  .strict();

export type EQuranDua = z.infer<typeof eQuranDuaSchema>;
export type EQuranDuaListResponse = z.infer<typeof eQuranDuaListResponseSchema>;
export type EQuranDuaDetailResponse = z.infer<typeof eQuranDuaDetailResponseSchema>;
