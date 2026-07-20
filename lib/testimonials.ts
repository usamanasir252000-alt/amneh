// Brand testimonials & UGC video config.
//
// WRITTEN reviews are pulled LIVE from Judge.me (via /api/reviews) by the
// Testimonials component — you don't list them here.
//
// UGC VIDEOS are listed below. Workflow:
//   1. Download the reel/clip from Instagram.
//   2. Upload it in Shopify Admin → Content → Files, copy its cdn.shopify.com URL.
//   3. Add an entry here with that URL.
//
// TRIMMING WITHOUT EDITING THE FILE: you don't need to cut the video — set
// `startSec` / `endSec` to the slice you want shown, and the player only ever
// plays that segment (loops within it). e.g. a 40s reel where the good bit is
// 8s-18s → { startSec: 8, endSec: 18 }. Omit both to play the whole thing.
//
// The whole Testimonials section auto-hides if there are no videos here AND
// no published Judge.me reviews — it never renders empty.

export interface UgcVideo {
  url: string; // cdn.shopify.com video URL
  startSec?: number; // segment start (default 0)
  endSec?: number; // segment end (default: video end)
  name?: string; // creator/customer name shown as a caption
  poster?: string; // optional thumbnail image URL shown before play
}

export const UGC_VIDEOS: UgcVideo[] = [
  // Example (delete this comment, add real ones):
  { url: "/videos/ugc-1.mp4", name: "@lensofan" },
  { url: "/videos/ugc-2.mp4", name: "@lifewithhibs_" },
  { url: "/videos/ugc-3.mp4", name: "@looksbyridaa" },
  { url: "/videos/ugc-4.mp4", name: "@kk_fencer_official" },

  { url: "/videos/ugc-5.mp4", name: "@fitsandflicksbywish" },
  { url: "/videos/ugc-6.mp4", name: "@soonhraniii" },
  { url: "/videos/ugc-7.mp4", name: "@zeeeobv" },





];

// Homepage "Luminous, Nourishing Skin Care" section (components/FeatureSplit)
// — set a video here to REPLACE the product image in that section (both the
// desktop right panel and the mobile full-bleed background). Leave null to
// keep the static product image.
//
// SELF-HOSTED + PRE-TRIMMED: this is the exact 12s segment, cut to start at 0,
// re-encoded with faststart (moov atom up front) and served from our own
// /public. The Shopify original was a 6.7 MB full clip trimmed at runtime to
// start at 22.5s — the browser had to fetch metadata + seek + buffer before
// anything showed (the "video keeps loading" lag). Now it's a 2.4 MB file that
// starts at frame 0 and plays before it finishes downloading. Same 720×1280
// resolution — no quality loss. No startSec/endSec: it IS the segment.
export const FEATURE_VIDEO: UgcVideo | null = { url: "/videos/feature.mp4" };

// /skincare page top banner — set a video here to REPLACE the static banner
// image (off2.webp) with a UGC clip. The banner is a wide landscape strip, so
// a vertical 9:16 reel will crop to fill (centered). Leave null to keep the
// static banner. Self-hosted + pre-trimmed (see FEATURE_VIDEO note above): the
// 6 MB / seek-to-21s Shopify original is now a 1.2 MB faststart clip that plays
// from frame 0 — same 720×1280 resolution, near-instant start.
// poster = the video's own first frame (extracted with ffmpeg, 40 KB JPG). It
// paints INSTANTLY as the hero while the .mp4 downloads — so a visitor from a
// slow Facebook in-app browser sees a real image immediately instead of the
// grey gradient placeholder they used to stare at for ~5s before bouncing.
export const SKINCARE_HERO_VIDEO: UgcVideo | null = {
  url: "/videos/skincare-hero.mp4",
  poster: "/videos/skincare-hero-poster.jpg",
};