// Transcribes every clip and voice note in a job with whisper.cpp (CPU, no GPU needed).
// Writes captions/<file>.json (word timestamps, relative to that file) and transcript.md
// (a readable version with timestamps, for the agent to plan the edit from).
// Run: npx tsx scripts/transcribe.ts 2026-11-24
import type { Caption } from "@remotion/captions";
import { toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ffmpeg, isAudio, isVideo, jobArg, jobDir } from "./lib";
import { WHISPER_DIR, WHISPER_MODEL, WHISPER_VERSION } from "./setup-whisper";

const job = jobArg();
const dir = jobDir(job);
const capDir = path.join(dir, "captions");
mkdirSync(capDir, { recursive: true });

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 100))}`;

// whisper.cpp returns sub-word tokens ("U", "mm"). Merge them into whole words
// (a new word starts with a space) and drop markers like [BLANK_AUDIO].
const toWords = (tokens: Caption[]): Caption[] => {
  const words: Caption[] = [];
  let inMarker = false;
  for (const t of tokens) {
    if (t.text.includes("[")) inMarker = true;
    if (inMarker) {
      if (t.text.includes("]")) inMarker = false;
      continue;
    }
    if (!t.text.trim()) continue;
    const prev = words.at(-1);
    if (prev && !t.text.startsWith(" ")) {
      prev.text += t.text;
      prev.endMs = t.endMs;
    } else {
      words.push({ ...t, text: t.text.startsWith(" ") || !prev ? t.text : ` ${t.text}` });
    }
  }
  return words;
};

const main = async () => {
  const files = readdirSync(dir).filter((f) => isVideo(f) || isAudio(f)).sort();
  let md = `# Transcript for job ${job}\n\nTimes are relative to each file. Lines break on pauses longer than 0.6s.\n`;

  for (const f of files) {
    const wav = path.join("/tmp", `${f}.16k.wav`);
    ffmpeg(["-i", path.join(dir, f), "-ar", "16000", "-ac", "1", wav]);
    const out = await transcribe({
      inputPath: wav,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      model: WHISPER_MODEL,
      modelFolder: WHISPER_DIR,
      tokenLevelTimestamps: true,
    });
    const captions = toWords(toCaptions({ whisperCppOutput: out }).captions);
    writeFileSync(path.join(capDir, `${f}.json`), JSON.stringify(captions, null, 2));

    md += `\n## ${f}${isAudio(f) ? " (voice note = the brief)" : ""}\n\n`;
    let line = "";
    let lineStart = captions[0]?.startMs ?? 0;
    captions.forEach((c, i) => {
      const prev = captions[i - 1];
      if (prev && c.startMs - prev.endMs > 600) {
        md += `- [${fmt(lineStart)} to ${fmt(prev.endMs)}] ${line.trim()}\n`;
        line = "";
        lineStart = c.startMs;
      }
      line += c.text;
    });
    if (line) md += `- [${fmt(lineStart)} to ${fmt(captions.at(-1)!.endMs)}] ${line.trim()}\n`;
    console.log(`transcribed ${f} (${captions.length} words)`);
  }
  writeFileSync(path.join(dir, "transcript.md"), md);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
