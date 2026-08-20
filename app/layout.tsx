import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppButton from "@/components/WhatsAppButton";
import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PostHog from "@/components/PostHog";
import { SITE_URL, SITE_NAME, TITLE_SUFFIX, DEFAULT_DESCRIPTION } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  // metadataBase makes every relative URL in metadata — og:image, canonicals,
  // the icons above — resolve against the real site instead of the host that
  // happened to serve the request. Without it Next emits og:image as a bare
  // "/amneh.png", which Facebook/WhatsApp cannot fetch, so shared links came
  // through with no preview image; and on Vercel preview deploys it would
  // resolve to the *.vercel.app host, canonicalising previews as real pages.
  metadataBase: new URL(SITE_URL),

  // Every child page sets a short, page-specific `title` and Next fills it into
  // this template, so the brand is appended once, consistently, in one place.
  // `default` covers the home page and anything that doesn't set a title.
  title: {
    default: "Amneh | Best Skincare Brand in Pakistan",
    template: `%s | ${TITLE_SUFFIX}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,

  // Site-wide default. Individual pages override this — account/utility pages
  // set index:false via utilityPageMetadata in lib/seo.ts.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let Google use full-size image previews and untruncated text snippets.
      // The defaults are conservative and, for a visual skincare catalog, a
      // large image preview is the difference between a click and a scroll-past.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/amneh.png",
    apple: "/amneh.png",
    shortcut: "/amneh.png",
  },
  openGraph: {
    title: "Amneh | Best Skincare Brand in Pakistan",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_PK",
    images: ["/amneh.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amneh | Best Skincare Brand in Pakistan",
    description: DEFAULT_DESCRIPTION,
    images: ["/amneh.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/*
          FIX for "returning from checkout leaves the page stuck/blank".
          Runs during HTML parse — BEFORE/INDEPENDENT of React hydration —
          because the failure mode is the returned page never hydrating, so a
          React-effect handler would never run to recover it.

          When our "left-for-checkout" flag is present on pageshow (set on the
          way out by handleBuyNow for Buy Now and goToCheckout for Add to Cart →
          checkout), we force a genuinely fresh load. We do this ONLY for that
          flag, not for every bfcache restore — see the pageshow handler note.
          A plain location.reload() proved UNRELIABLE (it can still be
          served from the frozen bfcache snapshot, so the page came back stuck
          intermittently). Instead we navigate to the SAME url with a unique
          cache-busting query param (_rb=timestamp): a brand-new URL can never
          be a bfcache hit, so the browser must do a real fetch + hydrate. On
          that fresh load we strip _rb back off the URL (history.replaceState)
          so it stays clean. A loop-guard caps busts at 3 per 4s as a backstop.
          Flag key must match LEFT_FOR_CHECKOUT_KEY in components/BFCacheReload.tsx.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var KEY='amneh:left-for-checkout',RLD='amneh:reloadstamps';
  function g(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
  function s(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
  function d(k){try{sessionStorage.removeItem(k)}catch(e){}}
  function canBust(){var a=[];try{a=JSON.parse(g(RLD)||'[]')}catch(e){}var t=+new Date();a=a.filter(function(x){return t-x<4000});if(a.length>=3)return false;a.push(t);s(RLD,JSON.stringify(a));return true;}
  function bust(){try{var u=new URL(window.location.href);u.searchParams.set('_rb',String(+new Date()));window.location.replace(u.toString());}catch(e){window.location.reload();}}
  try{var cur=new URL(window.location.href);if(cur.searchParams.has('_rb')){cur.searchParams.delete('_rb');history.replaceState(null,'',cur.pathname+(cur.search||'')+cur.hash);}}catch(e){}
  // Only force a fresh load when we KNOW the shopper just came back from the
  // Shopify checkout (the flag set on the way out). We intentionally do NOT
  // reload on every bfcache restore (e.persisted): normal back-navigation and
  // app-switching on mobile trigger bfcache constantly, and force-reloading
  // each time made the site feel slow / like it kept re-loading. A plain
  // bfcache restore of our OWN pages is instant and fine — leave it alone.
  window.addEventListener('pageshow',function(e){
    if(g(KEY)){d(KEY);if(canBust())bust();}
  });
})();`,
          }}
        />
        {/*
          Swallows a noise error that is NOT from our code: in-app browsers
          (Facebook/Instagram/TikTok/Gmail on iOS) and some browser extensions
          inject their own JS that probes the iOS WKWebView native bridge
          (window.webkit.messageHandlers). Outside a real iOS WebView
          window.webkit is undefined, so their probe throws
          "undefined is not an object (evaluating 'window.webkit.messageHandlers')".
          It doesn't affect our site, but it floods analytics/error tooling
          with noise. We register an error listener HERE in <head> so it runs
          before any analytics loads (rendered later in <body>) — the
          capture-phase listener sees the event first and, for this exact
          message, stops it from propagating. We only suppress this specific
          webkit.messageHandlers probe; every other error still surfaces.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){
  function isWebkitBridgeNoise(msg){return typeof msg==='string'&&msg.indexOf('webkit.messageHandlers')!==-1;}
  window.addEventListener('error',function(e){
    if(isWebkitBridgeNoise(e&&e.message)){e.stopImmediatePropagation();e.preventDefault();return false;}
  },true);
  window.addEventListener('unhandledrejection',function(e){
    var r=e&&e.reason;var msg=r&&r.message?r.message:String(r);
    if(isWebkitBridgeNoise(msg)){e.stopImmediatePropagation();e.preventDefault();}
  },true);
})();`,
          }}
        />
        {/*
          Cuts DNS/TLS handshake time off the first request to each origin —
          kept to only origins the BROWSER itself actually talks to. Shopify
          product images and Cloudinary uploads never qualify: Shopify images
          go through Next's /_next/image proxy (the Next.js SERVER fetches
          cdn.shopify.com, not the browser), and the one place Cloudinary is
          used client-side (admin product image upload) hits a completely
          different subdomain (api.cloudinary.com, not res.cloudinary.com) —
          so preconnecting either on customer-facing pages was pure dead
          weight, confirmed by PageSpeed Insights flagging both as unused on
          every page tested.
        */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://www.facebook.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {/*
          shop.amnehofficial.com is Shopify's checkout domain — a completely
          different origin from this app that the browser has never talked to.
          Buy Now / checkout redirect there cold: fresh DNS + TLS handshake
          happening at the exact moment the customer is waiting to see a page.
          Warming the connection here means that handshake is already done by
          the time they click, instead of adding to the "checkout keeps
          loading" delay on a slow connection.
        */}
        <link rel="preconnect" href="https://shop.amnehofficial.com" />
      </head>
      <body className={`${inter.variable} font-sans bg-[#f1efef]`}>
        <MetaPixel />
        <GoogleAnalytics />
        <PostHog />
        {/*
          overflow-x-hidden lives on this wrapper, NOT <body>/<html>. Setting it
          directly on body breaks vertical scrolling entirely in Facebook's
          in-app browser (a known WebView bug) — it worked in Instagram's
          in-app browser and regular mobile browsers, but froze scroll on every
          page when opened from a Facebook ad.
        */}
        <div className="overflow-x-hidden">
          <AnnouncementBar />
          <CartProvider>
            {children}
            <CartDrawer />
            <WhatsAppButton />
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
