import { S3Client } from "@aws-sdk/client-s3";
import { execFileSync } from "node:child_process";
import https from "node:https";
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

// Footage bucket client. Uses Node's global HTTPS agent so that, when run with
// NODE_USE_ENV_PROXY=1, requests go through HTTPS_PROXY (needed in cloud sessions).
export const makeS3 = () =>
  new S3Client({
    endpoint: env("AWS_ENDPOINT_URL_S3"),
    region: env("AWS_REGION"),
    forcePathStyle: true,
    credentials: { accessKeyId: env("AWS_ACCESS_KEY_ID"), secretAccessKey: env("AWS_SECRET_ACCESS_KEY") },
    requestHandler: { httpsAgent: https.globalAgent },
  });
