// Delivers rendered videos to Zoe's "Content Previews" Google Drive folder.
// Uploads to the footage bucket under renders/<job>/, then pings the n8n
// "Previews to Drive" workflow, which copies them into Drive. No Google keys needed here.
//   Previews: npx tsx scripts/send.ts 2026-11-24
//   Final:    npx tsx scripts/send.ts 2026-11-24 --final 3
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env, jobArg, jobDir } from "./lib";

const job = jobArg();
const dir = jobDir(job);
const finalIdx = process.argv.includes("--final") ? Number(process.argv[process.argv.indexOf("--final") + 1]) : null;
const Bucket = process.env.FOOTAGE_BUCKET ?? "webzero-content-footage";
const WEBHOOK = process.env.PREVIEWS_WEBHOOK ?? "https://n8n.apps.joinwebzero.com/webhook/wz-previews-ready-4m8x2c";

const s3 = new S3Client({
  endpoint: env("AWS_ENDPOINT_URL_S3"),
  region: env("AWS_REGION"),
  forcePathStyle: true,
  credentials: { accessKeyId: env("AWS_ACCESS_KEY_ID"), secretAccessKey: env("AWS_SECRET_ACCESS_KEY") },
});

// Drive file names: "2026-11-24 hook 3 - Bought a bus on Facebook.mp4"
const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").slice(0, 60).trim();

const main = async () => {
  const hooks = JSON.parse(readFileSync(path.join(dir, "hooks.json"), "utf8")) as { hookText: string }[];
  const targets = finalIdx ? [finalIdx] : hooks.map((_, i) => i + 1);
  const files: { key: string; name: string }[] = [];

  for (const n of targets) {
    const local = path.join("out", job, finalIdx ? `final-hook-${n}.mp4` : `preview-hook-${n}.mp4`);
    if (!existsSync(local)) throw new Error(`Missing ${local}; run render.ts first`);
    const key = `renders/${job}/${path.basename(local)}`;
    await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: readFileSync(local), ContentType: "video/mp4" }));
    const label = finalIdx ? "FINAL" : `hook ${n}`;
    files.push({ key, name: `${job} ${label} - ${safe(hooks[n - 1]?.hookText ?? "")}.mp4` });
    console.log(`uploaded ${key}`);
  }

  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ job, files }),
  });
  if (!res.ok) throw new Error(`Previews webhook ${res.status}: ${await res.text()}`);
  console.log(`sent ${files.length} video(s) to the Content Previews Drive folder`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
