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
  url: string;          // cdn.shopify.com video URL
  startSec?: number;    // segment start (default 0)
  endSec?: number;      // segment end (default: video end)
  name?: string;        // creator/customer name shown as a caption
  poster?: string;      // optional thumbnail image URL shown before play
}

export const UGC_VIDEOS: UgcVideo[] = [
  // Example (delete this comment, add real ones):
   { url: "https://cdn.shopify.com/videos/c/o/v/c0521b53017543379c5d3b0e231e18e9.mp4", startSec: 0, endSec: 20, name: "@lensofan" },
   { url: "https://cdn.shopify.com/videos/c/o/v/b6e97c2b58934cf1b4253d415fb26895.mp4", startSec: 4, endSec: 36, name: "@lifewithhibs_" },
      { url: "https://cdn.shopify.com/videos/c/o/v/21597c37be254a3fbc1df2ed7e07be9d.mp4", startSec: 4, endSec: 28, name: "@looksbyridaa" },
         { url: "https://cdn.shopify.com/videos/c/o/v/62549b989d90464aa08a95f2896acea6.mp4", startSec: 0, endSec: 35, name: "@kk_fencer_official" },

   { url: "https://cdn.shopify.com/videos/c/o/v/6e44b640a23146c696c04e7de54d952e.mp4", startSec: 6, endSec: 30, name: "@fitsandflicksbywish" },
   { url: "https://cdn.shopify.com/videos/c/o/v/803319aa794948c88d59470808f8eb8f.mp4", startSec: 29, endSec: 33, name: "@soonhraniii" },
   { url: "https://cdn.shopify.com/videos/c/o/v/9cbf3833a78d44fca9943668177929ac.mp4", startSec: 18, endSec: 35, name: "@zeeeobv" },





];

// Homepage "Luminous, Nourishing Skin Care" section (components/FeatureSplit)
// — set a video here to REPLACE the product image in that section (both the
// desktop right panel and the mobile full-bleed background). Uses the same
// no-black-flash trim player (startSec/endSec) as the testimonials videos.
// Leave as null to keep the static product image.
export const FEATURE_VIDEO: UgcVideo | null = { url: "https://cdn.shopify.com/videos/c/o/v/62549b989d90464aa08a95f2896acea6.mp4", startSec: 22.5, endSec: 34.5 };

// /skincare page top banner — set a video here to REPLACE the static banner
// image (off2.webp) with a UGC clip. The banner is a wide landscape strip, so
// a vertical 9:16 reel will crop to fill (centered) — pick a clip whose
// subject stays roughly centered. Leave null to keep the static banner.
export const SKINCARE_HERO_VIDEO: UgcVideo | null = { url: "https://cdn.shopify.com/videos/c/o/v/21597c37be254a3fbc1df2ed7e07be9d.mp4", startSec: 21, endSec: 28 };