import { Video } from "@remotion/media";
import { AbsoluteFill, Sequence, Series, staticFile, useVideoConfig } from "remotion";
import { colors } from "./brand";
import { HookOverlay } from "./HookOverlay";
import type { BrandReelProps } from "./schema";
import { SegmentCaptions } from "./SegmentCaptions";

const src = (p: string) => (p.startsWith("http") ? p : staticFile(p));

export const BrandReel: React.FC<BrandReelProps> = ({
  hookText,
  hookDurationMs,
  segments,
  broll,
}) => {
  const { fps } = useVideoConfig();
  const ms = (m: number) => Math.max(1, Math.round((m / 1000) * fps));

  return (
    <AbsoluteFill style={{ backgroundColor: colors.black }}>
      <Series>
        {segments.map((seg, i) => (
          <Series.Sequence
            key={i}
            name={`Take ${i + 1}`}
            durationInFrames={ms(seg.endMs - seg.startMs)}
          >
            <Video
              src={src(seg.src)}
              trimBefore={Math.round((seg.startMs / 1000) * fps)}
              objectFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </Series.Sequence>
        ))}
      </Series>

      {broll.map((b, i) => (
        <Sequence key={i} name={`B-roll ${i + 1}`} from={ms(b.atMs)} durationInFrames={ms(b.durationMs)}>
          <Video
            src={src(b.src)}
            trimBefore={Math.round((b.sourceStartMs / 1000) * fps)}
            muted
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </Sequence>
      ))}

      {/* Captions sit on their own layer so they stay visible over B-roll. */}
      <Series>
        {segments.map((seg, i) => (
          <Series.Sequence key={i} name={`Captions ${i + 1}`} durationInFrames={ms(seg.endMs - seg.startMs)}>
            <SegmentCaptions captions={seg.captions} sourceStartMs={seg.startMs} />
          </Series.Sequence>
        ))}
      </Series>

      <Sequence name="Hook" durationInFrames={ms(hookDurationMs)}>
        <HookOverlay text={hookText} durationMs={hookDurationMs} />
      </Sequence>
    </AbsoluteFill>
  );
};
