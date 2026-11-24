// Downloads jobs/<job>/ from the footage bucket and normalises it for editing.
// Run: npx tsx scripts/fetch-job.ts 2026-11-24
import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, ffmpeg, isAudio, isVideo, jobArg, jobDir } from "./lib";

const job = jobArg();
const dir = jobDir(job);
const rawDir = path.join(dir, "raw");

const s3 = new S3Client({
  endpoint: env("AWS_ENDPOINT_URL_S3"),
  region: env("AWS_REGION"),
  forcePathStyle: true,
  credentials: { accessKeyId: env("AWS_ACCESS_KEY_ID"), secretAccessKey: env("AWS_SECRET_ACCESS_KEY") },
});
const Bucket = process.env.FOOTAGE_BUCKET ?? "webzero-content-footage";

const main = async () => {
  const list = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: `jobs/${job}/` }));
  const keys = (list.Contents ?? []).map((o) => o.Key!).filter((k) => !k.endsWith("/"));
  if (keys.length === 0) throw new Error(`Nothing in ${Bucket}/jobs/${job}/`);

  for (const Key of keys) {
    const name = path.basename(Key);
    const res = await s3.send(new GetObjectCommand({ Bucket, Key }));
    const raw = path.join(rawDir, name);
    mkdirSync(rawDir, { recursive: true });
    writeFileSync(raw, Buffer.from(await res.Body!.transformToByteArray()));

    const base = name.replace(/\.[^.]+$/, "");
    if (isVideo(name)) {
      // Constant 30fps H.264 so cuts stay frame-accurate (phones record variable frame rate).
      ffmpeg(["-i", raw, "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-b:a", "192k", path.join(dir, `${base}.mp4`)]);
    } else if (isAudio(name)) {
      ffmpeg(["-i", raw, "-ac", "1", "-ar", "44100", path.join(dir, `${base}.wav`)]);
    }
    console.log(`fetched ${name}`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
