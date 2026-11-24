// Renders one video per hook from edl.json + hooks.json.
//   Previews (720p, fast):  npx tsx scripts/render.ts 2026-11-24
//   Final (1080p, one hook): npx tsx scripts/render.ts 2026-11-24 --final 3
// hooks.json = [{ "hookText": "...", "sourcePattern": "...", "why": "..." }, ...]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { jobArg, jobDir } from "./lib";

const job = jobArg();
const dir = jobDir(job);
const finalIdx = process.argv.includes("--final") ? Number(process.argv[process.argv.indexOf("--final") + 1]) : null;

type Hook = { hookText: string; sourcePattern?: string; why?: string };

const main = async () => {
  const edl = JSON.parse(readFileSync(path.join(dir, "edl.json"), "utf8"));
  const hooks: Hook[] = JSON.parse(readFileSync(path.join(dir, "hooks.json"), "utf8"));
  const outDir = path.join("out", job);
  mkdirSync(outDir, { recursive: true });

  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const targets = finalIdx ? [finalIdx] : hooks.map((_, i) => i + 1);

  for (const n of targets) {
    const hook = hooks[n - 1];
    if (!hook) throw new Error(`No hook #${n} in hooks.json`);
    const inputProps = { ...edl, hookText: hook.hookText };
    writeFileSync(path.join(dir, `variant-${n}.json`), JSON.stringify(inputProps, null, 2));

    const composition = await selectComposition({ serveUrl, id: "BrandReel", inputProps });
    const outputLocation = path.join(outDir, finalIdx ? `final-hook-${n}.mp4` : `preview-hook-${n}.mp4`);
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      inputProps,
      outputLocation,
      scale: finalIdx ? 1 : 2 / 3, // 720x1280 previews, 1080x1920 final
      crf: finalIdx ? 18 : 26,
    });
    console.log(`rendered ${outputLocation}`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
