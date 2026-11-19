// 90's Bwoy Clothing (Deen) · shop settings
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
  name: "90's Bwoy Clothing",
  // DEMO: Salim's number for now (Deen asked). Going live: Deen's WhatsApp 233558338483 (055 833 8483).
  whatsapp: "233577428684",
  currency: "GH₵",
  area: "Accra",
  snapchat: "https://www.snapchat.com/add/deen_salim23",
  tiktok: "",    // none yet (empty = hidden)
  instagram: "", // none yet (empty = hidden)
};

export const CATEGORIES = [
  { id: "tees", label: "Graphic tees" },
  { id: "jackets", label: "Jackets" },
  { id: "hoodies", label: "Hoodies" },
  { id: "jeans", label: "Baggy jeans" },
  { id: "shorts", label: "Shorts" },
  { id: "sneakers", label: "Sneakers" },
  { id: "caps", label: "Caps" },
  { id: "bags", label: "Bags" },
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
