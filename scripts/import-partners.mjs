// One-time ETL: normalize "Gala Dinner List (1).xlsx" into PARTNERS_DATA.
// Run: node scripts/import-partners.mjs
import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const XLSX_PATH = join(ROOT, "Gala Dinner List (1).xlsx");
const TS_PATH = join(ROOT, "src/lib/partnerships-data.ts");
const INCLUDE_FULL_SCHOOLS = false; // keep the page curated

const EMPTY = new Set(["", "-", "–", "—", "n/a", "na", "none", ".", "un-known", "unknown", "null", "إيميل", "email"]);
const clean = (v) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return EMPTY.has(s.toLowerCase()) ? "" : s;
};
const dedupe = (arr) => [...new Set(arr)];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function splitEmails(cell) {
  const raw = clean(cell);
  if (!raw) return [];
  return dedupe(
    raw
      .split(/[;,\s<>"']+/)
      .map((t) => t.trim().replace(/[.,;]+$/, ""))
      .filter((t) => EMAIL_RE.test(t))
      .map((t) => {
        const [u, d] = t.split("@");
        return `${u}@${d.toLowerCase()}`;
      })
  );
}

function normPhone(raw) {
  let d = String(raw).replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00971")) d = "0" + d.slice(5);
  else if (d.startsWith("971")) d = "0" + d.slice(3);
  else if (d[0] !== "0") {
    if (d.length === 9 && d[0] === "5") d = "0" + d; // mobile missing 0
    else if (d.length === 8) d = "0" + d; // landline missing 0
  }
  if (d.length < 9) return "";
  if (d.length === 10 && d.startsWith("05")) return d.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  if (d.length === 9) return d.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
  return d;
}
function splitPhones(cell) {
  const raw = clean(cell);
  if (!raw) return [];
  return dedupe(
    raw
      .split(/[/;,\n]| or /i)
      .map((p) => normPhone(p))
      .filter(Boolean)
  );
}

const ROLE_RE = /\b(manager|officer|director|administrator|admin|head|principal|coordinator|supervisor|specialist|assistant|executive|ceo|cfo|cto|president|chair|dean|secretary|advisor|adviser|consultant|engineer|teacher|vice|hr|relations)\b/i;
const looksLikeRole = (s) => !!s && ROLE_RE.test(s);

const GOV_RE = /\.gov\.ae|police|municipalit|court|ministry|department of|\bauthority\b|civil defence|chamber|sewerage|agriculture and food|\badek\b|\badafsa\b|\bqcc\b|zayed higher|red crescent|crescent|moe\.gov|rcuae/i;
const isGov = (name, emails) => GOV_RE.test(name) || emails.some((e) => GOV_RE.test(e));

function orgKey(s) {
  return clean(s).toLowerCase().replace(/[.,'"()-]/g, "").replace(/\s+/g, " ").trim();
}
function slugify(s, prefix, used) {
  const k = clean(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  let base = `${prefix}-${k || "org"}`;
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  used.add(slug);
  return slug;
}

const wb = XLSX.read(readFileSync(XLSX_PATH), { type: "buffer" });
const sheet = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "", blankrows: false, raw: false });
const headerMap = (hdr) => {
  const m = {};
  hdr.forEach((h, i) => {
    const k = String(h ?? "").trim().toLowerCase();
    if (k && !(k in m)) m[k] = i;
  });
  return m;
};
const at = (row, hm, ...names) => {
  for (const n of names) {
    const i = hm[n.toLowerCase()];
    if (i != null) return clean(row[i]);
  }
  return "";
};
const rawAt = (row, hm, ...names) => names.map((n) => hm[n.toLowerCase()]).filter((i) => i != null).map((i) => row[i]);
const emailsFrom = (row, hm, ...names) => dedupe(rawAt(row, hm, ...names).flatMap(splitEmails));
const phonesFrom = (row, hm, ...names) => dedupe(rawAt(row, hm, ...names).flatMap(splitPhones));

const stats = { dropped: 0, mergedOrgs: 0 };
function mkContact({ name, nameAr, position, emails, phones }) {
  const c = { name: clean(name) || "", emails: emails || [], phones: phones || [] };
  if (nameAr && clean(nameAr) && clean(nameAr) !== c.name) c.nameAr = clean(nameAr);
  if (position && clean(position)) c.position = clean(position);
  return c;
}
const hasInfo = (c) => c.name || c.emails.length || c.phones.length;

// Merge rows that share an org into one partner with multiple contacts.
function buildMerged(rows, makePartner) {
  const map = new Map();
  for (const built of rows.map(makePartner).filter(Boolean)) {
    const key = built.key;
    if (map.has(key)) {
      map.get(key).partner.contacts.push(...built.partner.contacts);
      stats.mergedOrgs++;
      // prefer a non-empty status / nameAr / subtype if missing
      const ex = map.get(key).partner;
      if (!ex.status && built.partner.status) ex.status = built.partner.status;
      if (!ex.nameAr && built.partner.nameAr) ex.nameAr = built.partner.nameAr;
      if (!ex.subtype && built.partner.subtype) ex.subtype = built.partner.subtype;
    } else {
      map.set(key, built);
    }
  }
  // collapse duplicate contacts within a partner (same name+first email)
  for (const { partner } of map.values()) {
    const seen = new Set();
    partner.contacts = partner.contacts.filter((c) => {
      if (!hasInfo(c)) return false;
      const k = `${c.name}|${c.emails[0] || ""}|${c.phones[0] || ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  return [...map.values()].map((v) => v.partner);
}

// ---- Schools with MOU ----
function processSchools(sheetName, mou) {
  const rows = sheet(sheetName);
  if (!rows.length) return [];
  const hm = headerMap(rows[0]);
  return buildMerged(rows.slice(1), (row) => {
    const nameEn = at(row, hm, "school_name_en");
    const nameAr = at(row, hm, "school_name_ar");
    const name = nameEn || nameAr;
    if (!name) return null;
    const emails = emailsFrom(row, hm, "school_email", "email", "employee_email");
    const phones = phonesFrom(row, hm, "school_phone", "employee_mobile");
    const contact = mkContact({
      name: at(row, hm, "fullname_en") || at(row, hm, "fullname_ar"),
      nameAr: at(row, hm, "fullname_ar"),
      position: at(row, hm, "cleaned_jobfunction_en"),
      emails,
      phones,
    });
    const partner = {
      category: "school",
      name,
      mou,
      subtype: at(row, hm, "school_category_en") || undefined,
      status: at(row, hm, "status: updated\\cancelled") || at(row, hm, "status") || at(row, hm, "comment") || undefined,
      contacts: hasInfo(contact) ? [contact] : [],
    };
    if (nameAr && nameAr !== name) partner.nameAr = nameAr;
    return { key: orgKey(name), partner };
  });
}

// ---- Companies + Government ----
function processCompanies() {
  const rows = sheet("All companies and Government De");
  const hm = headerMap(rows[0]);
  return buildMerged(rows.slice(1), (row) => {
    const org = at(row, hm, "company name");
    let guest = at(row, hm, "guest name");
    let pos = at(row, hm, "position");
    const emails = emailsFrom(row, hm, "email");
    const phones = phonesFrom(row, hm, "phone");
    if (!org && !guest && !emails.length && !phones.length) return null;
    // de-swap name/position
    if (looksLikeRole(guest) && pos && !looksLikeRole(pos)) [guest, pos] = [pos, guest];
    const name = org || guest;
    const contact = mkContact({ name: guest, position: pos, emails, phones });
    const partner = {
      category: isGov(name, emails) ? "gov" : "company",
      name,
      mou: false,
      status: at(row, hm, "notes") || undefined,
      contacts: hasInfo(contact) ? [contact] : [],
    };
    return { key: orgKey(name), partner };
  });
}

// ---- Individuals (ragged; an "Advisory Board" marker splits two shapes) ----
function processIndividuals() {
  const rows = sheet("Individuals");
  const used = new Set();
  const out = [];
  let advisory = false;
  for (const row of rows.slice(1)) {
    const a = clean(row[0]);
    if (/advisory board/i.test(a)) { advisory = true; continue; }
    if (!advisory) {
      const name = a;
      const phones = splitPhones(row[1]);
      const pos = clean(row[2]);
      const emails = splitEmails(row[3]);
      if (!name && !emails.length && !phones.length) continue;
      const contact = mkContact({ name, position: pos, emails, phones });
      if (!hasInfo(contact)) continue;
      out.push({ category: "individual", name: name || emails[0] || "Guest", mou: false, contacts: [contact] });
    } else {
      const org = a;
      const pname = clean(row[1]);
      const title = clean(row[2]);
      const emails = splitEmails(row[3]);
      if (!org && !pname && !emails.length) continue;
      const contact = mkContact({ name: pname || org, position: title, emails, phones: [] });
      out.push({ category: "individual", name: org || pname, subtype: "Advisory Board", mou: false, contacts: hasInfo(contact) ? [contact] : [] });
    }
  }
  return out.map((p) => ({ ...p, id: slugify(p.name, "ind", used) }));
}

// ---- assemble ----
const schools = processSchools("Schools with MOU", true);
const fullSchools = INCLUDE_FULL_SCHOOLS ? processSchools("Schools", false) : [];
const companies = processCompanies();
const individuals = processIndividuals();

// curate: companies/gov need at least one email or phone somewhere
const hasAnyContact = (p) => p.contacts.some((c) => c.emails.length || c.phones.length);
const curatedCompanies = companies.filter((p) => {
  if (hasAnyContact(p)) return true;
  stats.dropped++;
  return false;
});

// assign slugs to org-based partners
const used = new Set();
const withSlugs = (arr, prefix) =>
  arr.map((p) => ({ ...p, id: p.id || slugify(p.name, prefix, used) }));

const all = [
  ...withSlugs(schools, "school"),
  ...withSlugs(fullSchools, "school"),
  ...withSlugs(curatedCompanies.filter((p) => p.category === "gov"), "gov"),
  ...withSlugs(curatedCompanies.filter((p) => p.category === "company"), "company"),
  ...individuals, // already slugged
];

// order fields consistently + sort alpha within category
const CAT_ORDER = { gov: 0, company: 1, school: 2, individual: 3 };
const order = (p) => {
  const o = { id: p.id, name: p.name };
  if (p.nameAr) o.nameAr = p.nameAr;
  o.category = p.category;
  if (p.subtype) o.subtype = p.subtype;
  o.mou = p.mou;
  if (p.status) o.status = p.status;
  if (p.website) o.website = p.website;
  o.contacts = p.contacts.map((c) => {
    const cc = { name: c.name };
    if (c.nameAr) cc.nameAr = c.nameAr;
    if (c.position) cc.position = c.position;
    cc.emails = c.emails;
    cc.phones = c.phones;
    return cc;
  });
  return o;
};
all.sort((a, b) => CAT_ORDER[a.category] - CAT_ORDER[b.category] || a.name.localeCompare(b.name));
const data = all.map(order);

// write between markers
const literal = JSON.stringify(data, null, 2);
const file = readFileSync(TS_PATH, "utf8");
const next = file.replace(
  /\/\/ <auto>[\s\S]*?\/\/ <\/auto>/,
  `// <auto>\nexport const PARTNERS_DATA: Partner[] = ${literal};\n// </auto>`
);
writeFileSync(TS_PATH, next);

// summary
const count = (cat) => data.filter((p) => p.category === cat).length;
const contacts = data.reduce((n, p) => n + p.contacts.length, 0);
console.log("Partners written:", data.length);
console.log("  gov:", count("gov"), "| company:", count("company"), "| school:", count("school"), "| individual:", count("individual"));
console.log("  MoU partners:", data.filter((p) => p.mou).length);
console.log("  total contacts:", contacts, "| orgs merged:", stats.mergedOrgs, "| dropped (no contact):", stats.dropped);
console.log("Wrote", TS_PATH);
