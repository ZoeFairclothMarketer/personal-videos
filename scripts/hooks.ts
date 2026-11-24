// Prints candidate hooks from the Neon hook bank as JSON.
// Your own proven hooks (origin='mine') rank first, then scraped outliers.
// Uses Neon's serverless driver (queries over HTTPS), so it works through the
// cloud session's proxy. Run with NODE_USE_ENV_PROXY=1 in cloud sessions.
// Run: npx tsx scripts/hooks.ts            (all niches)
//      npx tsx scripts/hooks.ts "crypto marketing"
import { neon } from "@neondatabase/serverless";
import { env } from "./lib";

const niche = process.argv[2] ?? null;

const main = async () => {
  const sql = neon(env("DATABASE_URL"));
  const rows = await sql.query(
    `select hook_text, hook_pattern, hook_type, niche, origin, views, outlier_ratio, my_retention
       from hooks
      where ($1::text is null or niche = $1)
      order by (origin = 'mine') desc,
               coalesce(my_retention, 0) desc,
               coalesce(outlier_ratio, 0) desc,
               coalesce(views, 0) desc
      limit 60`,
    [niche],
  );
  console.log(JSON.stringify(rows, null, 2));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
