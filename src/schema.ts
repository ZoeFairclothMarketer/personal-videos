import { z } from "zod";

// One word from Whisper, timestamps relative to the start of its source file.
export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

// A kept piece of a talking-head clip. Times are in the source file.
export const segmentSchema = z.object({
  src: z.string(), // path inside public/, e.g. "jobs/2026-11-24/clip-14.mp4"
  startMs: z.number(),
  endMs: z.number(),
  captions: z.array(captionSchema),
});

// A cutaway shown on top of the talking head. Audio of the talking head keeps playing.
export const brollSchema = z.object({
  src: z.string(),
  atMs: z.number(), // position on the OUTPUT timeline
  durationMs: z.number(),
  sourceStartMs: z.number().default(0),
});

export const brandReelSchema = z.object({
  hookText: z.string(), // the on-screen hook for this variant
  hookDurationMs: z.number().default(3000),
  segments: z.array(segmentSchema),
  broll: z.array(brollSchema).default([]),
});

export type BrandReelProps = z.infer<typeof brandReelSchema>;
export type Segment = z.infer<typeof segmentSchema>;
