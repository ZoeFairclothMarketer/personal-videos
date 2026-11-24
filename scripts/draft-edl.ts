// Builds a first-pass edit (edl.draft.json): every clip in filename order, cut into
// speech runs with silences over 0.4s removed and filler words dropped at the edges.
// The agent then turns this into edl.json by picking the best takes and adding B-roll.
// Run: npx tsx scripts/draft-edl.ts 2026-11-24
import type { Caption } from "@remotion/captions";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isVideo, jobArg, jobDir } from "./lib";

const FILLERS = new Set(["um", "umm", "uh", "uhh", "erm", "uhm", "ah", "hmm", "mm"]);
const GAP_MS = 400;
const PAD_MS = 120;

const job = jobArg();
const dir = jobDir(job);
const clean = (w: string) => w.trim().toLowerCase().replace(/[^a-z]/g, "");

const segments: unknown[] = [];
for (const f of readdirSync(dir).filter(isVideo).sort()) {
  const capPath = path.join(dir, "captions", `${f}.json`);
  if (!existsSync(capPath)) continue;
  const words = (JSON.parse(readFileSync(capPath, "utf8")) as Caption[]).filter((w) => w.text.trim() && !FILLERS.has(clean(w.text)));

  let run: Caption[] = [];
  const flush = () => {
    if (run.length < 2) return void (run = []);
    const startMs = Math.max(0, run[0].startMs - PAD_MS);
    const endMs = run.at(-1)!.endMs + PAD_MS;
    segments.push({ src: `jobs/${job}/${f}`, startMs, endMs, captions: run });
    run = [];
  };
  for (const w of words) {
    if (run.length && w.startMs - run.at(-1)!.endMs > GAP_MS) flush();
    run.push(w);
  }
  flush();
}

writeFileSync(path.join(dir, "edl.draft.json"), JSON.stringify({ segments, broll: [] }, null, 2));
console.log(`draft edit: ${segments.length} segments -> ${path.join(dir, "edl.draft.json")}`);
