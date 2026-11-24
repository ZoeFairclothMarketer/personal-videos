import { createTikTokStyleCaptions } from "@remotion/captions";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import type { Segment } from "./schema";

// Word-by-word captions for one kept segment. Timestamps stay relative to the
// source file; sourceStartMs maps the segment's frame 0 back onto the source.
export const SegmentCaptions: React.FC<{
  captions: Segment["captions"];
  sourceStartMs: number;
}> = ({ captions, sourceStartMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = sourceStartMs + (frame / fps) * 1000;

  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: 600,
      }).pages,
    [captions],
  );

  const page = pages.find((p) => t >= p.startMs && t < p.startMs + p.durationMs);
  if (!page) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 520,
        textAlign: "center",
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        color: colors.white,
        textShadow: "0 6px 24px rgba(0,0,0,0.55)",
        WebkitTextStroke: `3px ${colors.black}`,
        paintOrder: "stroke fill",
      }}
    >
      {page.tokens.map((tok, i) => {
        const active = t >= tok.fromMs && t < tok.toMs;
        return (
          <span key={i} style={{ color: active ? colors.lime : colors.white, whiteSpace: "pre-wrap" }}>
            {tok.text}
          </span>
        );
      })}
    </div>
  );
};
