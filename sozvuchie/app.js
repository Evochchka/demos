(() => {
const D = window.DEMO;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>'
};

// ---------- state ----------
const S = {
  me: { name: "Карен", age: 29, city: "Москва", about: "", answers: [0, 1, 0, 0, 1], photos: 0 },
  verified: false, premium: false,
  queue: [], seen: 0, limit: 5,
  matches: [], chats: {}, likedMe: [1, 4, 2],
  stack: [], cur: null
};
const mutual = new Set([1, 4]);

function compat(p) {
  let s = 10;
  D.questions.forEach((q, i) => {
    const d = Math.abs(S.me.answers[i] - p.answers[i]);
    s += d === 0 ? 18 : d === 1 ? 8 : 0;
  });
  return Math.min(s, 97);
}
function reasons(p) {
  const same = [], diff = [];
  D.questions.forEach((q, i) => {
    if (S.me.answers[i] === p.answers[i]) same.push(`${q.q}: оба выбрали «${q.a[p.answers[i]]}»`);
    else diff.push(`${q.q}: у вас «${q.a[S.me.answers[i]]}», у неё «${q.a[p.answers[i]]}»`);
  });
  return { same: same.slice(0, 3), diff: diff.slice(0, 2) };
}
function buildQueue() {
  S.queue = D.people.map(p => ({ ...p, pct: compat(p) })).sort((a, b) => b.pct - a.pct);
  S.seen = 0;
}
const person = id => D.people.find(p => p.id === id);

function ava(p, cls = "", extra = "") {
  const [h1, h2] = p.hue;
  return `<div class="ava ${cls}" style="background:linear-gradient(160deg,hsl(${h1} 72% 66%),hsl(${h2} 62% 40%))">
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%;stroke:none;fill:rgba(255,255,255,.16)"><circle cx="118" cy="84" r="38"/><path d="M40 210c6-50 40-78 78-78s72 28 78 78z"/></svg>
    ${extra}<span class="ini">${esc(p.name[0])}</span></div>`;
}
const lens = (pct, big) => `<div class="lens ${big ? "big" : ""}" aria-label="Совместимость ${pct}%"><i></i><i></i><b class="num">${pct}%</b></div>`;

// ---------- router ----------
const screen = $("#screen"), tabs = $("#tabs"), back = $("#back");
const ROOT = ["feed", "likes", "chats", "profile"];
function go(name, push = true) {
  if (name === "paywall") return paywall();
  if (push && S.cur && S.cur !== name) S.stack.push(S.cur);
  if (ROOT.includes(name)) S.stack = [];
  S.cur = name;
  const [base, arg] = name.split(":");
  const R = { onb1, onb2, onb3, feed, likes, chats, chat, verify, profile }[base];
  screen.innerHTML = R(arg);
  screen.scrollTop = 0;
  tabs.classList.toggle("hide", base.startsWith("onb") || base === "chat" || base === "verify");
  back.classList.toggle("show", S.stack.length > 0);
  tabs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.go === base || (base === "chat" && b.dataset.go === "chats")));
  document.querySelectorAll(".tour button").forEach(b => b.classList.toggle("cur", b.dataset.go === base || (base.startsWith("onb") && b.dataset.go === "onb1")));
  bind[base] && bind[base](arg);
}
back.onclick = () => { const p = S.stack.pop(); if (p) go(p, false); };

function toast(t) {
  const el = $("#toast"); el.textContent = t; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---------- onboarding ----------
function onb1() {
  const m = S.me;
  return `<div class="pad"><div class="steps"><i class="on"></i><i></i><i></i></div>
  <h2 class="h-scr">Расскажите о себе</h2><p class="sub">Это увидят те, кому вы подходите. Займёт минуту.</p>
  <label class="field" id="f-name"><span>Имя</span><input id="i-name" value="${esc(m.name)}" autocomplete="off"><small>Напишите имя, хотя бы две буквы</small></label>
  <div class="row2"><label class="field" id="f-age"><span>Возраст</span><input id="i-age" inputmode="numeric" value="${m.age}"><small>Сервис для тех, кому 18+</small></label>
  <label class="field"><span>Город</span><input id="i-city" value="${esc(m.city)}"></label></div>
  <label class="field"><span>Пару слов о себе</span><textarea id="i-about" placeholder="Что для вас важно в отношениях">${esc(m.about)}</textarea></label>
  </div><div class="sticky-cta"><button class="btn" id="n1">Дальше: пять вопросов</button></div>`;
}
function onb2() {
  return `<div class="pad"><div class="steps"><i class="on"></i><i class="on"></i><i></i></div>
  <h2 class="h-scr">Пять вопросов о главном</h2><p class="sub">По ответам считаем совместимость. Их видят только в виде совпадений.</p>
  ${D.questions.map((q, i) => `<div class="q"><b>${esc(q.q)}</b><div class="chips" data-q="${i}">${q.a.map((a, j) =>
    `<button class="chip ${S.me.answers[i] === j ? "on" : ""}" data-a="${j}">${esc(a)}</button>`).join("")}</div></div>`).join("")}
  </div><div class="sticky-cta"><button class="btn" id="n2">Дальше: фото</button></div>`;
}
function onb3() {
  const tiles = [0, 1, 2].map(i => i < S.me.photos
    ? `<div style="height:120px;border-radius:16px;background:linear-gradient(150deg,hsl(${200 + i * 40} 60% 62%),hsl(${230 + i * 40} 55% 42%))"></div>`
    : `<button class="ph-add" style="height:120px;border-radius:16px;border:1.5px dashed var(--line);color:var(--muted);font-size:13px">Добавить фото</button>`).join("");
  return `<div class="pad"><div class="steps"><i class="on"></i><i class="on"></i><i class="on"></i></div>
  <h2 class="h-scr">Фото и проверка</h2><p class="sub">Нужно хотя бы одно фото. Анкеты с проверенным селфи получают в 3 раза больше ответов.</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">${tiles}</div>
  <div class="q" style="display:flex;gap:12px;align-items:center"><span style="width:36px;height:36px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;flex:none">${ICON.shield}</span>
  <div style="flex:1"><b style="margin:0">Верификация селфи</b><span style="font-size:13px;color:var(--muted)">10 секунд, фото никому не показываем</span></div></div>
  </div><div class="sticky-cta"><button class="btn rasp" id="n3" ${S.me.photos ? "" : "disabled"}>Показать подборку</button>
  <button class="btn ghost" id="n3v" style="margin-top:8px">Пройти верификацию сейчас</button></div>`;
}

// ---------- feed ----------
function feed() {
  const left = S.limit - S.seen;
  const p = S.queue[S.seen];
  if (!p || left <= 0) {
    return `<div class="daybar"><b>Подборка на сегодня</b><span class="num">${S.limit} из ${S.limit}</span></div>
    <div class="empty">${lens(0).replace("0%", "")}<h2 class="h-scr">На сегодня всё</h2>
    <p>Новая подборка придёт завтра в 10:00. Мы подбираем её ночью по вашим ответам и тем, кого вы отметили сегодня.</p>
    ${S.premium ? `<button class="btn" id="more">Открыть ещё 10 анкет</button>` : `<button class="btn rasp" data-go="paywall">Ещё 10 анкет с Premium</button>`}
    <button class="btn ghost" style="margin-top:8px" id="reset">Начать демо-подборку заново</button></div>`;
  }
  const r = reasons(p);
  return `<div class="daybar"><b>Подборка на сегодня</b><span class="num">${S.seen + 1} из ${S.limit}</span></div>
  <article class="card" id="card">${ava(p, "", p.verified ? `<span class="badge-v">${ICON.shield}Фото проверено</span>` : "")}
    <div class="meta"><div class="who"><b>${esc(p.name)}, ${p.age}</b><span>${esc(p.job)}, ${p.km} км от вас</span></div>${lens(p.pct)}</div>
    <div class="why"><h4>В чём вы совпали</h4><ul>${r.same.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    ${r.diff.length ? `<h4>Где разошлись</h4><ul>${r.diff.map(x => `<li class="diff">${esc(x)}</li>`).join("")}</ul>` : ""}</div>
    <p class="about">${esc(p.about)}</p>
    <div class="acts"><button class="skip" id="skip">${ICON.x}Пропустить</button><button class="like" id="like">${ICON.heart}Нравится</button></div>
  </article>`;
}
function decide(liked) {
  const p = S.queue[S.seen], card = $("#card");
  card.classList.add(liked ? "out-r" : "out-l");
  setTimeout(() => {
    S.seen++;
    if (liked && mutual.has(p.id) && !S.matches.includes(p.id)) {
      S.matches.push(p.id); S.chats[p.id] = S.chats[p.id] || [];
      $("#chat-badge").hidden = false; $("#chat-badge").textContent = S.matches.length;
      showMatch(p);
    } else if (liked) toast(`Симпатия отправлена. Если ${p.name} ответит взаимно, откроется чат.`);
    go("feed", false);
  }, 300);
}
function showMatch(p) {
  const m = $("#match");
  m.innerHTML = `${lens(p.pct, true)}<h2>Это взаимно</h2><p>Вы и ${esc(p.name)} понравились друг другу. Совпали по ${reasons(p).same.length} из 5 вопросов.</p>
  <button class="btn" id="m-write">Написать первым</button><button class="btn ghost" id="m-later">Позже</button>`;
  m.hidden = false;
  $("#m-write").onclick = () => { m.hidden = true; go("chat:" + p.id); };
  $("#m-later").onclick = () => { m.hidden = true; };
}

// ---------- likes ----------
function likes() {
  const cards = S.likedMe.map(id => {
    const p = person(id);
    return `<div class="lockcard">${ava(p, S.premium ? "" : "blur")}<div class="cap">${S.premium ? `${esc(p.name)}, ${p.age}, ${compat(p)}%` : "Скрыто"}</div></div>`;
  }).join("");
  return `<div class="pad" style="padding-bottom:8px"><h2 class="h-scr">Вы понравились</h2>
  <p class="sub">${S.premium ? "Отвечайте взаимностью сразу, без ожидания подборки." : "Трое уже отметили вас. Имена и фото видны с Premium."}</p></div>
  <div class="grid2">${cards}</div>
  ${S.premium ? "" : `<div style="padding:0 14px 18px"><button class="btn rasp" data-go="paywall">Посмотреть, кто это</button></div>`}`;
}

// ---------- chats ----------
function chats() {
  if (!S.matches.length) return `<div class="empty">${lens(0).replace("0%", "")}<h2 class="h-scr">Здесь появятся чаты</h2>
    <p>Чат открывается, когда симпатия взаимная. Начните с подборки: Алина и Дарья отвечают взаимно.</p><button class="btn" data-go="feed">Открыть подборку</button></div>`;
  return `<div class="pad" style="padding-bottom:10px"><h2 class="h-scr">Чаты</h2><p class="sub" style="margin:0">Взаимные симпатии</p></div>
  <div class="list">${S.matches.map(id => {
    const p = person(id), msgs = S.chats[id], last = msgs[msgs.length - 1];
    return `<button class="li" data-go="chat:${id}">${ava(p, "sm")}<div class="t"><b>${esc(p.name)}</b><span>${last ? esc(last.t) : "Мэтч! Напишите первым"}</span></div><span class="pct num">${compat(p)}%</span></button>`;
  }).join("")}</div>`;
}
function chat(id) {
  id = +id; const p = person(id), msgs = S.chats[id] || (S.chats[id] = []);
  return `<div class="chat"><div class="chat-h">${ava(p, "sm")}<div><b>${esc(p.name)}, ${p.age}</b><span>${p.verified ? "Фото проверено" : "Не проверена"}, совместимость ${compat(p)}%</span></div></div>
  <div class="msgs" id="msgs"><div class="sys">Вы совпали по ценностям: ${esc(reasons(p).same.map(s => s.split(":")[0].toLowerCase()).join(", "))}</div>
  ${msgs.map(m => `<div class="m ${m.me ? "me" : "them"}">${esc(m.t)}</div>`).join("")}</div>
  <div class="ib"><h5>${ICON.spark}С чего начать: ИИ собрал вопросы по общим интересам</h5><div class="chips">${D.icebreakers[id].map(t => `<button class="chip ibq">${esc(t)}</button>`).join("")}</div></div>
  <form class="compose" id="compose"><input id="msg" placeholder="Сообщение" autocomplete="off" aria-label="Сообщение"><button aria-label="Отправить">${ICON.send}</button></form></div>`;
}
function send(id, text) {
  text = text.trim(); if (!text) return;
  const msgs = S.chats[id]; msgs.push({ me: true, t: text });
  const box = $("#msgs"); box.insertAdjacentHTML("beforeend", `<div class="m me">${esc(text)}</div><div class="typing" id="typing">${esc(person(id).name)} печатает…</div>`);
  screen.scrollTop = screen.scrollHeight; $("#msg").value = "";
  if (msgs.filter(m => !m.me).length === 0) setTimeout(() => {
    msgs.push({ me: false, t: D.replies[id] });
    $("#typing") && $("#typing").remove();
    if (S.cur === "chat:" + id) { $("#msgs").insertAdjacentHTML("beforeend", `<div class="m them">${esc(D.replies[id])}</div>`); screen.scrollTop = screen.scrollHeight; }
  }, 1400); else setTimeout(() => $("#typing") && $("#typing").remove(), 1200);
}

// ---------- verify ----------
function verify() {
  return `<div class="pad"><h2 class="h-scr">Проверка селфи</h2><p class="sub">Сравниваем живое лицо с фото анкеты. После проверки у анкеты появится отметка.</p>
  <div class="cam" id="cam"><div class="oval" id="oval"></div><span class="gest">Жест: ладонь у щеки</span><span class="hint" id="hint">Поместите лицо в овал</span></div>
  <ul class="checks" id="checks"><li>Лицо в кадре<i></i></li><li>Жест совпал<i></i></li><li>Совпадает с фото анкеты<i></i></li></ul>
  <button class="btn rasp" id="v-go">${S.verified ? "Проверено" : "Сделать селфи"}</button></div>`;
}
function runVerify() {
  const b = $("#v-go"); if (S.verified) return go("profile");
  b.disabled = true; b.textContent = "Проверяем…";
  $("#cam").insertAdjacentHTML("beforeend", '<div class="scan"></div>');
  const lis = [...document.querySelectorAll("#checks li")];
  const hints = ["Лицо найдено", "Жест распознан", "Совпадение с анкетой 94%"];
  lis.forEach((li, i) => setTimeout(() => {
    li.classList.add("ok"); li.insertBefore(document.createTextNode(""), li.firstChild);
    $("#hint").textContent = hints[i];
    if (i === lis.length - 1) {
      $(".scan") && $(".scan").remove(); $("#oval").classList.add("ok");
      S.verified = true; b.disabled = false; b.textContent = "Готово, к профилю";
      toast("Анкета проверена. Отметка видна в подборках.");
    }
  }, 700 * (i + 1)));
}

// ---------- profile ----------
function profile() {
  const m = S.me;
  return `<div class="prof">${ava({ name: m.name, hue: [28, 340] }, "sm")}<div><b>${esc(m.name)}, ${m.age}</b><span>${esc(m.city)}</span></div></div>
  <div class="rows">
    <button data-go="verify"><span>Верификация</span><span class="tag ${S.verified ? "ok" : "no"}">${S.verified ? "Проверено" : "Не пройдена"}</span></button>
    <button data-go="paywall"><span>Подписка</span><span class="tag ${S.premium ? "ok" : "pr"}">${S.premium ? "Premium до 10.12" : "Бесплатно"}</span></button>
    <button data-go="onb2"><span>Мои ответы на 5 вопросов</span><span class="st">Изменить</span></button>
    <button data-go="onb1"><span>Анкета</span><span class="st">Изменить</span></button>
  </div>
  <div class="rows"><div class="r"><span>Анкет в день</span><span class="num">${S.limit}</span></div>
  <div class="r"><span>Хранение данных</span><span class="st">Серверы в РФ, 152-ФЗ</span></div></div>`;
}

// ---------- paywall ----------
function paywall() {
  const sh = $("#sheet"), bk = $("#sheet-back");
  const plans = [["w", "Неделя", "Чтобы попробовать", "149 ₽"], ["m", "Месяц", "Выбирают чаще всего", "449 ₽"], ["q", "3 месяца", "Выгоднее на 25%", "990 ₽"]];
  let sel = "m";
  const draw = () => {
    sh.innerHTML = `<div class="grab"></div><h2 class="h-scr">Premium</h2><p class="sub" style="margin:0">Больше подходящих людей и меньше ожидания</p>
    <ul class="perks"><li>${ICON.check}10 дополнительных анкет в день</li><li>${ICON.check}Видно, кто вас отметил</li><li>${ICON.check}3 суперсимпатии в неделю: она увидит вас первой</li><li>${ICON.check}Подробный разбор совместимости</li></ul>
    <div class="plans">${plans.map(p => `<button class="plan ${p[0] === sel ? "on" : ""}" data-p="${p[0]}"><span class="rd"></span><span><b>${p[1]}</b><small>${p[2]}</small></span><span class="p num">${p[3]}</span></button>`).join("")}</div>
    ${S.premium ? `<button class="btn" id="pw-close">У вас уже Premium</button>` :
      `<div class="pay"><button class="btn" id="pay-card">${ICON.card}Картой</button><button class="btn ghost" id="pay-stars">${ICON.star}Telegram Stars</button></div>`}
    <p class="legal">Демо: оплата не списывается. В рабочей версии ЮKassa и Telegram Stars, чек приходит в бот.</p>`;
    sh.querySelectorAll(".plan").forEach(b => b.onclick = () => { sel = b.dataset.p; draw(); });
    const done = how => { S.premium = true; S.limit = 15; close(); toast(`Premium подключён (${how}). Открыто ещё 10 анкет.`); if (["likes", "feed", "profile"].includes(S.cur)) go(S.cur, false); };
    $("#pay-card") && ($("#pay-card").onclick = () => done("картой"));
    $("#pay-stars") && ($("#pay-stars").onclick = () => done("Stars"));
    $("#pw-close") && ($("#pw-close").onclick = close);
  };
  const close = () => { sh.hidden = true; bk.hidden = true; };
  bk.onclick = close; draw(); sh.hidden = false; bk.hidden = false;
}

// ---------- bindings per screen ----------
const bind = {
  onb1() {
    $("#n1").onclick = () => {
      const n = $("#i-name").value.trim(), a = +$("#i-age").value;
      $("#f-name").classList.toggle("err", n.length < 2);
      $("#f-age").classList.toggle("err", !(a >= 18 && a <= 99));
      if (n.length < 2 || !(a >= 18 && a <= 99)) return;
      Object.assign(S.me, { name: n, age: a, city: $("#i-city").value.trim() || "Москва", about: $("#i-about").value });
      go("onb2");
    };
  },
  onb2() {
    screen.querySelectorAll(".chips").forEach(c => c.onclick = e => {
      const b = e.target.closest(".chip"); if (!b) return;
      S.me.answers[+c.dataset.q] = +b.dataset.a;
      c.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
    });
    $("#n2").onclick = () => { buildQueue(); go("onb3"); };
  },
  onb3() {
    screen.querySelectorAll(".ph-add").forEach(b => b.onclick = () => { S.me.photos = Math.min(3, S.me.photos + 1); go("onb3", false); });
    $("#n3").onclick = () => { buildQueue(); go("feed"); toast("Подборка пересчитана по вашим ответам"); };
    $("#n3v").onclick = () => go("verify");
  },
  feed() {
    $("#like") && ($("#like").onclick = () => decide(true));
    $("#skip") && ($("#skip").onclick = () => decide(false));
    $("#reset") && ($("#reset").onclick = () => { buildQueue(); go("feed", false); });
    $("#more") && ($("#more").onclick = () => { buildQueue(); go("feed", false); });
  },
  chat(id) {
    id = +id;
    screen.querySelectorAll(".ibq").forEach(b => b.onclick = () => send(id, b.textContent));
    $("#compose").onsubmit = e => { e.preventDefault(); send(id, $("#msg").value); };
    screen.scrollTop = screen.scrollHeight;
  },
  verify() { $("#v-go").onclick = runVerify; }
};

document.addEventListener("click", e => {
  const t = e.target.closest("[data-go]"); if (!t) return;
  e.preventDefault();
  if ($("#mode-app").hidden) setMode("app");
  go(t.dataset.go);
});

// ---------- admin ----------
function admin(period = 30) {
  const A = D.admin, el = $("#mode-admin");
  const dau = A.dau.slice(-period), max = Math.max(...dau) * 1.1, min = Math.min(...dau) * 0.85;
  const W = 640, H = 220, px = i => 36 + i * (W - 50) / (dau.length - 1), py = v => 12 + (H - 40) * (1 - (v - min) / (max - min));
  const path = dau.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join("");
  const grid = [0, .5, 1].map(t => { const v = Math.round(min + (max - min) * t); return `<line class="ax" x1="36" x2="${W - 14}" y1="${py(v)}" y2="${py(v)}"/><text x="0" y="${py(v) + 4}">${v.toLocaleString("ru")}</text>`; }).join("");
  const f0 = A.funnel[0].n;
  const total = A.revenue.reduce((s, r) => s + r.sum, 0);
  el.innerHTML = `<div class="adm-h"><div><h1>Как растёт сервис</h1><p>Панель для команды и инвестора. Данные демо.</p></div>
    <div class="period" role="tablist">${[7, 30].map(p => `<button data-per="${p}" class="${p === period ? "on" : ""}">${p} дней</button>`).join("")}</div></div>
  <div class="kpis">${A.kpi.map(k => `<div class="kpi"><span>${k.k}</span><b class="num">${k.v}</b><em class="${k.up ? "" : "dn"}">${k.d}</em></div>`).join("")}</div>
  <div class="adm-grid">
    <section class="panel chart"><h3>Активные за день</h3><p class="s">Люди, которые открыли подборку хотя бы раз</p>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Рост активных пользователей">${grid}<path class="ar" d="${path}L${px(dau.length - 1)},${H - 28}L36,${H - 28}Z"/><path class="ln" d="${path}"/>
      <text x="36" y="${H - 8}">${period === 30 ? "11 окт" : "4 ноя"}</text><text x="${W - 60}" y="${H - 8}">10 ноя</text></svg></section>
    <section class="panel"><h3>Воронка нового пользователя</h3><p class="s">Из 10 000 открытий, последние 30 дней</p>
      <div class="fun">${A.funnel.map(f => `<div class="fr"><span>${f.s}</span><div class="bar"><i style="width:${(f.n / f0 * 100).toFixed(1)}%"></i></div><span class="v num">${(f.n / f0 * 100).toFixed(1).replace(".", ",")}%</span></div>`).join("")}</div></section>
  </div>
  <div class="adm-grid">
    <section class="panel"><h3>Очередь модерации</h3><p class="s" id="mod-s">${A.moderation.length} анкеты ждут решения. ИИ отмечает риск, решает человек.</p>
      <div class="tbl"><table><thead><tr><th>Анкета</th><th>Что не так</th><th>Источник</th><th>Риск</th><th></th></tr></thead><tbody>
      ${A.moderation.map(m => `<tr data-id="${m.id}"><td><b>${esc(m.who)}</b><div class="st">${m.id}</div></td><td>${esc(m.why)}</td><td class="st">${esc(m.src)}</td>
      <td><span class="risk ${m.risk === "Высокий" ? "h" : m.risk === "Средний" ? "m" : "l"}">${m.risk}</span></td>
      <td><div class="mact"><button class="ok">Оставить</button><button class="ban">Заблокировать</button></div><span class="st res"></span></td></tr>`).join("")}
      </tbody></table></div></section>
    <section class="panel"><h3>Выручка за месяц</h3><p class="s">Подписки и разовые покупки</p>
      <div class="rev">${A.revenue.map(r => `<div class="rr"><span>${r.t}</span><b class="num">${r.sum.toLocaleString("ru")} ₽</b><div class="bar"><i style="width:${r.share * 100}%"></i></div></div>`).join("")}
      <div class="tot"><span>Итого</span><span class="num">${total.toLocaleString("ru")} ₽</span></div></div></section>
  </div>`;
  el.querySelectorAll("[data-per]").forEach(b => b.onclick = () => admin(+b.dataset.per));
  let left = A.moderation.length;
  el.querySelectorAll("tbody tr").forEach(tr => tr.querySelectorAll(".mact button").forEach(b => b.onclick = () => {
    tr.classList.add("done"); tr.querySelector(".res").textContent = b.classList.contains("ban") ? "Заблокирована" : "Оставлена";
    left--; $("#mod-s").textContent = left ? `Осталось решить: ${left}` : "Очередь пуста. Новые анкеты придут сюда автоматически.";
  }));
}

function setMode(m) {
  document.querySelectorAll(".modes button").forEach(b => { const on = b.dataset.mode === m; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  $("#mode-app").hidden = m !== "app"; $("#mode-admin").hidden = m !== "admin";
  if (m === "admin") admin();
}
document.querySelectorAll(".modes button").forEach(b => b.onclick = () => setMode(b.dataset.mode));

// ---------- theme ----------
const root = document.documentElement;
try { const t = localStorage.getItem("sz-theme"); if (t) root.dataset.theme = t; } catch (e) {}
$("#theme").onclick = () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("sz-theme", root.dataset.theme); } catch (e) {}
};

const qs = new URLSearchParams(location.search);
buildQueue();
if (qs.get("embed")) document.body.classList.add("embed");
if (qs.get("preset") === "story") {
  S.matches = [1]; S.seen = 1;
  S.chats[1] = [{ me: true, t: D.icebreakers[1][0] }, { me: false, t: D.replies[1] }];
  $("#chat-badge").hidden = false;
}
if (qs.get("mode") === "admin") setMode("admin");
go(qs.get("s") || "feed", false);
})();
