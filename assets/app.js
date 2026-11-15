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
        if (MAP[k] && (typeof LS !== "undefined")) { var v = LS.get(MAP[k], d); return v == null ? d : v; }
        var r = localStorage.getItem("ss_" + k); return r ? JSON.parse(r) : d;
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try { if (MAP[k] && (typeof LS !== "undefined")) return LS.set(MAP[k], v); localStorage.setItem("ss_" + k, JSON.stringify(v)); return true; } catch (e) { return false; }
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
    try { if ((typeof LS !== "undefined")) { var v = LS.get(key, null); if (v && v.length) return v.map(map).filter(function (x) { return x[0]; }); } } catch (e) {}
    return fallback;
  }
  function renderCards() {
    var SV = fromDB("siq_services", SERVICES, function (x) { return Array.isArray(x) ? x : [x.n || x.title || x.name, x.d || x.desc || x.description || "", Array.isArray(x.b) ? x.b.join(" · ") : (x.b || "")]; });
    var PF = fromDB("siq_portfolio", PORTFOLIO, function (x) { return Array.isArray(x) ? x : [x.t || x.title || x.name, x.k || x.tag || x.category || "Project", x.d || x.desc || x.description || ""]; });
    try {
      var hs = $$(".g3:not([id])").filter(function (g) { return g.querySelector("article.card .num"); })[0];
      if (hs && (typeof LS !== "undefined") && (LS.get("siq_services", null) || []).length) hs.innerHTML = SV.slice(0, 6).map(function (s, i) { return '<article class="card"><span class="num">' + num(i) + "</span><h3>" + esc(s[0]) + "</h3><p>" + esc(s[1]) + "</p></article>"; }).join("");
    } catch (e) {}
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
      d.t = Date.now(); if (window.PRIVOK === false && (typeof LS !== "undefined")) return err("cerr", "Please wait a moment and try again."); var l = store.get("inquiries", []); l.push(d); store.set("inquiries", l); mirror("inquiries", d);
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
    var send = function () { if (window.PRIVOK === false && (typeof LS !== "undefined")) return toast("Please wait a moment — data is still loading…"); var t = ci.value.trim(); if (!t) return; var u = session(); if (!u) return; var m = store.get("chat", []); m.push({ me: 1, email: u.email, text: t, t: Date.now() }); store.set("chat", m); mirror("chat", { email: u && u.email, text: t, t: Date.now() }); ci.value = ""; drawMsgs(); };
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

  window.addEventListener("siq-change", function (e) { var k = e.detail && e.detail.key; try { if (k === "siq_services" || k === "siq_portfolio") renderCards(); if (k === "siq_chat") drawMsgs(); if (k === "siq_orders") orders(); if (["siq_texts","siq_brand","siq_announce","siq_social"].indexOf(k) > -1) siteContent(); } catch (x) {} });

  /* ---------- admin se aane wala content: text, logo, hero, announcement, social ---------- */
  var TXR = [["brand.a","Shoaib"],["brand.b","Scale"],["brand.tag","Independent digital studio"],["hdr.cta","Discuss a project"],["nav.home","Home"],["nav.services","Services"],["nav.portfolio","Portfolio"],["nav.pricing","Pricing"],["nav.about","About"],["nav.contact","Contact"],["hero.eb","Independent digital studio"],["hero.h1a","Make your business easier to "],["hero.h1b","understand and choose."],["hero.p","Landing pages, content and translation, AI chatbots, and digital systems for businesses that want a clearer customer journey."],["hero.cta1","Discuss your project →"],["hero.cta2","Explore portfolio"],["hero.note","Clear scope · one point of contact · agreed revisions"],["hero.sbar","ShoaibScale / Project preview"],["hero.pill","One clear next step"],["hero.m.eb","Landing page concept"],["hero.m.h3","A clearer way for customers to get started."],["hero.m.p","Explain your service, answer common questions, and guide the visitor to contact you."],["hero.m.btn","Request a quote →"],["hero.c.eb","Chat assistant"],["hero.c.b1","Which service do you offer?"],["hero.c.b2","I can help you find the right option."],["strip.1t","Landing pages & websites"],["strip.1d","Clear messaging and a focused action"],["strip.2t","Content, translation & chatbots"],["strip.2d","Useful conversations in your audience’s language"],["strip.3t","Industrial digital systems"],["strip.3d","Portals, catalogues and dashboards"],["hsv.eb","Services"],["hsv.h2","Pick the help your project needs."],["hsv.more","See all services →"],["hsv.1t","Landing pages & websites"],["hsv.1d","Design, content and development for clear product and service pages."],["hsv.2t","Content & translation"],["hsv.2d","Website copy, product content and audience-aware translation."],["hsv.3t","AI chatbots"],["hsv.3d","FAQ assistants, lead capture and clear human handoff."],["hsv.4t","Custom portals & software"],["hsv.4d","ERP, inventory and workflow tools shaped around business needs."],["hsv.5t","Dashboards & monitoring"],["hsv.5d","Operational reporting, machine monitoring and shift views."],["hsv.6t","Brand systems & promo films"],["hsv.6d","Visual identity and production stories for business audiences."],["hpf.eb","Selected portfolio"],["hpf.h2","Work built around real business tasks."],["hpf.more","Browse portfolio →"],["how.eb","How it works"],["how.h2","Know the plan before the build starts."],["how.1t","1 · Brief"],["how.1d","Share your audience, goal and source material."],["how.2t","2 · Scope"],["how.2d","Agree deliverables, timeline and price."],["how.3t","3 · Draft"],["how.3d","Review a clear direction and give feedback."],["how.4t","4 · Handover"],["how.4d","Approve final work and receive the agreed files."],["cta1.h","Have a project in mind?"],["cta1.p","Tell me what you want customers, staff or visitors to do next."],["cta1.b","Start a conversation →"],["sv.eb","Services · ShoaibScale"],["sv.h1","One studio for content, customer journeys and digital tools."],["sv.p","Choose a single service or combine related work. Final scope, delivery dates and pricing are agreed after a short project brief."],["sv.b.eb","Not sure what to choose?"],["sv.b.h2","Start with the business outcome."],["sv.b.1t","Need more enquiries?"],["sv.b.1d","Start with a landing page, copy and a single CTA."],["sv.b.2t","Need fewer repeated questions?"],["sv.b.2d","Start with a verified FAQ chatbot and human handoff."],["sv.b.3t","Need clearer operations?"],["sv.b.3d","Map the workflow before scoping a portal or dashboard."],["sv.b.4t","Need to reach another market?"],["sv.b.4d","Plan translation, terminology and localized product content."],["sv.cta.h","Describe the result you need."],["sv.cta.p","I’ll help scope the right service before work starts."],["sv.cta.b","Request a project discussion →"],["pf.eb","Portfolio · Selected work"],["pf.h1","Useful digital work, shaped around the brief."],["pf.p","Examples currently shown on ShoaibScale. Each project is built around a clear business task and an agreed scope."],["pf.demo.eb","Interface demos"],["pf.demo.h2","Additional prototypes shared for review."],["pf.cta.h","Want a similar result for your project?"],["pf.cta.p","Share the goal and context; we’ll agree the scope first."],["pf.cta.b","Start a conversation →"],["pr.eb","Project planning · Clear scope"],["pr.h1","Know what’s included before you commit."],["pr.p","No placeholder totals or surprise checkout. Share the brief, then get a written scope, delivery estimate and quote for your project."],["pr.1.eb","01 · Focused task"],["pr.1.h3","Quick Start"],["pr.1.h4","Quote after brief"],["pr.1.p","For one clear, well-defined deliverable."],["pr.1.l1","Landing page or a content/translation task"],["pr.1.l2","Agreed delivery date"],["pr.1.l3","Defined revision rounds"],["pr.1.l4","Final files in the agreed format"],["pr.1.btn","Request a quote"],["pr.2.eb","02 · Combined service"],["pr.2.h3","Growth Page"],["pr.2.h4","Quote after brief"],["pr.2.p","For a page that needs strategy, content and a clear conversion path."],["pr.2.l1","Landing-page structure and copy"],["pr.2.l2","Responsive design / build"],["pr.2.l3","Contact or booking CTA"],["pr.2.l4","Optional FAQ chatbot scope"],["pr.2.btn","Discuss this package"],["pr.3.eb","03 · Custom build"],["pr.3.h3","Business System"],["pr.3.h4","Scoped individually"],["pr.3.p","For custom portals, dashboards, catalogs or multi-step work."],["pr.3.l1","Workflow and requirements discussion"],["pr.3.l2","Milestones and acceptance criteria"],["pr.3.l3","Agreed handover plan"],["pr.3.l4","Support quoted separately"],["pr.3.btn","Plan a custom project"],["pr.b.eb","Before work begins"],["pr.b.h2","Your proposal should answer these questions."],["pr.b.1t","What will be delivered?"],["pr.b.1d","List pages, features, languages and file formats."],["pr.b.2t","When will it arrive?"],["pr.b.2d","Set a realistic schedule and review dates."],["pr.b.3t","What feedback is included?"],["pr.b.3d","Agree revision rounds and what counts as new scope."],["pr.b.4t","How will payment work?"],["pr.b.4d","Write the agreed milestone and payment terms."],["pr.f.h2","Quick answers"],["pr.f.1q","Why don’t you show a fixed price for every service?"],["pr.f.1a","Every brief is different in audience, content, languages and integrations. A short written scope lets us agree a price that matches the real work."],["pr.f.2q","Do I have to buy the full package?"],["pr.f.2a","No. You can start with one focused task and add related work later."],["pr.f.3q","Can I ask for multiple concepts?"],["pr.f.3a","Yes — the number of concepts is agreed in the proposal, so the scope and revisions stay clear."],["pr.cta.h","Get a clear project quote."],["pr.cta.p","Send a short brief and the key details you already have."],["pr.cta.b","Send a brief →"],["ab.eb","About · ShoaibScale"],["ab.h1","Practical digital support, with a clear point of contact."],["ab.p","ShoaibScale is an independent digital studio serving businesses that need clearer content, better customer journeys or useful internal tools."],["ab.tag","Solo-led project delivery"],["ab.what.eb","What I do"],["ab.p1","I work across landing pages, business websites, content writing, translation, AI chatbots and custom digital systems. For industrial and B2B teams, that can include catalogues, operational dashboards and workflow portals."],["ab.p2","The process starts with the goal and the facts you can verify. Before design or development begins, the deliverables, timeline, price and review rounds should be written down so both sides know what to expect."],["ab.m.1t","Clear scope"],["ab.m.1d","Agree the deliverable before production."],["ab.m.2t","Honest proof"],["ab.m.2d","Use real examples and approved claims."],["ab.m.3t","Simple handoff"],["ab.m.3d","Explain files, access and next steps."],["ab.m.4t","Right-size the solution"],["ab.m.4d","Build what the brief actually needs."],["ab.w.eb","Working together"],["ab.w.h2","From first message to handover."],["ab.w.1t","Discovery"],["ab.w.1d","Audience, problem, desired action."],["ab.w.2t","Proposal"],["ab.w.2d","Scope, price, schedule and revisions."],["ab.w.3t","Build"],["ab.w.3d","Draft, review and agreed changes."],["ab.w.4t","Handover"],["ab.w.4d","Final files and basic usage notes."],["ab.cta.h","Let’s scope the right first step."],["ab.cta.p","Share what you’re trying to improve and what you already have."],["ab.cta.b","Contact ShoaibScale →"],["ct.eb","Contact · Project inquiry"],["ct.h1","Tell me what you’re trying to get done."],["ct.p","Share the business goal, who the work is for and what materials you already have. You’ll get a reply about fit, scope and next steps."],["ct.dk.h","Make the first message simple."],["ct.dk.p","You don’t need a perfect brief. Start with the problem or result you care about."],["ct.dk.1t","Useful to include"],["ct.dk.1d","Service · audience · deadline · links or examples"],["ct.dk.2t","Contact details"],["ct.dk.3t","What happens next"],["ct.dk.3d","You’ll get a reply by email about fit, scope and next steps."],["ct.f.h","Project inquiry"],["ct.f.p","Tell us about your project and we’ll reply by email."],["ct.f.btn","Send inquiry →"],["faq.eb","Help & policies"],["faq.h1","Answers and policy pages."],["faq.p","Quick answers about quotes, revisions and how projects are run, plus our terms and privacy notice."],["faq.h2","Frequently asked questions"],["faq.1q","What should I send before getting a quote?"],["faq.1a","Tell me your service, target audience, desired outcome, deadline and any reference material or existing content."],["faq.2q","How do project revisions work?"],["faq.2a","Revision rounds are agreed in the proposal before work starts. Feedback within the agreed scope is included; new requests are quoted separately."],["faq.3q","Do you offer landing pages, content and chatbots?"],["faq.3a","Yes — landing pages, business websites, content writing, translation and AI chatbots, each scoped around your goal."],["faq.4q","Can you build industrial software and dashboards?"],["faq.4a","Yes. ERP-style portals, inventory tools, machine-monitoring dashboards and compliance trackers; the workflow is discussed before scoping."],["faq.t.h","Terms & project agreement"],["faq.t.p","How scope, payment, delivery, revisions, ownership and support are handled for each project."],["faq.t.b","Read terms"],["faq.v.h","Privacy notice"],["faq.v.p","What the inquiry and order forms collect, why we collect it, who can access it and how to request correction or deletion."],["faq.v.b","Read privacy notice"],["faq.cta.h","Still unsure what to request?"],["faq.cta.p","Send a short description of the problem and we can scope the first step."],["faq.cta.b","Contact →"],["terms.h","Terms & project agreement"],["terms.1h","1. Scope & orders"],["terms.1p","Each project is based on the written scope agreed in chat or email. Work outside the agreed scope is quoted separately before it starts."],["terms.2h","2. Payment"],["terms.2p","Payment terms are agreed in the written proposal. Work begins once the agreed payment is confirmed. Delivered files are released after payment is verified."],["terms.3h","3. Revisions"],["terms.3p","Revision rounds are agreed in the proposal. Revisions must stay within the original brief; new requests are quoted separately."],["terms.4h","4. Ownership"],["terms.4p","On full payment, rights to the final deliverables transfer to you. We may reference the project in our portfolio unless you ask us not to."],["terms.5h","5. Cancellation & refunds"],["terms.5p","Cancellation and refund conditions are written into each proposal and depend on the work already completed."],["terms.6h","6. Privacy"],["terms.6p","Your files and data are used only to deliver your project and are never sold."],["terms.note","Draft — have this reviewed before relying on it as legal text."],["privacy.h","Privacy notice"],["privacy.1h","What we collect"],["privacy.1p","Name, email, phone, company, inquiry and order briefs, files you upload and payment receipts you submit."],["privacy.2h","How we use it"],["privacy.2p","Only to reply to inquiries, deliver your orders, verify payments and support you. We never sell your data."],["privacy.3h","Who can see it"],["privacy.3p","You and our admin team. Delivered files are released to you after payment verification."],["privacy.5h","Site analytics"],["privacy.5p","We record basic visit information — device type, browser, pages viewed and, if you are logged in, your account email — to understand how the site is used. This is not shared with third parties."],["privacy.4h","Your choices"],["privacy.4p","Ask us via Live Chat or the contact form to correct or delete your data."],["privacy.note","Draft — have it reviewed before launch."],["foot.faq","FAQ"],["foot.terms","Terms"],["foot.privacy","Privacy"],["foot.copy","© 2026 ShoaibScale · Independent digital studio."],["acct.s1","Total orders"],["acct.s2","Pending"],["acct.s3","In progress"],["acct.s4","Delivered"],["acct.hist","Order history"],["acct.pi","Personal information"],["acct.save","Save changes"],["acct.sec","Security"],["acct.pw","Update password"],["acct.since","Member since"],["acct.pay","Submit payment proof"],["acct.upd1","Work in progress update"],["acct.upd2","Delivery from our team"],["acct.inst","Instructions"],["acct.revwin","Revision window closes in:"],["acct.req","Request revision"],["acct.appr","Approve delivery"],["pay.info","Payment account details are shared in Live Chat once you place your order. Pay the exact amount, then upload the receipt below."],["chat.h","Support chat"],["chat.sub","Our team replies during business hours"],["chat.welcome","Hi 👋 Share your project details and our team will reply here."],["chat.auto","Thanks — we’ve received your message. A team member will reply here during business hours."],["meta.title","ShoaibScale — Independent digital studio"]];
  var SOF = ["email","phone","whatsapp","linkedin","fiverr","upwork","instagram","facebook","x","github","youtube","tiktok"];
  function applyTexts() {
    var tx = {}; try { tx = (typeof LS !== "undefined" && LS.get("siq_texts", {})) || {}; } catch (e) {}
    $$("[data-t]").forEach(function (el) { var k = el.getAttribute("data-t"); if (el.__d === undefined) el.__d = el.textContent; if (!el.children.length) el.textContent = (tx[k] != null && tx[k] !== "") ? tx[k] : el.__d; });
    var byDef = {}; TXR.forEach(function (r) { if (!(r[1] in byDef)) byDef[r[1]] = r[0]; });
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) { var p = n.parentNode && n.parentNode.nodeName; if (p === "SCRIPT" || p === "STYLE") continue; list.push(n); }
    list.forEach(function (n) {
      if (n.__o === undefined) { var tr = n.nodeValue.trim(); n.__o = byDef[tr] ? tr : null; }
      if (!n.__o) return;
      var key = byDef[n.__o], val = tx[key] != null && tx[key] !== "" ? tx[key] : n.__o;
      var cur = n.nodeValue.trim(); if (cur !== val) n.nodeValue = n.nodeValue.replace(cur, val);
    });
  }
  function applyBrand() {
    var b = {}; try { b = (typeof LS !== "undefined" && LS.get("siq_brand", {})) || {}; } catch (e) {}
    var im = $("#logoimg"), lt = $(".logo .lt");
    if (im && b.logo) { im.src = b.logo; im.hidden = false; }
    if (lt) lt.style.display = (b.logo && b.showText === false) ? "none" : "";
    var h = $("#heroimg"); if (h && b.hero) { h.src = b.hero; h.hidden = false; }
  }
  function applyAnnounce() {
    var a = {}; try { a = (typeof LS !== "undefined" && LS.get("siq_announce", {})) || {}; } catch (e) {}
    var bar = $("#annbar");
    if (!a.on || !a.text) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement("div"); bar.id = "annbar"; bar.style.cssText = "background:#2563eb;color:#fff;text-align:center;padding:8px 14px;font:600 14px/1.4 system-ui,sans-serif"; document.body.insertBefore(bar, document.body.firstChild); }
    bar.textContent = a.text;
  }
  function applySocial() {
    var s = {}; try { s = (typeof LS !== "undefined" && LS.get("siq_social", {})) || {}; } catch (e) {}
    var f = $("#fsoc"), wa = $("#wa");
    if (wa) { var d = String(s.whatsapp || "").replace(/\D/g, ""); if (d) { wa.href = "https://wa.me/" + d; wa.hidden = false; } else wa.hidden = true; }
    if (f) f.innerHTML = SOF.filter(function (k) { return s[k] && k !== "whatsapp"; }).map(function (k) {
      var v = String(s[k]).trim(), href = k === "email" ? "mailto:" + v : k === "phone" ? "tel:" + v : v;
      return '<a href="' + esc(href) + '" target="_blank" rel="noopener" style="margin-right:10px">' + esc(k.charAt(0).toUpperCase() + k.slice(1)) + "</a>";
    }).join("");
  }
  function siteContent() { [applyTexts, applyBrand, applyAnnounce, applySocial].forEach(function (fn) { try { fn(); } catch (e) { console.error(fn.name, e); } }); }
  function init() {
    [logo, renderCards, siteContent, bindUI, authUI, authForm, contact, chat, orders, payments, profile].forEach(function (fn) { try { fn(); } catch (e) { console.error("ShoaibScale app.js:", fn.name, e); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
