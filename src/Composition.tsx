import { CalculateMetadataFunction, Composition, continueRender, delayRender } from "remotion";
import { VIDEO } from "./brand";
import { BrandReel } from "./BrandReel";
import { loadBrandFonts } from "./fonts";
import { BrandReelProps, brandReelSchema } from "./schema";

const fontHandle = delayRender("Loading brand fonts");
loadBrandFonts().then(() => continueRender(fontHandle));

const calculateMetadata: CalculateMetadataFunction<BrandReelProps> = ({ props }) => {
  const totalMs = props.segments.reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  return {
    durationInFrames: Math.max(1, Math.round((totalMs / 1000) * VIDEO.fps)),
  };
};

// Default props point at the sample clip so Studio opens with something to look at.
// Real jobs pass their own props: npx remotion render BrandReel --props=jobs/<id>/variant-1.json
const defaultProps: BrandReelProps = {
  hookText: "Bought a bus on Facebook Marketplace for 5000 USD cash",
  hookDurationMs: 3000,
  segments: [
    {
      src: "sample/talking-head.mp4",
      startMs: 0,
      endMs: 6000,
      captions: [
        { text: "This", startMs: 300, endMs: 600, timestampMs: 450, confidence: null },
        { text: " is", startMs: 600, endMs: 800, timestampMs: 700, confidence: null },
        { text: " a", startMs: 800, endMs: 900, timestampMs: 850, confidence: null },
        { text: " sample", startMs: 900, endMs: 1500, timestampMs: 1200, confidence: null },
        { text: " clip", startMs: 1500, endMs: 2100, timestampMs: 1800, confidence: null },
      ],
    },
  ],
  broll: [],
};

export const MyComposition = () => {
  return (
    <Composition
      id="BrandReel"
      component={BrandReel}
      schema={brandReelSchema}
      defaultProps={defaultProps}
      durationInFrames={180}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      calculateMetadata={calculateMetadata}
    />
  );
};
