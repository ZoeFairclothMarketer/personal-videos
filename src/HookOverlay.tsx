import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";

// On-screen text hook: lime card, black uppercase Clash Display, top third.
export const HookOverlay: React.FC<{ text: string; durationMs: number }> = ({
  text,
  durationMs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const endFrame = (durationMs / 1000) * fps;
  const fontSize = text.length > 70 ? 64 : text.length > 40 ? 76 : 92;

  return (
    <div
      style={{
        position: "absolute",
        top: 260,
        left: 70,
        right: 70,
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
          backgroundColor: colors.lime,
          color: colors.black,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          textAlign: "center",
          padding: "28px 36px",
          borderRadius: 6,
          scale: interpolate(frame, [0, 0.35 * fps], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          rotate: "-1.5deg",
        }}
      >
        {text}
      </div>
    </div>
  );
};
