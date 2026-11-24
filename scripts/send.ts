// Sends rendered videos to the content group chat on Telegram.
//   Previews: npx tsx scripts/send.ts 2026-11-24
//   Final:    npx tsx scripts/send.ts 2026-11-24 --final 3
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env, jobArg, jobDir } from "./lib";

const job = jobArg();
const dir = jobDir(job);
const finalIdx = process.argv.includes("--final") ? Number(process.argv[process.argv.indexOf("--final") + 1]) : null;
const token = env("TELEGRAM_BOT_TOKEN");
const chatId = env("TELEGRAM_CHAT_ID");
const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;

const sendMessage = (text: string) =>
  fetch(api("sendMessage"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text }) });

const sendVideo = async (file: string, caption: string) => {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption.slice(0, 1024));
  form.append("supports_streaming", "true");
  form.append("video", new Blob([readFileSync(file)], { type: "video/mp4" }), path.basename(file));
  const res = await fetch(api("sendVideo"), { method: "POST", body: form });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
};

const main = async () => {
  const hooks = JSON.parse(readFileSync(path.join(dir, "hooks.json"), "utf8")) as { hookText: string; why?: string }[];
  if (finalIdx) {
    const file = path.join("out", job, `final-hook-${finalIdx}.mp4`);
    const caption = existsSync(path.join(dir, "post-caption.txt")) ? readFileSync(path.join(dir, "post-caption.txt"), "utf8") : "";
    await sendVideo(file, `FINAL (${job}) hook ${finalIdx}\n\n${caption}`);
    return;
  }
  await sendMessage(`Job ${job}: ${hooks.length} hook versions coming. Reply with the number you want plus any tweaks.`);
  for (let i = 0; i < hooks.length; i++) {
    const file = path.join("out", job, `preview-hook-${i + 1}.mp4`);
    await sendVideo(file, `${i + 1}. ${hooks[i].hookText}${hooks[i].why ? `\n\nWhy: ${hooks[i].why}` : ""}`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
