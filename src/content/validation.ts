import { z } from "zod";

const nonBlankText = z.string().refine((value) => value.trim().length > 0, {
  message: "must not be blank",
});

/** Content required before a doa can enter ACTIVE state. Values are validated but never rewritten. */
export const activeDuaContentSchema = z.object({
  externalId: nonBlankText,
  arabic: nonBlankText,
  latin: nonBlankText,
  translationId: nonBlankText,
  sourceReference: nonBlankText,
  contentHash: nonBlankText,
});

export type ActiveDuaContent = z.infer<typeof activeDuaContentSchema>;
