// Deen's Apparels · shop settings
// ------------------------------------------------------------------
// 1) FIREBASE: paste the web-app config from the Firebase console.
//    While apiKey is empty the shop runs in PREVIEW MODE: sample products,
//    and owner-page changes are saved in that browser only.
//    Backend files (database rules, tests, setup steps) live in ../backend/.
// 2) CLOUDINARY (optional, recommended with 4 photos per item): free photo
//    hosting. Empty = photos are shrunk and stored inside the product.
// 3) SHOP: WhatsApp number for orders, area, socials.
// ------------------------------------------------------------------

export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const CLOUDINARY = {
  cloudName: "",
  uploadPreset: "", // UNSIGNED preset, limited to a "deens" folder
};

export const SHOP = {
  name: "Deen's Apparels",
  // DEMO: Salim's number for now (Deen asked). Going live: Deen's WhatsApp number.
  whatsapp: "233577428684",
  currency: "GH₵",
  area: "North Legon",
  tiktok: "",    // TODO: link (empty = hidden)
  instagram: "", // TODO: link (empty = hidden)
};

export const CATEGORIES = [
  { id: "tees", label: "T-shirts" },
  { id: "shirts", label: "Shirts" },
  { id: "outerwear", label: "Jackets & hoodies" },
  { id: "bottoms", label: "Trousers & jeans" },
  { id: "shorts", label: "Shorts" },
  { id: "shoes", label: "Sneakers & shoes" },
];

export const CONDITIONS = ["New with tags", "Like new", "Very good", "Good"];
export const MAX_PHOTOS = 4;

// ---- Testing only: http://localhost…/?emulator=1 talks to the local Firebase emulator ----
const params = new URLSearchParams(location.search);
export const USE_EMULATOR =
  params.has("emulator") && ["localhost", "127.0.0.1"].includes(location.hostname);
if (USE_EMULATOR) {
  Object.assign(FIREBASE_CONFIG, { apiKey: "demo-key", authDomain: "demo-deens.firebaseapp.com", projectId: "demo-deens", appId: "demo" });
}

export const LIVE = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
