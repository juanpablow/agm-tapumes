// TODO: replace with the real WhatsApp number (country code + area code + number, digits only)
const WHATSAPP_NUMBER = "5511942138960";

const QUOTE_EMAIL = "comercial@agmtapumes.com.br";

const track = (name, params = {}) => {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (typeof window.fbq === "function") window.fbq("trackCustom", name, params);
  } catch (_) {}
};

const wppLink = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("wpp").href = wppLink(
  "Olá! Gostaria de um orçamento de tapumes metálicos.",
);

document.getElementById("wpp").addEventListener("click", () => {
  track("whatsapp_float_click");
});

const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") nav.classList.remove("open");
});

const TIPOS = [
  "Obra residencial/comercial",
  "Grande empreendimento",
  "Evento / área temporária",
  "Outro",
];

const cleanText = (v, max) =>
  String(v)
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>`{}\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const cleanName = (v) =>
  cleanText(v, 80).replace(/[^\p{L}\p{M}\s'.-]/gu, "").trim();

const cleanCity = (v) =>
  cleanText(v, 60).replace(/[^\p{L}\p{M}\s'.-]/gu, "").trim();

const cleanPhone = (v) => {
  let d = String(v).replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  return d;
};

const validPhone = (d) => /^[1-9]{2}9?\d{8}$/.test(d);

const formatPhone = (d) =>
  d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

const cleanNumber = (v, max) => {
  const n = parseFloat(String(v).replace(/[^\d,.]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
};

const fmtNum = (n) => String(n).replace(".", ",");

const form = document.getElementById("form");

["metragem", "altura"].forEach((n) => {
  form.elements[n].addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^\d,.]/g, "");
  });
});

let formStarted = false;
form.addEventListener("focusin", () => {
  if (formStarted) return;
  formStarted = true;
  track("form_start");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;

  const nome = cleanName(f.elements.nome.value);
  const fone = cleanPhone(f.elements.telefone.value);
  const cidadeRaw = f.elements.cidade.value.trim();
  const cidade = cleanCity(cidadeRaw);
  const metragemRaw = f.elements.metragem.value.trim();
  const alturaRaw = f.elements.altura.value.trim();
  const metragem = cleanNumber(metragemRaw, 100000);
  const altura = cleanNumber(alturaRaw, 20);
  const tipo = TIPOS.includes(f.elements.tipo.value)
    ? f.elements.tipo.value
    : "Outro";

  const checks = {
    nome: nome.length >= 2,
    telefone: validPhone(fone),
    cidade: !cidadeRaw || cidade.length >= 2,
    metragem: !metragemRaw || metragem !== null,
    altura: !alturaRaw || altura !== null,
  };

  let ok = true;
  Object.entries(checks).forEach(([n, valid]) => {
    f.elements[n].classList.toggle("err", !valid);
    if (!valid) ok = false;
  });
  if (!ok) {
    track("form_invalid");
    f.querySelector(".err").focus();
    return;
  }

  const msg = [
    "Olá! Gostaria de um orçamento de tapumes metálicos.",
    `Nome: ${nome}`,
    `WhatsApp: ${formatPhone(fone)}`,
    `Cidade da obra: ${cidade || "a definir"}`,
    `Metragem linear: ${metragem ? fmtNum(metragem) + " m" : "a definir"}`,
    `Altura: ${altura ? fmtNum(altura) + " m" : "a definir"}`,
    `Tipo de projeto: ${tipo}`,
  ].join("\n");

  track("generate_lead", { tipo, has_size: Boolean(metragem) });

  fetch(`https://formsubmit.co/ajax/${QUOTE_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `Novo orçamento de tapume - ${nome}`,
      _template: "table",
      _captcha: "false",
      Nome: nome,
      WhatsApp: formatPhone(fone),
      "Cidade da obra": cidade || "a definir",
      "Metragem linear": metragem ? fmtNum(metragem) + " m" : "a definir",
      Altura: altura ? fmtNum(altura) + " m" : "a definir",
      "Tipo de projeto": tipo,
    }),
    keepalive: true,
  }).catch(() => {});

  window.open(wppLink(msg), "_blank", "noopener");
});

const io = new IntersectionObserver(
  (es) =>
    es.forEach((x) => {
      if (x.isIntersecting) {
        x.target.classList.add("in");
        io.unobserve(x.target);
      }
    }),
  { threshold: 0.12 },
);
document
  .querySelectorAll(".card,.steps li,.photo,.faq details,.section__head")
  .forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
