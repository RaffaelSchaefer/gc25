import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

/*
 * Generate PWA icons from base logo.png in public/.
 * Creates standard and maskable variants.
 */

const SIZES = [192, 256, 384, 512, 1024];

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function generate() {
  const root = path.resolve(__dirname, "..");
  const publicDir = path.join(root, "public");
  const iconsDir = path.join(publicDir, "icons");
  const source = path.join(publicDir, "logo.png");

  try {
    await fs.access(source);
  } catch {
    console.error("Source logo not found at", source);
    process.exit(1);
  }

  await ensureDir(iconsDir);

  const buffer = await fs.readFile(source);

  // Clean old icons
  try {
    const existing = await fs.readdir(iconsDir);
    await Promise.all(
      existing
        .filter((f) => f.startsWith("icon-") && f.endsWith(".png"))
        .map((f) => fs.unlink(path.join(iconsDir, f))),
    );
  } catch {
    /* ignore */
  }

  for (const size of SIZES) {
    const normalPath = path.join(iconsDir, `icon-${size}.png`);
    const maskablePath = path.join(iconsDir, `icon-${size}-maskable.png`);
    // Normal icon (square, white background if transparency missing)
    await sharp(buffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(normalPath);

    // Maskable icon: center resized (80% area) on transparent canvas
    const safe = Math.round(size * 0.8);
    const resized = await sharp(buffer)
      .resize(safe, safe, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: resized,
          top: Math.round((size - safe) / 2),
          left: Math.round((size - safe) / 2),
        },
      ])
      .png()
      .toFile(maskablePath);

    console.log(
      `Generated ${path.basename(normalPath)} and ${path.basename(maskablePath)}`,
    );
  }

  console.log("Done.");
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
