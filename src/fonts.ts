import "@fontsource/archivo-black";
import "@fontsource/inter/800.css";
import { staticFile } from "remotion";

// Drop ClashDisplay-Bold.woff2 into public/fonts/ to use the real brand face.
// If the file is missing, loading fails quietly and Archivo Black is used.
export const loadBrandFonts = async () => {
  try {
    const url = staticFile("fonts/ClashDisplay-Bold.woff2");
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return;
    const face = new FontFace("Clash Display", `url(${url})`, { weight: "700" });
    await face.load();
    document.fonts.add(face);
  } catch {
    // fall back to Archivo Black
  }
  await document.fonts.load("700 80px 'Archivo Black'").catch(() => undefined);
  await document.fonts.load("800 64px 'Inter'").catch(() => undefined);
};
