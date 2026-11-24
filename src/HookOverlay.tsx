import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";

// On-screen text hook in the native TikTok / Reels text style: white rounded box,
// black bold sentence-case text, straight, top third. Reads as a normal post, not an ad.
export const HookOverlay: React.FC<{ text: string; durationMs: number }> = ({
  text,
  durationMs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const endFrame = (durationMs / 1000) * fps;
  const fontSize = text.length > 70 ? 56 : text.length > 40 ? 64 : 76;

  return (
    <div
      style={{
        position: "absolute",
        top: 260,
        left: 90,
        right: 90,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(frame, [endFrame - 6, endFrame], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          color: colors.black,
          fontFamily: fonts.native,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.18,
          letterSpacing: "-0.01em",
          textAlign: "center",
          padding: "22px 34px",
          borderRadius: 22,
          scale: interpolate(frame, [0, 0.25 * fps], [0.92, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {text}
      </div>
    </div>
  );
};
