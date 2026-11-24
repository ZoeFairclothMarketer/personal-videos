// One-time: builds whisper.cpp and downloads the model into ./whisper.cpp
// Run: npx tsx scripts/setup-whisper.ts
import { downloadWhisperModel, installWhisperCpp } from "@remotion/install-whisper-cpp";
import path from "node:path";

export const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");
export const WHISPER_VERSION = "1.5.5";
export const WHISPER_MODEL = "small.en" as const;

const main = async () => {
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR });
  console.log("whisper.cpp ready");
};

if (process.argv[1]?.endsWith("setup-whisper.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
