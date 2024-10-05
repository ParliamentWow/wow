import { z } from "zod";

export enum SummarySize {
  Short = "short",
  Medium = "medium",
  Long = "long",
}

export const summariesRequestSchema = z.object({
  sessionId: z.string(),
  summarySize: z.enum(Object.values(SummarySize) as [string, ...string[]]),
});
