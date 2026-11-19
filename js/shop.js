// 90's Bwoy Clothing · the shop page: items, bag, and the WhatsApp order.
import { getProducts, CATEGORIES, SHOP, LIVE, money, fromPrice, samePrice, isSoldOut, cover, categoryLabel, isNew } from "./store.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const wa = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;

let products = [];
let filter = "all";

function fadeIn(root = document) {
  root.querySelectorAll("img.fade-img:not(.loaded)").forEach((img) => {
    const show = () => img.classList.add("loaded");
    if (img.complete) show();
    else { img.addEventListener("load", show, { once: true }); img.addEventListener("error", show, { once: true }); }
  });
}

/* ---------- Bag (saved in this browser) ---------- */
const BAG_KEY = "deens-bag-v1";
let bag = [];
try { bag = JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch { bag = []; }
const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch {} };

/** Bag lines joined to current items; drops lines whose item or size has gone or sold out. */
function bagLines() {
  return bag.map((l, i) => {
    const p = products.find((x) => x.id === l.pid);
    const o = p?.options.find((x) => x.label === l.option);
    return p && o && !o.soldOut && !isSoldOut(p) ? { ...l, i, p, price: Number(o.price), pre: Boolean(p.preorder) } : null;
  }).filter(Boolean);
}
const bagTotal = () => bagLines().reduce((s, l) => s + l.price * l.qty, 0);

function addToBag(pid, option, choice, qty) {
  const same = bag.find((l) => l.pid === pid && l.option === option && l.choice === choice);
  if (same) same.qty = Math.min(10, same.qty + qty);
  else bag.push({ pid, option, choice, qty });
  saveBag(); renderBag();
}

/* ---------- Grid ---------- */
function renderChips() {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length]));
  const pre = products.some((p) => p.preorder);
  const cats = [{ id: "all", label: "All" }, ...(pre ? [{ id: "preorder", label: "Pre-order" }] : []), ...CATEGORIES.filter((c) => counts[c.id])];
  $("chips").innerHTML = cats.map((c) =>
    `<button type="button" role="tab" class="chip" data-cat="${c.id}" aria-selected="${c.id === filter}">${esc(c.label)}</button>`).join("");
}

function priceText(p) {
  return `${samePrice(p) ? "" : "<small>from</small> "}${money(fromPrice(p))}`;
}
function sizesText(p) {
  const left = p.options.filter((o) => !o.soldOut).map((o) => o.label);
  return left.length && left.join("") !== "One size" ? `Sizes ${left.join(" · ")}` : "";
}

function card(p) {
  const sold = isSoldOut(p);
  const tag = sold ? '<span class="tag tag-sold">Sold out</span>' : p.preorder ? '<span class="tag tag-pre">Pre-order</span>' : isNew(p) ? '<span class="tag">Just in</span>' : "";
  return `<article class="card${sold ? " is-sold" : ""}">
    <button type="button" class="card-btn" data-open="${esc(p.id)}" aria-label="${esc(p.name)}, ${samePrice(p) ? "" : "from "}${money(fromPrice(p))}${sold ? ", sold out" : p.preorder ? ", pre-order" : ""}">
      <span class="card-img"><img class="fade-img" src="${esc(cover(p))}" alt="" loading="lazy">${tag}
        ${p.photos.length > 1 ? `<span class="count" aria-hidden="true">${p.photos.length} photos</span>` : ""}</span>
      <span class="card-name">${esc(p.name)}</span>
      <span class="card-meta">${esc([p.condition, sold ? "" : sizesText(p)].filter(Boolean).join(" · "))}</span>
      <span class="card-price">${priceText(p)}</span>
    </button>
  </article>`;
}

function renderGrid() {
  const list = filter === "all" ? products : filter === "preorder" ? products.filter((p) => p.preorder) : products.filter((p) => p.category === filter);
  $("grid").innerHTML = list.length ? list.map(card).join("") : `<p class="loading">${filter === "all" ? "New stock is dropping soon. Check back, or ask on WhatsApp what's coming." : "Nothing here yet."}</p>`;
  $("shopCount").textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;
  fadeIn($("grid"));
}

/* ---------- Item sheet ---------- */
const sheet = $("productSheet");
let current = null, qty = 1;

function chosenOption() {
  const v = sheet.querySelector("input[name=size]:checked")?.value;
  return current.options.find((o) => o.label === v);
}
function updateTotal() {
  $("pQty").textContent = qty;
  const o = chosenOption();
  $("pTotal").textContent = o ? money(o.price * qty) : "";
  $("pAdd").disabled = !o;
}
function showPhoto(i) {
  $("pImg").src = current.photos[i];
  $("pImg").alt = `${current.name}, photo ${i + 1} of ${current.photos.length}`;
  $("pThumbs").querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", String(i === j)));
}

function openProduct(id) {
  current = products.find((p) => p.id === id);
  if (!current) return;
  qty = 1;
  const sold = isSoldOut(current);
  $("pThumbs").innerHTML = current.photos.length > 1 ? current.photos.map((src, i) =>
    `<button type="button" data-photo="${i}" aria-label="Photo ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join("") : "";
  showPhoto(0);
  $("pCat").textContent = categoryLabel(current.category);
  $("pName").textContent = current.name;
  $("pCond").textContent = current.condition ? `Condition: ${current.condition}` : "";
  $("pCond").hidden = !current.condition;
  $("pPre").hidden = !current.preorder || sold;
  $("pDesc").textContent = current.description;
  $("pDesc").hidden = !current.description;
  const firstFree = current.options.findIndex((o) => !o.soldOut);
  const showPrice = !samePrice(current);
  $("pSizeList").innerHTML = current.options.map((o, i) => `
    <label class="pill${o.soldOut ? " is-out" : ""}"><input type="radio" name="size" value="${esc(o.label)}"${o.soldOut ? " disabled" : ""}${i === firstFree ? " checked" : ""}>
      <span>${esc(o.label)}${showPrice ? ` <small>${money(o.price)}</small>` : ""}${o.soldOut ? ' <small>sold out</small>' : ""}</span></label>`).join("");
  $("pChoices").hidden = !current.choices.length;
  $("pChoiceTitle").textContent = current.choiceTitle || "Colour";
  $("pChoiceList").innerHTML = current.choices.map((c, i) =>
    `<label class="pill"><input type="radio" name="choice" value="${esc(c)}"${i === 0 ? " checked" : ""}><span>${esc(c)}</span></label>`).join("");
  $("pBuy").hidden = sold;
  $("pPreNote").hidden = !current.preorder || sold;
  $("pAddLabel").textContent = current.preorder ? "Pre-order" : "Add to bag";
  $("pSold").hidden = !sold;
  $("pAskWa").href = wa(`Hello ${SHOP.name}! I'd like to pre-order the ${current.name}.\n*Size / waist:* \nPlease let me know if you can bring it in. Thank you!`);
  updateTotal();
  sheet.showModal();
  sheet.querySelector(".sheet-in").scrollTop = 0;
}

sheet.addEventListener("change", (e) => { if (e.target.name === "size") updateTotal(); });
sheet.addEventListener("click", (e) => {
  const q = e.target.closest("[data-q]");
  if (q) { qty = Math.max(1, Math.min(10, qty + Number(q.dataset.q))); updateTotal(); }
  const ph = e.target.closest("[data-photo]");
  if (ph) showPhoto(Number(ph.dataset.photo));
  if (e.target === sheet) sheet.close();
});
$("pAdd").addEventListener("click", () => {
  const o = chosenOption();
  if (!o) return;
  const choice = sheet.querySelector("input[name=choice]:checked")?.value || "";
  addToBag(current.id, o.label, current.choices.length ? choice : "", qty);
  sheet.close();
  toast(`${current.preorder ? "Pre-order added" : "Added"}: ${current.name} (${o.label})`);
});

/* ---------- Bag drawer ---------- */
const drawer = $("bag");
function renderBag() {
  const lines = bagLines();
  const count = lines.reduce((s, l) => s + l.qty, 0);
  $("bagCount").textContent = count;
  $("bagCount").hidden = !count;
  $("bagBtn").setAttribute("aria-label", `Open your bag, ${count} item${count === 1 ? "" : "s"}`);
  $("floatBag").hidden = !count;
  $("floatTotal").textContent = money(bagTotal());
  $("bagEmpty").hidden = !!lines.length;
  $("checkout").hidden = !lines.length || !$("sent").hidden;
  $("bagList").innerHTML = lines.map((l) => `
    <li class="line">
      <img src="${esc(cover(l.p))}" alt="">
      <div class="line-info">
        <b>${esc(l.p.name)}</b>
        <span>${l.option === "One size" ? "" : "Size "}${esc([l.option, l.choice].filter(Boolean).join(" · "))}${l.pre ? ' · <i class="pre-badge">Pre-order</i>' : ""}</span>
        <span class="line-price">${money(l.price * l.qty)}</span>
      </div>
      <div class="qty small-qty">
        <button type="button" data-line="${l.i}" data-d="-1" aria-label="${l.qty === 1 ? "Remove" : "One less"} ${esc(l.p.name)}">${l.qty === 1 ? "×" : "−"}</button>
        <output>${l.qty}</output>
        <button type="button" data-line="${l.i}" data-d="1" aria-label="One more ${esc(l.p.name)}">+</button>
      </div>
    </li>`).join("");
  $("bagTotal").textContent = money(bagTotal());
}
$("bagList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-line]");
  if (!b) return;
  const line = bag[Number(b.dataset.line)];
  line.qty = Math.min(10, line.qty + Number(b.dataset.d));
  if (line.qty <= 0) bag.splice(bag.indexOf(line), 1);
  saveBag(); renderBag();
});

const openBag = () => { $("sent").hidden = true; renderBag(); drawer.showModal(); };
$("bagBtn").addEventListener("click", openBag);
$("floatBag").addEventListener("click", openBag);
$("bagClose").addEventListener("click", () => drawer.close());
$("bagShop").addEventListener("click", () => { drawer.close(); $("shop").scrollIntoView(); });
drawer.addEventListener("click", (e) => { if (e.target === drawer) drawer.close(); });

const checkout = $("checkout");
checkout.addEventListener("change", (e) => {
  if (e.target.name === "how") $("areaField").hidden = e.target.value !== "Delivery";
});
checkout.querySelectorAll("input").forEach((el) => el.addEventListener("input", () => {
  el.classList.remove("invalid");
  if (!checkout.querySelector(".invalid")) $("cErr").textContent = "";
}));

/** The WhatsApp message Deen receives. In-stock items and pre-orders are listed separately. */
export function orderText(lines, { name, how, area, note }) {
  const row = (l, n) => {
    const what = [l.option === "One size" ? l.option : `size ${l.option}`, l.choice].filter(Boolean).join(", ");
    return `${n}. ${l.p.name} (${what}) × ${l.qty} = ${money(l.price * l.qty)}`;
  };
  const now = lines.filter((l) => !l.pre), pre = lines.filter((l) => l.pre);
  const out = [`Hello ${SHOP.name}! I'd like to order:`, ""];
  now.forEach((l, i) => out.push(row(l, i + 1)));
  if (pre.length) {
    if (now.length) out.push("");
    out.push("*Pre-order (50% deposit):*");
    pre.forEach((l, i) => out.push(row(l, now.length + i + 1)));
  }
  out.push("", `*Items total:* ${money(lines.reduce((s, l) => s + l.price * l.qty, 0))}`);
  out.push(how === "Delivery" ? `*Delivery to:* ${area}` : "*Pick up*");
  out.push(`*Name:* ${name}`);
  if (note) out.push(`*Note:* ${note}`);
  out.push("", how === "Delivery" ? "Please confirm my order, the delivery fee and how to pay. Thank you!" : "Please confirm my order, how to pay and where to pick up. Thank you!");
  return out.join("\n");
}

checkout.addEventListener("submit", (e) => {
  e.preventDefault();
  const how = checkout.how.value;
  const name = $("cName").value.trim(), area = $("cArea").value.trim(), note = $("cNote").value.trim();
  const missing = [];
  if (!name) missing.push($("cName"));
  if (how === "Delivery" && !area) missing.push($("cArea"));
  if (missing.length) {
    missing.forEach((el) => el.classList.add("invalid"));
    $("cErr").textContent = missing.length === 2 ? "Please add your name and delivery area." :
      missing[0].id === "cName" ? "Please add your name." : "Please add your delivery area.";
    missing[0].focus();
    return;
  }
  $("cErr").textContent = "";
  window.open(wa(orderText(bagLines(), { name, how, area, note })), "_blank", "noopener");
  checkout.hidden = true;
  $("sent").hidden = false;
});
$("clearBag").addEventListener("click", () => { bag = []; saveBag(); checkout.reset(); $("areaField").hidden = false; renderBag(); drawer.close(); toast("Thanks for your order!"); });
$("keepBag").addEventListener("click", () => { $("sent").hidden = true; renderBag(); });

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- Start ---------- */
$("chips").addEventListener("click", (e) => {
  const c = e.target.closest("[data-cat]");
  if (!c) return;
  filter = c.dataset.cat;
  renderChips(); renderGrid();
});
document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]");
  if (o) openProduct(o.dataset.open);
});

async function load() {
  $("loadErr").hidden = true;
  try {
    products = await getProducts();
  } catch {
    $("grid").innerHTML = "";
    $("loadErr").hidden = false;
    return;
  }
  renderChips(); renderGrid(); renderBag();
  const pick = products.find((p) => !isSoldOut(p) && !p.preorder);
  if (pick) {
    $("pickImg").src = cover(pick);
    $("pickName").textContent = pick.name;
    $("pickPrice").innerHTML = priceText(pick);
    $("pick").dataset.open = pick.id;
    $("pick").hidden = false;
  }
}
$("retry").addEventListener("click", load);

$("previewStrip").hidden = LIVE;
$("askWa").href = wa(`Hello ${SHOP.name}! I have a question.`);
$("preWa").href = wa(`Hello ${SHOP.name}! When is the next restock? I'm looking for: `);
for (const k of ["snapchat", "tiktok", "instagram"]) if (SHOP[k]) { $(k).href = SHOP[k]; $(k).hidden = false; }
$("year").textContent = new Date().getFullYear();
const header = $("header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
fadeIn();
load();
