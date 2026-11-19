// 90's Bwoy Clothing · owner page: add, edit, sell out (whole item or one size), pre-order, hide, delete.
import { LIVE, CATEGORIES, CONDITIONS, MAX_PHOTOS, getProducts, saveProduct, setFlags, deleteProduct, uploadPhoto, resetPreview,
  onOwner, signIn, signOut, money, fromPrice, samePrice, isSoldOut, cover, categoryLabel } from "./store.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let products = [];
let show = "all";

let tt;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- List ---------- */
const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "pre", label: "Pre-order", test: (p) => p.preorder },
  { id: "sold", label: "Sold out", test: (p) => isSoldOut(p) },
  { id: "hidden", label: "Hidden", test: (p) => p.hidden },
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, test: (p) => p.category === c.id })),
];

function render() {
  const sold = products.filter(isSoldOut).length, hidden = products.filter((p) => p.hidden).length, pre = products.filter((p) => p.preorder).length;
  $("stats").textContent = `${products.length} item${products.length === 1 ? "" : "s"} · ${sold} sold out · ${pre} pre-order · ${hidden} hidden`;
  $("chips").innerHTML = FILTERS.map((f) =>
    `<button type="button" class="chip" role="tab" data-show="${f.id}" aria-selected="${f.id === show}">${esc(f.label)}</button>`).join("");
  const list = products.filter(FILTERS.find((x) => x.id === show).test);
  $("plist").innerHTML = list.length ? list.map((p) => `
    <li class="prow${p.hidden ? " is-hidden" : ""}">
      <button type="button" class="prow-main" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">
        ${cover(p) ? `<img src="${esc(cover(p))}" alt="">` : `<span class="nophoto">No photo</span>`}
        <span class="prow-info">
          <b>${esc(p.name)}</b>
          <span>${esc(categoryLabel(p.category))} · ${samePrice(p) ? "" : "from "}${money(fromPrice(p))}</span>
          <span class="sizes">${p.options.map((o) => o.soldOut ? `<s>${esc(o.label)}</s>` : esc(o.label)).join(" · ")}</span>
          <span class="badges">${isSoldOut(p) ? '<i class="b-sold">Sold out</i>' : ""}${p.preorder ? '<i class="b-pre">Pre-order</i>' : ""}${p.hidden ? '<i class="b-hidden">Hidden</i>' : ""}</span>
        </span>
        <span class="edit-hint" aria-hidden="true">Edit</span>
      </button>
      <div class="prow-tools">
        <label class="switch small"><input type="checkbox" data-flag="soldOut" data-id="${esc(p.id)}"${p.soldOut ? " checked" : ""}><span></span> Sold out</label>
        <label class="switch small"><input type="checkbox" data-flag="show" data-id="${esc(p.id)}"${p.hidden ? "" : " checked"}><span></span> On shop</label>
      </div>
    </li>`).join("") : `<li class="muted empty">Nothing here.</li>`;
}

async function reload() {
  try {
    products = await getProducts({ all: true });
    render();
  } catch {
    $("plist").innerHTML = `<li class="err">Couldn't load your stock. Check your internet and refresh.</li>`;
  }
}

$("chips").addEventListener("click", (e) => {
  const c = e.target.closest("[data-show]");
  if (c) { show = c.dataset.show; render(); }
});

$("plist").addEventListener("change", async (e) => {
  const box = e.target.closest("[data-flag]");
  if (!box) return;
  const p = products.find((x) => x.id === box.dataset.id);
  const flags = box.dataset.flag === "soldOut" ? { soldOut: box.checked } : { hidden: !box.checked };
  box.disabled = true;
  try {
    Object.assign(p, await setFlags(p, flags));
    toast(box.dataset.flag === "soldOut" ? (box.checked ? `${p.name} is sold out` : `${p.name} is back in stock`)
      : (box.checked ? `${p.name} is on the shop` : `${p.name} is hidden`));
    render();
  } catch (err) {
    box.checked = !box.checked;
    box.disabled = false;
    toast(err.message || "Couldn't save. Try again.");
  }
});

/* ---------- Editor ---------- */
const ed = $("editor");
let editing = null;
let photos = [];
let choices = [];

$("edCat").innerHTML = `<option value="">Choose…</option>` + CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("");
$("edCond").innerHTML = `<option value="">Not shown</option>` + CONDITIONS.map((c) => `<option>${esc(c)}</option>`).join("");

function optionRow(o = { label: "", price: "", soldOut: false }) {
  const row = document.createElement("div");
  row.className = "opt-row";
  row.innerHTML = `
    <label class="field">Size<input class="o-label" maxlength="20" placeholder="M" value="${esc(o.label)}"></label>
    <label class="field">Price (GH₵)<input class="o-price" type="number" inputmode="decimal" min="0" step="0.5" placeholder="120" value="${esc(o.price)}"></label>
    <label class="o-out">Out<input type="checkbox" class="o-sold"${o.soldOut ? " checked" : ""}></label>
    <button type="button" class="o-del" aria-label="Remove this size">×</button>`;
  $("edOptions").append(row);
  return row;
}
$("addOption").addEventListener("click", () => {
  // New size starts with the same price as the last one (most thrift items are one price)
  const last = [...$("edOptions").querySelectorAll(".o-price")].pop()?.value || "";
  optionRow({ label: "", price: last, soldOut: false }).querySelector("input").focus();
});
$("edOptions").addEventListener("click", (e) => {
  if (!e.target.closest(".o-del")) return;
  if ($("edOptions").children.length > 1) e.target.closest(".opt-row").remove();
  else e.target.closest(".opt-row").querySelectorAll("input").forEach((i) => (i.type === "checkbox" ? (i.checked = false) : (i.value = "")));
});

function renderChoices() {
  $("edChoices").innerHTML = choices.map((c, i) =>
    `<span class="tag-chip">${esc(c)}<button type="button" data-rm="${i}" aria-label="Remove ${esc(c)}">×</button></span>`).join("");
}
function addChoice() {
  const v = $("edChoiceInput").value.trim();
  if (v && !choices.includes(v)) { choices.push(v); renderChoices(); }
  $("edChoiceInput").value = "";
}
$("addChoice").addEventListener("click", () => { addChoice(); $("edChoiceInput").focus(); });
$("edChoiceInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addChoice(); } });
$("edChoices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (b) { choices.splice(Number(b.dataset.rm), 1); renderChoices(); }
});

/* photos */
function renderPhotos() {
  $("edPhotos").innerHTML = photos.map((src, i) => `
    <div class="ph"><img src="${esc(src)}" alt="Photo ${i + 1}">
      <button type="button" class="rm" data-rmph="${i}" aria-label="Remove photo ${i + 1}">×</button>
      ${i > 0 ? `<button type="button" class="mv" data-cover="${i}">Make cover</button>` : ""}</div>`).join("");
  $("photoBtn").hidden = photos.length >= MAX_PHOTOS;
  $("photoLabel").textContent = photos.length ? `📷 Add more (${MAX_PHOTOS - photos.length} left)` : `📷 Add photos (up to ${MAX_PHOTOS})`;
}
$("edPhotos").addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rmph]"), cv = e.target.closest("[data-cover]");
  if (rm) photos.splice(Number(rm.dataset.rmph), 1);
  if (cv) photos.unshift(...photos.splice(Number(cv.dataset.cover), 1));
  if (rm || cv) renderPhotos();
});
$("edFile").addEventListener("change", async () => {
  const files = [...$("edFile").files].slice(0, MAX_PHOTOS - photos.length);
  if (!files.length) return;
  $("photoMsg").textContent = files.length > 1 ? `Getting ${files.length} photos ready…` : "Getting your photo ready…";
  $("edSave").disabled = true;
  try {
    for (const f of files) { photos.push(await uploadPhoto(f)); renderPhotos(); }
    $("photoMsg").textContent = "Looks good. The first photo is the cover.";
    $("photoBtn").classList.remove("invalid");
  } catch (err) {
    $("photoMsg").textContent = err.message;
  } finally {
    $("edSave").disabled = false;
    $("edFile").value = "";
  }
});

function openEditor(p = null) {
  editing = p;
  $("edTitle").textContent = p ? "Edit item" : "Add item";
  $("edName").value = p?.name || "";
  $("edCat").value = p?.category || (CATEGORIES.some((c) => c.id === show) ? show : "");
  $("edCond").value = p?.condition || "";
  $("edDesc").value = p?.description || "";
  $("edOptions").innerHTML = "";
  (p?.options?.length ? p.options : [{ label: "", price: "", soldOut: false }]).forEach(optionRow);
  $("edChoiceTitle").value = p?.choiceTitle || "";
  choices = [...(p?.choices || [])]; renderChoices();
  $("edPre").checked = p ? !!p.preorder : show === "pre";
  $("edSold").checked = !!p?.soldOut;
  $("edHidden").checked = !!p?.hidden;
  $("edErr").textContent = "";
  $("photoMsg").textContent = "Front, back, label and any marks. The first photo is the cover.";
  photos = [...(p?.photos || [])]; renderPhotos();
  $("edDelete").hidden = !p;
  ed.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  ed.showModal();
  ed.querySelector(".ed-body").scrollTop = 0;
}

$("addBtn").addEventListener("click", () => openEditor());
$("edForm").addEventListener("input", (e) => { e.target.classList.remove("invalid"); $("edErr").textContent = ""; });
$("plist").addEventListener("click", (e) => {
  const b = e.target.closest("[data-edit]");
  if (b) openEditor(products.find((p) => p.id === b.dataset.edit));
});
$("edClose").addEventListener("click", () => ed.close());

$("edForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  ed.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  if ($("edChoiceInput").value.trim()) addChoice();
  const options = [...$("edOptions").children].map((r) => ({
    label: r.querySelector(".o-label").value, price: r.querySelector(".o-price").value, soldOut: r.querySelector(".o-sold").checked,
  }));
  const draft = {
    ...(editing || {}),
    name: $("edName").value, category: $("edCat").value, condition: $("edCond").value, description: $("edDesc").value,
    options, choiceTitle: $("edChoiceTitle").value, choices, photos,
    preorder: $("edPre").checked, soldOut: $("edSold").checked, hidden: $("edHidden").checked,
  };
  $("edSave").disabled = true; $("edSave").textContent = "Saving…";
  try {
    const saved = await saveProduct(draft);
    ed.close();
    toast(editing ? "Saved" : `${saved.name} is on the shop`);
    await reload();
  } catch (err) {
    const msg = err.message || "Couldn't save. Check your internet and try again.";
    $("edErr").textContent = msg;
    const target = /photo/i.test(msg) ? $("photoBtn") : /name/i.test(msg) ? $("edName") : /category/i.test(msg) ? $("edCat") : /size|price/i.test(msg) ? $("edOptions").querySelector("input") : null;
    target?.classList.add("invalid");
  } finally {
    $("edSave").disabled = false; $("edSave").textContent = "Save";
  }
});

$("edDelete").addEventListener("click", async () => {
  if (!editing || !confirm(`Delete "${editing.name}"? This can't be undone. (To take it off the shop for a while, use "Hide" instead.)`)) return;
  try {
    await deleteProduct(editing.id);
    ed.close();
    toast("Deleted");
    await reload();
  } catch {
    $("edErr").textContent = "Couldn't delete. Check your internet and try again.";
  }
});

/* ---------- Start ---------- */
$("previewStrip").hidden = LIVE;
$("reset").addEventListener("click", async () => {
  if (!confirm("Remove your changes and go back to the sample items?")) return;
  resetPreview(); await reload(); toast("Back to the samples");
});
$("signinForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("signinErr").textContent = "";
  try { await signIn($("email").value, $("password").value); }
  catch (err) { $("signinErr").textContent = err.message; }
});
$("signOut").addEventListener("click", () => signOut());

onOwner((who) => {
  const ok = who && (who.preview || who.admin);
  $("signin").hidden = !!who;
  $("notAdmin").hidden = !who || ok;
  $("owner").hidden = !ok;
  $("signOut").hidden = !who || who.preview;
  if (ok) reload();
}).catch(() => {
  $("signin").hidden = false;
  $("signinErr").textContent = "Couldn't connect. Check your internet and refresh.";
});
