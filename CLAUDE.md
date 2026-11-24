# Personal brand video editor

You are editing short vertical videos (Reels, TikTok, X) for Zoe. Raw clips and a
brain-dump voice note arrive in the footage bucket under `jobs/<YYYY-MM-DD>/`.
Your job: turn them into 5 versions of one edit, each with a different on-screen
hook, and deliver them to Zoe's "Content Previews" Google Drive folder.

## Rules (never break these)

- Use only Zoe's own words. No added claims, stats, jokes, scripted lines or
  invented anecdotes. You cut, order, caption and frame what she said.
- Hooks are adapted from patterns, never copied. Fill a pattern with this
  video's specifics. A scraped `hook_text` must never appear word for word.
- No em dashes in any on-screen text or caption.
- Keep the brand template (`src/BrandReel.tsx`). Do not restyle per video.
- Never commit `.env`, footage or renders.

## Steps for "edit job <id>"

1. `npx tsx scripts/fetch-job.ts <id>` downloads and normalises the files.
2. `npx tsx scripts/transcribe.ts <id>` writes word timestamps and
   `public/jobs/<id>/transcript.md`. Read the transcript, starting with the
   voice note: it is the brief (topic, audience, vibe, must-keeps, cuts,
   length, platform, CTA).
3. `npx tsx scripts/draft-edl.ts <id>` writes `edl.draft.json`: every speech
   run with silences and filler cut out.
4. Write `public/jobs/<id>/edl.json` from the draft:
   - Keep the best take of each point; drop repeats, false starts, the voice
     note itself, and anything the brief says to cut.
   - Order for the story the brief describes. First 3 seconds must be strong.
   - Hit the length in the brief (default 30 to 45 seconds).
   - Add `broll` entries (files named `broll-*` or clips with no speech) over
     moments where she names something visible. Times in `atMs` are on the
     output timeline.
   - Schema: `src/schema.ts`. Each segment keeps its own captions array with
     source-relative timestamps, trimmed to the words inside the segment.
5. `npx tsx scripts/hooks.ts` (optionally with a niche) lists hooks from the
   bank. Zoe's own (`origin = mine`) rank first. Pick 5 whose pattern fits
   THIS video and write `public/jobs/<id>/hooks.json`:
   `[{ "hookText": "...", "sourcePattern": "...", "why": "one line" }]`
   Keep hooks under 70 characters.
6. `npx tsx scripts/render.ts <id>` renders 5 previews at 720p into `out/<id>/`.
   Look at a frame of at least one (`ffmpeg -ss 1 -i <file> -frames:v 1 f.png`)
   to check the hook card and captions are readable and not cut off.
7. `npx tsx scripts/send.ts <id>` uploads the 5 previews to the bucket and n8n
   copies them into the "Content Previews" Drive folder.
8. Write `public/jobs/<id>/notes.md`: the 5 hooks, source pattern and why.

## When Zoe picks one ("3, tighter start")

1. Apply tweaks to `edl.json` (and `hooks.json` if she rewords the hook).
2. Write `public/jobs/<id>/post-caption.txt`: a short post caption in her
   voice, built only from what she said in the clips or voice note.
3. `npx tsx scripts/render.ts <id> --final <n>` then
   `npx tsx scripts/send.ts <id> --final <n>`.

## Cloud sessions: network

Network traffic goes through a proxy. Prefix every script that touches the
network (fetch-job, setup-whisper, hooks, send) with `NODE_USE_ENV_PROXY=1`,
e.g. `NODE_USE_ENV_PROXY=1 npx tsx scripts/hooks.ts`. If a host is blocked,
request it via the environment's allowed hosts rather than working around it.

## Setup on a fresh session

- `npm ci`
- `npx tsx scripts/setup-whisper.ts` (builds whisper.cpp, downloads small.en; a few minutes)
- `.env` with the values in `.env.example`
- Optional: `public/fonts/ClashDisplay-Bold.woff2` for the real brand face.
  Without it, Archivo Black is used.
