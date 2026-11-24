import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

if (existsSync(".env")) process.loadEnvFile(".env");

export const env = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env (see .env.example)`);
  return v;
};

export const jobArg = (): string => {
  const job = process.argv[2];
  if (!job) throw new Error("Pass the job id, e.g. 2026-11-24");
  return job;
};

// Everything for a job lives in public/jobs/<job>/ so Remotion can staticFile() it.
export const jobDir = (job: string) => {
  const dir = path.join("public", "jobs", job);
  mkdirSync(dir, { recursive: true });
  return dir;
};

export const ffmpeg = (args: string[]) =>
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });

export const isVideo = (f: string) => /\.(mp4|mov|m4v|webm)$/i.test(f);
export const isAudio = (f: string) => /\.(ogg|oga|m4a|mp3|wav)$/i.test(f);
