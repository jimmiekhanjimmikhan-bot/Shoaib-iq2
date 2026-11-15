/* ShoaibScale shared script. Site Firebase ke bina bhi chalti hai (data browser me save hota hai);
   agar firebase-init.js sahi config ke sath ho to inquiries/orders/chat Firebase me bhi mirror hote hain. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var MAP = { session: "siq_sess", users: "siq_users", orders: "siq_orders", payments: "siq_pays", chat: "siq_chat", inquiries: "siq_contacts" };
  var store = {
    get: function (k, d) {
      try {
        if (MAP[k] && window.LS) { var v = LS.get(MAP[k], d); return v == null ? d : v; }
        var r = localStorage.getItem("ss_" + k); return r ? JSON.parse(r) : d;
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try { if (MAP[k] && window.LS) return LS.set(MAP[k], v); localStorage.setItem("ss_" + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    }
  };
  function ready() { return window.PRIV ? Promise.resolve(window.PRIV).catch(function () {}) : Promise.resolve(); }
  function mirror() {}
  function toast(m) { var t = $("#ts"); if (!t) return; t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 3200); }
  function err(id, m) { var e = $("#" + id); if (e) { e.textContent = m || ""; e.style.display = m ? "block" : ""; } }
  var emailOk = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); };
  function sha(s) {
    if (!(window.crypto && crypto.subtle)) return Promise.resolve("p:" + btoa(unescape(encodeURIComponent(s))));
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    });
  }

  /* ---------- CONTENT (yahan se services/portfolio edit karein) ---------- */
  var SERVICES = [
    ["Landing pages & websites", "Design, content and development for clear product and service pages.", "Hero and offer structure · Responsive build · Contact or booking CTA · Basic SEO setup"],
    ["Content & translation", "Website copy, product content and audience-aware translation.", "Website and product copy · Translation and localization · Tone and terminology checks"],
    ["AI chatbots", "FAQ assistants, lead capture and clear human handoff.", "FAQ assistant · Lead capture · Human handoff · Verified answers only"],
    ["Custom portals & software", "ERP, inventory and workflow tools shaped around business needs.", "Requirements mapping · Portals and inventory tools · Role-based access · Handover notes"],
    ["Dashboards & monitoring", "Operational reporting, machine monitoring and shift views.", "KPI dashboards · Machine and shift views · Reports for managers"],
    ["Brand systems & promo films", "Visual identity and production stories for business audiences.", "Logo and colour system · Brand guidelines · Short promo film planning"]
  ];
  var PORTFOLIO = [
    ["Business landing page", "Landing page", "A focused page that explains one service and leads to a single enquiry action."],
    ["FAQ chatbot", "AI chatbot", "A support assistant that answers common questions and hands over to a person."],
    ["Operations dashboard", "Dashboard", "Shift and production views that make daily reporting easier to read."]
  ];
  var DEMOS = []; // demo cards yahan add karein: ["Title","Tag","Description"]
  var LOGO = "assets/shoaibscale-logo.png";

  var num = function (i) { return ("0" + (i + 1)).slice(-2); };
  function fromDB(key, fallback, map) {
    try { if (window.LS) { var v = LS.get(key, null); if (v && v.length) return v.map(map).filter(function (x) { return x[0]; }); } } catch (e) {}
    return fallback;
  }
  function renderCards() {
    var SV = fromDB("siq_services", SERVICES, function (x) { return Array.isArray(x) ? x : [x.title || x.name || x.t, x.desc || x.description || x.d || "", x.details || x.points || ""]; });
    var PF = fromDB("siq_portfolio", PORTFOLIO, function (x) { return Array.isArray(x) ? x : [x.title || x.name || x.t, x.tag || x.category || x.type || "Project", x.desc || x.description || x.d || ""]; });
    var sg = $("#sg");
    if (sg) sg.innerHTML = SV.map(function (s, i) {
      return '<article class="card"><span class="num">' + num(i) + "</span><h3>" + esc(s[0]) + "</h3><p>" + esc(s[1]) + '</p><p style="font-size:13px;margin-top:10px">' + esc(s[2]) + '</p><a class="more" href="contact.html" data-quote="' + esc(s[0]) + '" style="display:inline-block;margin-top:14px">Request a quote →</a></article>';
    }).join("");
    var pf = function (id, list) {
      var el = $(id); if (!el) return;
      el.innerHTML = list.map(function (p) { return '<article class="card pfc"><div class="cover"></div><span class="pill">' + esc(p[1]) + "</span><h3>" + esc(p[0]) + '</h3><p>' + esc(p[2]) + "</p></article>"; }).join("");
    };
    pf("#pfh", PF); pf("#pfg", PF); pf("#pfd", DEMOS);
    var d = $("#demos"); if (d && !DEMOS.length) d.style.display = "none";
    var cs = $("#cservice"); if (cs) { cs.innerHTML = '<option value="">Choose a service</option>'; } if (cs) SV.forEach(function (s) { cs.insertAdjacentHTML("beforeend", "<option>" + esc(s[0]) + "</option>"); });
    var co = $("#cosv"); if (co) co.innerHTML = SV.map(function (s) { return "<option>" + esc(s[0]) + "</option>"; }).join("");
  }

  /* ---------- logo ---------- */
  function logo() {
    var im = $("#logoimg"); if (!im) return;
    var t = new Image(); t.onload = function () { im.src = LOGO; im.hidden = false; var lt = $(".logo .lt"); if (lt) lt.style.display = "none"; };
    t.src = LOGO;
  }

  /* ---------- menu / modals / drawers ---------- */
  var scrim = function () { return $("#scrim"); };
  function closeAll() {
    $$(".mod.on,.drawer.on,.np:not([hidden]),.cdr.on:not(.pg)").forEach(function (e) { e.classList.remove("on"); if (e.classList.contains("np")) e.hidden = true; });
    var s = scrim(); if (s) s.classList.remove("on"); var um = $("#um"); if (um) um.hidden = true;
  }
  function open(name) {
    if (name === "chat") { if (document.body.dataset.page === "chat") return; if (!session()) return openAuth("login"); closeAll(); var c = $("#chatd"); if (c) { c.classList.add("on"); drawMsgs(); } if (scrim()) scrim().classList.add("on"); return; }
    if (name === "notif") { var np = $("#np"); if (np) np.hidden = !np.hidden; return; }
    if (name === "auth") return openAuth("login");
    var m = $("#m-" + name); if (m) { closeAll(); m.classList.add("on"); }
  }
  function openAuth(tab) {
    if (document.body.dataset.page !== "login") { closeAll(); var m = $("#m-auth"); if (m) m.classList.add("on"); }
    setTab(tab || "login");
  }
  function setTab(t) {
    var f = $("#af"); if (!f) return; f.dataset.v = t;
    $$("#atabs [data-tab]").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === t); });
    var title = $("#at"), btn = $("#asub");
    if (title) title.textContent = { login: "Welcome back", signup: "Create your account", forgot: "Reset password" }[t];
    if (btn) btn.textContent = { login: "Log in", signup: "Create account", forgot: "Request reset" }[t];
    err("aerr", "");
  }
  function bindUI() {
    document.addEventListener("click", function (e) {
      var el;
      if ((el = e.target.closest("[data-open]"))) { e.preventDefault(); var n = el.dataset.open; if (n === "auth") openAuth(el.dataset.tab || "login"); else open(n); return; }
      if ((el = e.target.closest("[data-close]"))) { if (el.closest(".cdr.pg") || el.closest("#m-auth.authcard") || el.closest("#m-pay.pagecard")) return; e.preventDefault(); closeAll(); return; }
      if ((el = e.target.closest("#atabs [data-tab]"))) { setTab(el.dataset.tab); return; }
      if ((el = e.target.closest("[data-av]"))) { e.preventDefault(); setTab(el.dataset.av); return; }
      if ((el = e.target.closest("[data-logout]"))) { e.preventDefault(); store.set("session", null); location.href = "index.html"; return; }
      if ((el = e.target.closest("[data-quote]"))) { if (el.dataset.quote) store.set("quote", el.dataset.quote); return; }
      if (e.target.closest("#bg")) { var d = $("#drawer"); if (d) d.classList.add("on"); if (scrim()) scrim().classList.add("on"); return; }
      if (e.target.closest("#cls") || e.target === scrim()) { closeAll(); return; }
      if (e.target.closest("#hu")) { var um = $("#um"); if (um) um.hidden = !um.hidden; return; }
      if (e.target.closest("#bell")) { open("notif"); return; }
      if (e.target.classList && e.target.classList.contains("mod")) closeAll();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });
  }

  /* ---------- accounts ---------- */
  var rules = [["8+ characters", function (p) { return p.length >= 8; }], ["A letter", function (p) { return /[A-Za-z]/.test(p); }], ["A number", function (p) { return /\d/.test(p); }]];
  function session() { return store.get("session", null); }
  function drawRules(inp, ul) {
    if (!inp || !ul) return;
    var up = function () { ul.innerHTML = rules.map(function (r) { return '<li style="color:' + (r[1](inp.value) ? "#15803d" : "#6b7a90") + '">' + (r[1](inp.value) ? "✓ " : "○ ") + r[0] + "</li>"; }).join(""); };
    inp.addEventListener("input", up); up();
  }
  function authUI() {
    var u = session();
    if (u) document.body.setAttribute("data-auth", "1"); else document.body.removeAttribute("data-auth");
    var ha = $("#ha"), hu = $("#hu");
    if (ha) ha.style.display = u ? "none" : ""; if (hu) { hu.hidden = !u; if (u) hu.textContent = (u.name || u.email).split(" ")[0]; }
  }
  function authForm() {
    var f = $("#af"); if (!f) return;
    drawRules(f.elements.password, $("#arl"));
    setTab(location.hash === "#signup" ? "signup" : "login");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = f.dataset.v, d = {}; $$("input", f).forEach(function (i) { d[i.name] = i.value.trim(); });
      if (!emailOk(d.email)) return err("aerr", "Enter a valid email address.");
      var users = store.get("users", []);
      if (v === "forgot") { mirror("resets", { email: d.email, t: Date.now() }); err("aerr", ""); toast("Request sent. Our team will contact you."); return; }
      if (!d.password) return err("aerr", "Enter your password.");
      ready().then(function () { return sha(d.password); }).then(function (h) {
        users = store.get("users", []);
        var ex = users.filter(function (x) { return x.email.toLowerCase() === d.email.toLowerCase(); })[0];
        if (v === "signup") {
          if (!d.fullname) return err("aerr", "Enter your full name.");
          if (ex) return err("aerr", "An account with this email already exists.");
          if (!rules.every(function (r) { return r[1](d.password); })) return err("aerr", "Password does not meet the requirements.");
          if (d.password !== d.confirm) return err("aerr", "Passwords do not match.");
          ex = { name: d.fullname, email: d.email, phone: d.phone || "", h: h, created: Date.now() };
          users.push(ex); store.set("users", users); mirror("users", { name: ex.name, email: ex.email, phone: ex.phone, t: ex.created });
        } else if (!ex || ex.h !== h) return err("aerr", "Incorrect email or password.");
        store.set("session", { name: ex.name, email: ex.email, phone: ex.phone }); location.href = document.body.dataset.page === "login" ? "orders.html" : location.href;
      });
    });
  }

  /* ---------- contact ---------- */
  function contact() {
    var f = $("#cf2"); if (!f) return;
    var q = store.get("quote", ""); if (q && f.elements.service) { f.elements.service.value = q; store.set("quote", ""); }
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var d = {}; $$("input,select,textarea", f).forEach(function (i) { d[i.name] = i.value.trim(); });
      if (!d.name) return err("cerr", "Please enter your name.");
      if (!emailOk(d.email)) return err("cerr", "Enter a valid email address.");
      if (d.msg.length < 10) return err("cerr", "Please describe what you need (a sentence or two).");
      d.t = Date.now(); if (window.PRIVOK === false && window.LS) return err("cerr", "Please wait a moment and try again."); var l = store.get("inquiries", []); l.push(d); store.set("inquiries", l); mirror("inquiries", d);
      f.reset(); err("cerr", ""); toast("Inquiry sent. You'll get a reply by email.");
    });
  }

  /* ---------- chat ---------- */
  function drawMsgs() {
    var b = $("#msgs"); if (!b) return; var me = session(), m = store.get("chat", []).filter(function (x) { return me && x.email === me.email; });
    if (!m.length) m = [{ me: 0, text: "Hello! Tell us what you need and we’ll reply during business hours." }];
    b.innerHTML = m.map(function (x) { return '<div class="bub' + (x.me ? " b" : "") + '" style="max-width:85%;align-self:' + (x.me ? "flex-end" : "flex-start") + ';font-size:14px;padding:10px 12px">' + esc(x.text) + "</div>"; }).join("");
    b.scrollTop = b.scrollHeight;
  }
  function chat() {
    var ci = $("#ci"), sb = $("#csend"); if (!ci || !sb) return;
    var send = function () { if (window.PRIVOK === false && window.LS) return toast("Please wait a moment — data is still loading…"); var t = ci.value.trim(); if (!t) return; var u = session(); if (!u) return; var m = store.get("chat", []); m.push({ me: 1, email: u.email, text: t, t: Date.now() }); store.set("chat", m); mirror("chat", { email: u && u.email, text: t, t: Date.now() }); ci.value = ""; drawMsgs(); };
    sb.addEventListener("click", send); ci.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
    drawMsgs();
  }

  /* ---------- orders / payments / profile ---------- */
  function orders() {
    var ol = $("#ol"); if (!ol) return; var me = session(), o = store.get("orders", []).filter(function (x) { return me && x.email === me.email; });
    ["s1", "s2", "s3", "s4"].forEach(function (id, i) { var e = $("#" + id); if (!e) return; e.textContent = [o.length, o.filter(function (x) { return x.status === "new"; }).length, o.filter(function (x) { return x.status === "processing"; }).length, o.filter(function (x) { return x.status === "delivered"; }).length][i]; });
    ol.innerHTML = o.length ? o.map(function (x) { return '<div class="glass" style="padding:16px;margin-top:10px"><b>' + esc(x.id) + " · " + esc(x.service) + '</b> <span class="st-' + esc(x.status) + '">' + esc(x.status) + "</span></div>"; }).join("") : '<p class="bd" style="margin-top:10px">No orders yet. Start with a <a href="contact.html" style="color:var(--bl)">project inquiry</a>.</p>';
  }
  function payments() {
    var f = $("#pyf"); if (!f) return; var list = $("#phl");
    var draw = function () { var me = session(), p = store.get("payments", []).filter(function (x) { return me && x.email === me.email; }); if (list) list.innerHTML = p.length ? p.map(function (x) { return '<div class="glass" style="padding:12px;margin-top:8px">' + esc(x.oid) + " · " + esc(x.amt) + " · " + esc(x.method) + " · <i>pending verification</i></div>"; }).join("") : '<p class="bd">No payments submitted yet.</p>'; };
    draw();
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var d = {}; $$("input,select", f).forEach(function (i) { if (i.type !== "file") d[i.name] = i.value.trim(); });
      if (!d.oid || !d.amt) return err("pyerr", "Enter the order ID and the amount paid.");
      var fl = f.elements.file.files[0]; if (!fl) return err("pyerr", "Attach the receipt image.");
      d.file = fl.name; d.email = (session() || {}).email; d.t = Date.now(); var p = store.get("payments", []); p.unshift(d); store.set("payments", p); mirror("payments", d);
      f.reset(); err("pyerr", ""); draw(); toast("Payment proof submitted for verification.");
    });
  }
  function profile() {
    var f = $("#pf2"), u = session(); if (!f || !u) return;
    var parts = (u.name || "").split(" ");
    $("#pnm").textContent = u.name || ""; $("#pem").textContent = u.email || ""; $("#pph").textContent = u.phone || ""; $("#avl").textContent = (u.name || "?").charAt(0).toUpperCase();
    f.elements.first.value = parts[0] || ""; f.elements.last.value = parts.slice(1).join(" "); f.elements.email.value = u.email; f.elements.phone.value = u.phone || "";
    f.addEventListener("submit", function (e) {
      e.preventDefault(); u.name = (f.elements.first.value + " " + f.elements.last.value).trim(); u.phone = f.elements.phone.value.trim();
      store.set("session", u); var us = store.get("users", []).map(function (x) { if (x.email === u.email) { x.name = u.name; x.phone = u.phone; } return x; }); store.set("users", us);
      $("#pnm").textContent = u.name; $("#pph").textContent = u.phone; toast("Profile updated.");
    });
    var sf = $("#sf"); drawRules($("#npw"), $("#prl"));
    if (sf) sf.addEventListener("submit", function (e) {
      e.preventDefault(); var cur = sf.elements.cur.value, np = sf.elements.np.value, cp = sf.elements.cp.value;
      if (!rules.every(function (r) { return r[1](np); })) return err("serr", "New password does not meet the requirements.");
      if (np !== cp) return err("serr", "Passwords do not match.");
      sha(cur).then(function (h0) { var us = store.get("users", []), me = us.filter(function (x) { return x.email === u.email; })[0]; if (!me || me.h !== h0) return err("serr", "Current password is incorrect."); return sha(np).then(function (h1) { me.h = h1; store.set("users", us); sf.reset(); err("serr", ""); toast("Password updated."); }); });
    });
  }

  window.addEventListener("siq-change", function (e) { var k = e.detail && e.detail.key; try { if (k === "siq_services" || k === "siq_portfolio") renderCards(); if (k === "siq_chat") drawMsgs(); if (k === "siq_orders") orders(); } catch (x) {} });
  function init() {
    [logo, renderCards, bindUI, authUI, authForm, contact, chat, orders, payments, profile].forEach(function (fn) { try { fn(); } catch (e) { console.error("ShoaibScale app.js:", fn.name, e); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
