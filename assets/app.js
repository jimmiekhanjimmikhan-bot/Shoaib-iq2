/* ShoaibScale front-end (shared by every page) */
/* ===== ShoaibScale front-end (light theme). Firebase Realtime Database. ===== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* $p: for elements that only exist on some pages (returns a harmless dummy when absent) */
const $p=s=>document.querySelector(s)||document.createElement('div');
/* accounts may exist in an older/array format (other app.js versions): always read them as an object keyed by email */
function getUsers(){let u=LS.get("siq_users",{});if(Array.isArray(u)){const o={};u.forEach(x=>{if(!x||!x.email)return;o[String(x.email).toLowerCase()]={name:x.name||'',phone:x.phone||'',salt:x.salt!==undefined?x.salt:'',pass:x.pass||x.h||'',created:x.created||Date.now(),company:x.company||'',country:x.country||'',avatar:x.avatar||''}});u=o;if(window.PRIVOK)LS.set("siq_users",o)}return u&&typeof u==='object'?u:{}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=n=>`<svg class="i"><use href="#${n}"/></svg>`;
function toast(t){const e=$('#ts');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),3000)}
let users=getUsers(),orders=LS.get('siq_orders',[]),pays=LS.get('siq_pays',[]),sess=(s=>s&&typeof s==='object'&&s.email?String(s.email).toLowerCase():s)(LS.get('siq_sess',null)),cur=LS.get('siq_cur','USD'),afterAuth=null,nc=0,unread=0,acked=false;
const PAGE=document.body.dataset.page||'home',onAcct=PAGE==='account'||PAGE==='orders',GATED=['account','orders','chat','payment'];
const URLS={home:'index.html',services:'services.html',portfolio:'portfolio.html',pricing:'pricing.html',about:'about.html',contact:'contact.html',faq:'faq.html',blog:'blog.html',orders:'orders.html',profile:'account.html',chat:'chat.html',payment:'payment.html',login:'login.html'};
const me=()=>sess?users[sess]:null,mine=()=>orders.filter(o=>o.email===sess).sort((a,b)=>b.createdAt-a.createdAt);
const saveOrders=()=>{const r=LS.set('siq_orders',orders);snapOrders();return r},dt=t=>new Date(t).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'});
const RATE={USD:1,PKR:278,EUR:.92,AED:3.67},SYM={USD:'$',PKR:'Rs ',EUR:'€',AED:'AED '};
const money=u=>SYM[cur]+Math.round(u*RATE[cur]).toLocaleString('en');
const T=(k,d)=>{const o=LS.get('siq_texts',null)||{},v=o[k];return typeof v==='string'&&v.trim()?v:d};
const DLV=()=>LS.get('siq_dlv',null)||{},FRES={},FPRO={};

const isPayApproved=oid=>{
  const p=LS.get('siq_pays',[]);
  return p.some(x=>String(x.orderId)===String(oid)&&x.state==='Verified');
};

function readImageAsDataURL(file,max=1000,q=0.7){
  return new Promise((res,rej)=>{
    if(!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return rej('Only PNG, JPG or WebP images are allowed');
    if(file.size > 5*1024*1024) return rej('Image must be under 5 MB');
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = () => rej('The image could not be opened');
      im.onload = () => {
        const s = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width  = Math.max(1, Math.round(im.width  * s));
        c.height = Math.max(1, Math.round(im.height * s));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------- passwords ---------- */
const RULES=[['8+ characters',p=>p.length>=8],['Uppercase',p=>/[A-Z]/.test(p)],['Lowercase',p=>/[a-z]/.test(p)],['Number',p=>/\d/.test(p)],['Special character',p=>/[^A-Za-z0-9]/.test(p)]];
const pwOk=p=>RULES.every(r=>r[1](p)),rulesUI=(ul,p)=>ul.innerHTML=RULES.map(r=>`<li class="${r[1](p)?'ok':''}">${r[0]}</li>`).join('');
async function hash(p,salt){const d=new TextEncoder().encode(salt+p);if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',d);return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}return btoa(salt+p)}
const PHONE=/^\+?[0-9\s-]{7,16}$/,MAIL=/^\S+@\S+\.\S+$/;

/* ---------- services (admin can override via siq_services) ---------- */
const SV=LS.get('siq_services',null)||[
 {id:'landing',n:'Landing page design & development',d:'Focused pages that explain an offer and make the next step easy.',p:0,b:['Page structure and conversion copy','Responsive design and build','Forms, booking or WhatsApp CTA']},
 {id:'sites',n:'Business websites & catalogues',d:'Professional websites for service businesses, manufacturers and suppliers.',p:0,b:['Company and service pages','Export catalogues and product pages','RFQ / enquiry forms']},
 {id:'copy',n:'Content writing & copywriting',d:'Clear website, product and campaign content based on your actual offer.',p:0,b:['Website and landing-page copy','Product descriptions and FAQs','Proofread and tone-matched content']},
 {id:'trans',n:'Translation & localization',d:'Translate for the audience and market—not just word for word.',p:0,b:['Website and product translation','Terminology and tone alignment','Language review with your glossary']},
 {id:'bot',n:'AI chatbot development',d:'Answer approved FAQs, guide visitors and route complex queries to a person.',p:0,b:['Knowledge and FAQ setup','Website chat flows','Human escalation and handoff']},
 {id:'erp',n:'ERP, inventory & business portals',d:'Web tools for operational processes that are hard to manage in spreadsheets.',p:0,b:['Orders, stock and dispatch workflows','Role-based views','Custom internal portals']},
 {id:'dash',n:'Dashboards & machine monitoring',d:'Bring production, uptime and shift information into a useful view.',p:0,b:['Machine and operations dashboards','Downtime and shift reporting','Multi-site visibility']},
 {id:'safety',n:'Safety & compliance trackers',d:'Make routine checklists, incidents and expiry dates easier to follow.',p:0,b:['Audit and inspection checklists','Incident logging','Certificate and expiry reminders']},
 {id:'brand',n:'Brand systems & promo films',d:'Visual assets that help explain a company, product or production process.',p:0,b:['Brand identity and design assets','Factory / product promotional films','Short social-ready edits']}];
const AO=[['Source files',60],['SEO setup',90],['Copywriting',120],['Priority support',80]];
const renderSV=()=>{
 $p('#sg').innerHTML=SV.map((s,i)=>{const b=Array.isArray(s.b)?s.b:[];
  const act=+s.p>0?`<div class="pr"><div><small>Starting at</small><b>${money(+s.p)}</b></div><button class="btn b1" data-buy="${esc(s.id)}">Order</button></div>`:`<a class="ql" href="contact.html" data-quote="${esc(s.n)}">Request a quote →</a>`;
  return `<article class="card"><span class="num">${String(i+1).padStart(2,'0')}</span><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p>${b.length?`<ul>${b.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${act}</article>`}).join('');
 const cs=$p('#cservice');if(cs){const v=cs.value;cs.innerHTML='<option value="">Choose a service</option>'+SV.map(s=>`<option>${esc(s.n)}</option>`).join('')+'<option>Not sure yet</option>';cs.value=v}};

/* ---------- navigation ---------- */
const PAGES=['home','services','portfolio','pricing','about','contact','faq'];
function closeAll(){['#drawer','#chatd'].forEach(x=>{if(!(x==='#chatd'&&PAGE==='chat'))$(x).classList.remove('on')});$$('.mod.on').forEach(m=>m.classList.remove('on'));$('#scrim').classList.remove('on');$('#np').hidden=true;$('#um').hidden=true}
const openM=id=>{closeAll();$('#m-'+id).classList.add('on')};
function needAuth(cb){afterAuth=cb||null;authView('login');openM('auth')}
const requireAuth=cb=>me()?cb():needAuth(cb);
function go(t){closeAll();if(t==='projects')t='portfolio';
 if((t==='orders'||t==='profile')&&!me())return needAuth(()=>go(t));
 location.href=URLS[t]||URLS.home}
function authView(v){const f=$('#af');f.dataset.v=v;$('#at').textContent={login:'Welcome back',signup:'Create your account',forgot:'Reset your password'}[v];$('#asub').textContent={login:'Log in',signup:'Create account',forgot:'Request reset'}[v];$('#aerr').textContent='';$('#atabs').hidden=v==='forgot';$$('#atabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===v));f.elements.password.autocomplete=v==='signup'?'new-password':'current-password';rulesUI($('#arl'),f.elements.password.value)}
$('#af').onsubmit=async e=>{e.preventDefault();await PRIV;const f=e.target,v=f.dataset.v,d=Object.fromEntries(new FormData(f)),em=(d.email||'').trim().toLowerCase(),fail=m=>{$('#aerr').textContent=m};
 if(!MAIL.test(em))return fail('Enter a valid email address.');users=getUsers();if(v!=='forgot'){const bl=blocked(em,d.phone||(users[em]||{}).phone);if(bl)return fail('This email/phone is blacklisted. '+(bl.reason||'')+' Contact support.')}
 if(v==='forgot'){const c=LS.get('siq_contacts',[]);c.push({name:'Password reset',email:em,topic:'Existing order',msg:'Password reset requested for '+em,at:Date.now()});LS.set('siq_contacts',c);f.reset();authView('login');return toast('Reset request sent to support — we will contact you by email.')}
 if(v==='signup'){const n=d.fullname.trim();if(n.length<2)return fail('Enter your full name.');if(!PHONE.test(d.phone.trim()))return fail('Enter a valid phone number.');
  if(!pwOk(d.password))return fail('Password must meet all the rules below.');if(d.password!==d.confirm)return fail('Passwords do not match.');if(users[em])return fail('An account with this email already exists.');
  const salt=Math.random().toString(36).slice(2);users[em]={name:n,phone:d.phone.trim(),salt,pass:await hash(d.password,salt),created:Date.now(),company:'',country:'',avatar:''};try{await LS.setNow('siq_users',users)}catch(x){delete users[em];CACHE.siq_users=JSON.stringify(users);return fail('Could not save your account ('+String(x&&x.message||x).replace(/^Error: /,'')+'). Please try again or contact support.')}}
 else{const u=users[em];if(!u||u.pass!==await hash(d.password,u.salt))return fail('Incorrect email or password.')}
 {const bn=banInfo(users[em]);if(bn)return fail('This account is banned. '+(bn.reason?'Reason: '+bn.reason+'. ':'')+(bn.until?'Until '+dt(bn.until)+'. ':'')+'Contact support.')}
 sess=em;LS.set('siq_sess',sess);snapOrders();snapPays();f.reset();closeAll();renderAuth();toast(v==='signup'?'Account created — welcome!':'Logged in');
 loadChat();setNc();if(onAcct)renderAcct();
 if(PAGE==='login'){const nx=new URLSearchParams(location.search).get('next');return void(location.href=/^[a-z-]+\.html$/.test(nx||'')?nx:URLS.orders)}
 if(PAGE==='payment'&&!afterAuth)openPay(new URLSearchParams(location.search).get('order')||'');
 if(afterAuth){const c=afterAuth;afterAuth=null;c()}};
function renderAuth(){const u=me(),pend=!u&&sess&&!window.PRIVOK,on=!!u||!!pend;document.body.toggleAttribute('data-auth',on);$('#ha').hidden=on;$('#hu').hidden=!on;
 if(on){let n='Account';if(u){n=u.name;try{localStorage.setItem('siq_sname',n)}catch(e){}}else{try{n=localStorage.getItem('siq_sname')||n}catch(e){}}$('#hu').innerHTML=`<span class="mi">${esc(n[0].toUpperCase())}</span>${esc(n.split(' ')[0])}`}}
function logout(){sess=null;LS.set('siq_sess',null);renderAuth();closeAll();if(GATED.includes(PAGE))return go('home');toast('Logged out')}
const STAT={pending:['New','Awaiting Payment'],prog:['Processing','Revision Requested'],done:['Delivered','Completed']},slug=s=>s.toLowerCase().replace(/ /g,'-');

function payLockNotice(o){
  const dlv = DLV()[o.id]||{};
  const hasProgress = dlv['Processing'] && ((dlv['Processing'].files||[]).length||dlv['Processing'].note);
  const hasDelivery = dlv['Delivered'] && ((dlv['Delivered'].files||[]).length||dlv['Delivered'].note);
  if(!hasProgress && !hasDelivery) return '';
  const lbl = hasDelivery ? 'Delivery ready — locked 🔒' : 'Work in progress — locked 🔒';
  const msg = hasDelivery
    ? 'Your delivery is ready, but files stay <b>hidden until the admin verifies your payment</b>. Click <b>Preview</b> to see a sample, or wait for verification to unlock the real files, images and instructions.'
    : 'We are working on your order. Updates will <b>stay hidden until the admin verifies your payment</b>.';
  return `<div class="dlv paylock"><div class="dh"><b>${ic('lock')} ${lbl}</b></div>
  <div class="dn" style="margin:0"><span>${esc(T('acct.inst','Note'))}</span>${msg}</div>
  </div>`;
}

function renderAcct(){
 if(!onAcct)return;const u=me();if(!u)return;const m=mine(),f=$p('#pf2').elements||{first:{},last:{},email:{},phone:{},company:{},country:{}},[fi,...la]=u.name.split(' ');
 $p('#pnm').textContent=u.name;$p('#pem').textContent=sess;$p('#pph').textContent=u.phone;$p('#psn').textContent=T('acct.since','Member since')+' '+dt(u.created);$p('#avl').textContent=u.name[0].toUpperCase();$p('#avi').hidden=!u.avatar;if(u.avatar)$p('#avi').src=u.avatar;
 f.first.value=fi;f.last.value=la.join(' ');f.email.value=sess;f.phone.value=u.phone;f.company.value=u.company||'';f.country.value=u.country||'';
 $p('#s1').textContent=m.length;$p('#s2').textContent=m.filter(o=>STAT.pending.includes(o.status)).length;$p('#s3').textContent=m.filter(o=>STAT.prog.includes(o.status)).length;$p('#s4').textContent=m.filter(o=>STAT.done.includes(o.status)).length;
 $p('#ol').innerHTML=m.length?m.map(o=>{
  const pay=['New','Awaiting Payment'].includes(o.status),dl=o.status==='Delivered',approved=isPayApproved(o.id);
  const previewBtn=`<button class="btn b2" data-preview="${o.id}">${ic('eye')} Preview</button>`;
  const dlBtn = approved
    ? `<button class="btn b1" data-download="${o.id}">${ic('dl')} Download</button>`
    : `<button class="btn b2" disabled title="Unlocks after payment is verified">${ic('lock')} Download locked</button>`;
  return `<div class="glass ord"><div class="top"><div><b>${esc(o.id)}</b> · ${esc(o.svc)} <span style="color:var(--mu)">(${esc(o.pkg)})</span><div style="color:var(--mu);font-size:13px">${money(o.amt)} · placed ${dt(o.createdAt)} · due ${esc(o.deadline)} · ${esc(o.method)}</div></div><span class="bdg st-${slug(o.status)}">${esc(o.status)}</span></div>
${approved ? dlvHTML(o) : payLockNotice(o)}${pay?`<button class="btn b2" style="margin-top:12px" data-pay="${o.id}">${ic('up')} ${esc(T('acct.pay','Submit payment proof'))}</button>`:''}
${dl?`<div style="margin-top:12px;font-size:13px;color:var(--mu)">${esc(T('acct.revwin','Revision window closes in:'))}</div><div class="cd" data-end="${o.deliveredAt+72*36e5}"><div><span>00</span><small>days</small></div><div><span>00</span><small>hrs</small></div><div><span>00</span><small>min</small></div><div><span>00</span><small>sec</small></div></div>
<div class="ord-actions">
 ${previewBtn}
 ${dlBtn}
 ${approved?'':`<span class="lock-hint">${ic('lock')} Download unlocks once payment is verified</span>`}
 <button class="btn b2" data-rev="${o.id}">${esc(T('acct.req','Request revision'))}</button>
 <button class="btn b1" data-ok="${o.id}">${esc(T('acct.appr','Approve delivery'))}</button>
</div>`:''}
</div>`}).join(''):`<div class="glass ord bd">No orders yet. <a href="services.html" data-go="services" style="color:var(--bl)">Browse services</a> to place your first order.</div>`;
 tick();hydrateDlv();
}

function tick(){$$('.cd').forEach(c=>{let ms=+c.dataset.end-Date.now();c.classList.toggle('x',ms<=0);ms=Math.max(ms,0);[864e5,36e5,6e4,1e3].forEach((u,i)=>{const x=Math.floor(ms/u);ms-=x*u;c.querySelectorAll('span')[i].textContent=String(x).padStart(2,'0')})})}setInterval(tick,1000);
window.SIQ={setStatus(id,st){const o=orders.find(x=>x.id===id);if(!o)return false;o.status=st;if(st==='Delivered')o.deliveredAt=Date.now();saveOrders();renderAcct();return true},markDelivered(id){return SIQ.setStatus(id,'Delivered')}};
$p('#pf2').onsubmit=e=>{e.preventDefault();const f=e.target.elements,u=me(),er=$('#perr');const n=(f.first.value.trim()+' '+f.last.value.trim()).trim();
 if(f.first.value.trim().length<2)return er.textContent='Enter your first name.';if(!PHONE.test(f.phone.value.trim()))return er.textContent='Enter a valid phone number.';er.textContent='';
 Object.assign(u,{name:n,phone:f.phone.value.trim(),company:f.company.value.trim(),country:f.country.value});LS.set('siq_users',users);renderAuth();renderAcct();toast('Profile updated')};
$p('#npw').oninput=e=>rulesUI($p('#prl'),e.target.value);
$p('#sf').onsubmit=async e=>{e.preventDefault();await PRIV;const f=e.target.elements,u=me(),er=$('#serr');
 if(u.pass!==await hash(f.cur.value,u.salt))return er.textContent='Current password is incorrect.';if(!pwOk(f.np.value))return er.textContent='New password must meet all the rules.';
 if(f.np.value!==f.cp.value)return er.textContent='New passwords do not match.';if(f.np.value===f.cur.value)return er.textContent='Choose a different password.';
 u.salt=Math.random().toString(36).slice(2);u.pass=await hash(f.np.value,u.salt);LS.set('siq_users',users);e.target.reset();rulesUI($p('#prl'),'');er.textContent='';toast('Password updated')};
$p('#avf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f||!f.type.startsWith('image/'))return toast('Choose an image file');readImageAsDataURL(f,160,0.8).then(d=>{me().avatar=d;LS.set('siq_users',users);renderAcct()}).catch(m=>toast(typeof m==='string'?m:'Photo could not be processed'))};

/* ---------- checkout (only for services that have a price) ---------- */
const svcs=()=>SV.filter(s=>+s.p>0);
$('#coao').innerHTML=AO.map(a=>`<label><input type="checkbox" data-n="${a[0]}" data-p="${a[1]}"> ${a[0]} <span style="margin-left:auto;color:var(--mu)">+$${a[1]}</span></label>`).join('');
const co={};
function coCalc(){const f=$('#cof').elements,s=svcs().find(x=>x.id===f.service.value);if(!s)return;const m=+f.pkg.value,pk=f.pkg.options[f.pkg.selectedIndex].text,base=Math.round(s.p*m),ad=$$('#coao input:checked');
 co.s=s;co.pk=pk;co.ad=ad.map(a=>a.dataset.n);co.total=base+ad.reduce((a,c)=>a+ +c.dataset.p,0);
 $('#sl').innerHTML=`<div class="ln"><span>${esc(s.n)} — ${pk}</span><b>${money(base)}</b></div>`+ad.map(a=>`<div class="ln"><span>${a.dataset.n}</span><b>${money(+a.dataset.p)}</b></div>`).join('');$('#st').textContent=$('#tt').textContent=money(co.total)}
function openCheckout(id){if(!svcs().length)return go('contact');requireAuth(()=>{const u=me(),f=$('#cof').elements;openM('co');$('#coerr').textContent='';f.fullname.value=u.name;f.email.value=sess;f.phone.value=u.phone;f.brief.value='';f.file.value='';$$('#coao input').forEach(c=>c.checked=false);
 $('#cosv').innerHTML=svcs().map(s=>`<option value="${esc(s.id)}">${esc(s.n)}</option>`).join('');if(svcs().some(s=>s.id===id))f.service.value=id;const t=new Date(Date.now()+864e5*8);f.deadline.value=t.toISOString().slice(0,10);f.deadline.min=new Date(Date.now()+864e5).toISOString().slice(0,10);coCalc()})}
$('#cof').addEventListener('input',coCalc);
$('#cof').onsubmit=e=>{e.preventDefault();const f=e.target.elements,er=$('#coerr'),bad=m=>er.textContent=m;
 if(!co.s)return bad('Choose a service.');
 if(f.fullname.value.trim().length<2)return bad('Enter your full name.');if(!MAIL.test(f.email.value.trim()))return bad('Enter a valid email.');if(!PHONE.test(f.phone.value.trim()))return bad('Enter a valid phone number.');
 if(f.brief.value.trim().length<20)return bad('Please describe your project (at least 20 characters).');if(!f.deadline.value||new Date(f.deadline.value)<=new Date())return bad('Choose a delivery deadline in the future.');
 const seq=LS.get('siq_seq',1043);LS.set('siq_seq',seq+1);
 const o={id:'SIQ-'+seq,email:sess,svc:co.s.n,pkg:co.pk,addons:co.ad,amt:co.total,brief:f.brief.value.trim(),deadline:f.deadline.value,method:e.target.elements.method.value,attachment:f.file.files[0]?f.file.files[0].name:'',contact:{name:f.fullname.value.trim(),email:f.email.value.trim(),phone:f.phone.value.trim()},status:'New',createdAt:Date.now()};
 orders.push(o);if(!saveOrders())return;closeAll();notify('Order '+o.id+' placed. Next step: submit your payment proof.',URLS.payment);toast(`Order ${o.id} placed ✔`);setTimeout(()=>go('orders'),1200)};
const need=['New','Awaiting Payment'];
function openPay(id){requireAuth(()=>{openM('pay');const f=$('#pyf').elements;$('#pcur').textContent=cur;$('#oids').innerHTML=mine().map(o=>`<option value="${o.id}">`).join('');f.oid.value=id||'';f.amt.value='';f.file.value='';$('#pvw').hidden=true;$('#pyerr').textContent='';if(id)f.amt.value=Math.round(orders.find(o=>o.id===id).amt*RATE[cur]);histPay()})}
const histPay=()=>{const h=pays.filter(p=>p.email===sess).sort((a,b)=>b.at-a.at);$('#phl').innerHTML=h.length?h.map(p=>`<div class="hi"><span><b>${esc(p.orderId)}</b> · ${esc(p.method)}<br><small style="color:var(--mu)">${dt(p.at)} · ${esc(p.file)}</small></span><span style="text-align:right">${esc(p.cur)} ${p.amount.toLocaleString('en')}<br><span class="bdg st-processing">${esc(p.state)}</span></span></div>`).join(''):'<p class="bd" style="font-size:14px">No payments submitted yet.</p>'};
$('#pyf').elements.file.onchange=e=>{const f=e.target.files[0];if(f&&f.type.startsWith('image/')){$('#pvw').src=URL.createObjectURL(f);$('#pvw').hidden=false}else $('#pvw').hidden=true};

$('#pyf').onsubmit=async e=>{
 e.preventDefault();await PRIV;
 const f=e.target.elements,er=$('#pyerr');
 const o=mine().find(x=>x.id.toLowerCase()===f.oid.value.trim().toLowerCase());
 const fl=f.file.files[0];
 if(!o)return er.textContent='Order ID not found in your orders.';
 if(!(+f.amt.value>0))return er.textContent='Enter the amount you paid.';
 if(!fl||!fl.type.startsWith('image/'))return er.textContent='Upload a receipt image (JPG/PNG).';
 if(fl.size>5e6)return er.textContent='Receipt must be under 5 MB.';
 let receiptData='';
 try{receiptData=await readImageAsDataURL(fl)}
 catch(err){return er.textContent=(typeof err==='string'?err:'The receipt could not be processed.')}
 pays.push({id:'PAY-'+Date.now(),email:sess,orderId:o.id,amount:+f.amt.value,cur,method:f.method.value,file:fl.name,receipt:receiptData,at:Date.now(),state:'Pending verification'});
 if(need.includes(o.status))o.status='Processing';
 LS.set('siq_pays',pays);snapPays();
 saveOrders();
 e.target.reset();
 $('#pvw').hidden=true;
 er.textContent='';
 histPay();
 renderAcct();
 toast('Payment proof submitted — verification pending');
};

const NK=()=>'siq_nf_'+(sess||'');
const nfGet=()=>{try{return JSON.parse(localStorage.getItem(NK())||'[]')}catch(e){return[]}};
const nfSet=a=>{try{localStorage.setItem(NK(),JSON.stringify(a.slice(0,50)))}catch(e){}};
const setNc=()=>{nc=sess?nfGet().filter(n=>!n.read).length:0;['#nc','#nc2'].forEach(q=>{const e=$(q);e.hidden=!nc;e.textContent=nc})};
function renderNf(){const a=nfGet();$('#nl').innerHTML=a.length?a.map(n=>`<a class="nf${n.read?'':' un'}" href="${esc(n.link||'#')}"><b>${esc(n.text)}</b><small>${dt(n.at)} · ${hm(n.at)}</small></a>`).join(''):'<p class="bd" style="font-size:13px;padding:12px">No notifications yet. Updates on your orders, payments and chat will appear here.</p>';
 $('#nperm').hidden=!('Notification' in window)||Notification.permission!=='default'}
function notify(text,link){if(!sess)return;if(text){const a=nfGet();a.unshift({id:Date.now()+Math.random(),text,link:link||'',at:Date.now(),read:false});nfSet(a)}setNc();
 $('#bell').classList.add('ring');setTimeout(()=>$('#bell').classList.remove('ring'),800);if(!$('#np').hidden)renderNf();
 if(text&&document.hidden&&'Notification' in window&&Notification.permission==='granted'){try{new Notification('ShoaibScale',{body:text,icon:'/assets/favicon-48x48.png'})}catch(e){}}}
function toggleNf(){const p=$('#np');if(!p.hidden){p.hidden=true;return}closeAll();renderNf();p.hidden=false;const a=nfGet();a.forEach(n=>n.read=true);nfSet(a);setNc()}
$('#bell').onclick=toggleNf;
const ms=$('#msgs'),hm=t=>new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
function bubble(m){const d=document.createElement('div');d.className='m'+(m.me?' me':'');d.innerHTML=(m.text?esc(m.text):'')+(m.file?`<div class="att">${ic('clip')} ${esc(m.file.name)} <small style="margin:0">${(m.file.size/1024).toFixed(1)} KB</small></div>`:'')+`<small>${hm(m.at)}</small>`;ms.appendChild(d);ms.scrollTop=ms.scrollHeight}
const send=m=>{if(!sess)return needAuth();m.email=sess;m.name=me().name;const a=LS.get('siq_chat',[]);a.push(m);LS.set('siq_chat',a.slice(-300));lastN=-1;bubble(m)};
function setUnread(n){unread=n;$('#cu').hidden=$('#ud').hidden=$('#cu2').hidden=!n;$('#cu').textContent=$('#cu2').textContent=n}
function typing(on){let t=$('#typ');if(on&&!t){t=document.createElement('div');t.id='typ';t.className='typ';t.textContent='Support is typing…';ms.appendChild(t)}else if(!on&&t)t.remove();ms.scrollTop=ms.scrollHeight}
function autoReply(){if(acked)return;acked=true;typing(true);setTimeout(()=>{typing(false);send({text:T('chat.auto','Thanks — we’ve received your message. A team member will reply here during business hours.'),at:Date.now(),me:false});if(!$('#chatd').classList.contains('on'))setUnread(unread+1)},1300)}
function say(){const i=$('#ci'),t=i.value.trim();if(!t)return;i.value='';send({text:t,at:Date.now(),me:true});autoReply()}
$('#csend').onclick=say;$('#ci').onkeydown=e=>{if(e.key==='Enter')say()};
$('#fi').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;send({file:{name:f.name,size:f.size},at:Date.now(),me:true});autoReply()};
function openChat(){if(!me())return needAuth(openChat);if(PAGE==='chat'){loadChat();setUnread(0);ms.scrollTop=ms.scrollHeight;return $('#ci').focus()}closeAll();loadChat();$('#chatd').classList.add('on');$('#scrim').classList.add('on');setUnread(0);ms.scrollTop=ms.scrollHeight;setTimeout(()=>$('#ci').focus(),450)}
loadChat();

/* contact page form */
$p('#cf2').onsubmit=e=>{e.preventDefault();const f=e.target.elements,er=$p('#cerr');
 if(f.name.value.trim().length<2||!MAIL.test(f.email.value.trim())||f.msg.value.trim().length<10)return er.textContent='Please add your name, a valid email and a short message (at least 10 characters).';
 const c=LS.get('siq_contacts',[]);
 c.push({name:f.name.value.trim(),email:f.email.value.trim(),topic:f.service.value||'New project',msg:(f.budget.value?'[Budget: '+f.budget.value+'] ':'')+f.msg.value.trim(),at:Date.now()});
 if(!LS.set('siq_contacts',c))return;
 e.target.reset();er.textContent='';toast('Message sent — we’ll reply by email')};

function fileData(oid,fid){return firebase.database().ref('siq_files/'+oid+'/'+fid).once('value').then(s=>s.val())}
function decodeDataUrl(d){
  if(!d)return '';
  if(/^data:/.test(d)){
    const i=d.indexOf(',');
    if(d.slice(0,i).indexOf(';base64')>-1){
      try{return atob(d.slice(i+1))}catch(e){return ''}
    }
    try{return decodeURIComponent(d.slice(i+1))}catch(e){return ''}
  }
  return d;
}
function isCodeFile(f){
  const n=(f.name||'').toLowerCase(),t=(f.type||'');
  return /\.(html?|htm|js|jsx|ts|tsx|css|json|xml|svg|md|txt|php)$/.test(n)
    || /text\/(html|css|javascript|plain|xml)/.test(t);
}
async function openPreview(oid){
  requireAuth(async()=>{
    const o=orders.find(x=>x.id===oid);if(!o)return;
    const dlv=(LS.get('siq_dlv',null)||{})[oid]||{};
    const deliv=dlv['Delivered']||{};
    const files=deliv.files||[];
    openM('preview');
    $('#pvt').textContent=o.id+' — '+o.svc;
    const approved=isPayApproved(oid);
    let codeFile=files.find(isCodeFile)||files.find(f=>f.type&&f.type.indexOf('text/')===0)||null;
    let code='';
    if(approved && codeFile){
      $('#pcode').value='// Loading file: '+codeFile.name+' …';
      try{
        const v=await fileData(oid,codeFile.id);
        code=decodeDataUrl(v&&v.data)||'';
        if(!code)code='// File loaded but no readable text. Download file instead.';
      }catch(e){code='// File load error: '+e.message}
    }else if(approved && !codeFile){
      code=['<!doctype html>','<html><head><meta charset="utf-8"><title>Preview</title>','<style>body{font-family:system-ui,sans-serif;background:#f6f8fc;color:#14213a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}','h1{color:#2563eb;font-size:22px}p{color:#5b6b82;line-height:1.6}</style></head>','<body><div><h1>ShoaibScale — Delivery</h1>','<p>Your files are ready. Download them from My Orders.</p></div></body></html>'].join('\n');
    }else{
      code=['<!-- 🔒 PREVIEW MODE — Payment not verified -->','<!-- Real delivered files are HIDDEN until admin verifies your payment -->','','<!doctype html>','<html><head><meta charset="utf-8"><title>Preview — Locked</title>','<style>',
        'body{font-family:system-ui,sans-serif;background:#f6f8fc;color:#14213a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px}','.box{max-width:520px}','.lock{font-size:60px;margin-bottom:18px}','h1{color:#2563eb;font-size:24px;margin-bottom:14px}','p{color:#5b6b82;line-height:1.7;margin-bottom:12px;font-size:15px}',
        '.badge{display:inline-block;background:#e8efff;border:1px solid #c7d8fb;color:#2563eb;padding:8px 18px;border-radius:99px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-top:16px}','.hint{font-size:13px;color:#5b6b82;margin-top:20px;padding:12px;background:#fff;border-radius:10px;border:1px dashed #c7d8fb}',
        '</style></head>','<body><div class="box">','<div class="lock">🔒</div>','<h1>Delivery Preview — Locked</h1>','<p>Your delivery is ready! To protect both sides, real files and code stay <b>hidden</b> until the admin verifies your payment proof.</p>','<p>Once verified, this preview will show your <b>actual delivered website/code</b> live, and the Download button will unlock.</p>','<div class="badge">Preview Mode · Awaiting Verification</div>','<div class="hint">💡 Already paid? Your proof is under review. You\'ll be notified as soon as it\'s verified.</div>','</div></body></html>'].join('\n');
    }
    $('#pcode').value=code;
    $('#pframe').srcdoc=code;
    if(approved){
      $('#plock').style.display='none';
      $('#pdl').innerHTML=`<button class="btn b1" data-download="${oid}">${ic('dl')} Download files</button>`;
    }else{
      $('#plock').style.display='flex';
      $('#plock').innerHTML=`${ic('lock')} Download locked — it unlocks once your payment is verified. Real files are hidden in preview until then.`;
      $('#pdl').innerHTML='';
    }
  });
}
function doDownload(oid){
  if(!isPayApproved(oid))return toast('🔒 Download locked — payment not verified yet');
  const o=orders.find(x=>x.id===oid);if(!o)return;
  const files=((LS.get('siq_dlv',null)||{})[oid]||{}).Delivered&&((LS.get('siq_dlv',null)||{})[oid].Delivered.files)||[];
  if(!files.length)return toast('No files to download');
  files.forEach(f=>{
    fileData(oid,f.id).then(v=>{
      if(!v||!v.data)return;
      const a=document.createElement('a');
      a.href=v.data;a.download=v.name||f.name;
      document.body.appendChild(a);a.click();a.remove();
    });
  });
  toast('Downloading '+files.length+' file(s)…');
}

document.addEventListener('click',e=>{const t=e.target,q=s=>t.closest(s);let x;
 if(!q('#np,#bell,[data-open="notif"]'))$('#np').hidden=true;if(!q('#um,#hu'))$('#um').hidden=true;
 if(q('#hu')){e.preventDefault();const m=$('#um');m.hidden=!m.hidden;return}
 if(x=q('[data-open]')){e.preventDefault();const k=x.dataset.open;if(k==='auth'){authView(x.dataset.tab||'login');openM('auth')}else if(k==='chat')openChat();else if(k==='pay')openPay();else if(k==='notif')toggleNf();else if(k==='contact'||k==='faq')go(k);else openM(k);return}
 if(x=q('[data-quote]')){e.preventDefault();const s=x.dataset.quote;location.href=URLS.contact+(s?'?service='+encodeURIComponent(s):'');return}
 if(x=q('[data-go]')){const hr=x.getAttribute('href');if(x.tagName==='A'&&hr&&hr[0]!=='#')return;e.preventDefault();return go(x.dataset.go)}
 if(x=q('[data-av]')){e.preventDefault();return authView(x.dataset.av)}
 if(x=q('#atabs [data-tab]'))return authView(x.dataset.tab);
 if(x=q('[data-buy]'))return openCheckout(x.dataset.buy);
 if(x=q('[data-pay]'))return openPay(x.dataset.pay);
 if(x=q('[data-preview]'))return openPreview(x.dataset.preview);
 if(x=q('[data-download]'))return doDownload(x.dataset.download);
 if(q('#prun')){$('#pframe').srcdoc=$('#pcode').value;return toast('Preview refreshed')}
 if(q('[data-logout]'))return logout();
 if(x=q('[data-rev]')){const o=orders.find(o=>o.id===x.dataset.rev);if(Date.now()>o.deliveredAt+72*36e5)return toast('The 3-day revision window has closed');o.status='Revision Requested';saveOrders();renderAcct();return toast('Revision requested')}
 if(x=q('[data-ok]')){orders.find(o=>o.id===x.dataset.ok).status='Completed';saveOrders();renderAcct();return toast('Order approved')}
 if(q('[data-close]')||t.classList.contains('mod')||t.id==='scrim')return closeAll();
 if((x=q('a[href^="#"]'))){e.preventDefault();const h=x.getAttribute('href').slice(1);if(PAGES.includes(h))go(h)}});
$('#bg').onclick=()=>{$('#drawer').classList.add('on');$('#scrim').classList.add('on')};$('#cls').onclick=closeAll;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
$('#cur').value=cur;$('#cur').onchange=e=>{cur=e.target.value;LS.set('siq_cur',cur);renderSV();if(onAcct)renderAcct();if($('#m-co').classList.contains('on'))coCalc()};
$$('input[type=password]').forEach(i=>{const w=document.createElement('span');w.className='pw';i.before(w);w.append(i);const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show password');b.innerHTML=ic('eye');b.onclick=()=>{const s=i.type==='password';i.type=s?'text':'password';b.innerHTML=ic(s?'eyeoff':'eye');b.setAttribute('aria-label',s?'Hide password':'Show password')};w.append(b)});
$('#af').elements.password.addEventListener('input',e=>rulesUI($('#arl'),e.target.value));
const BL=()=>LS.get('siq_blacklist',[]),dg=s=>String(s||'').replace(/\D/g,'');
const blocked=(em,ph)=>BL().find(x=>x.email===em||(ph&&x.phone&&dg(x.phone)===dg(ph)));
const banInfo=u=>u&&u.ban&&(!u.ban.until||Date.now()<u.ban.until)?u.ban:null;
function ov(h){let o=$('#mdo');if(!o){o=document.createElement('div');o.id='mdo';o.style.cssText='position:fixed;inset:0;z-index:999;background:rgba(15,23,42,.6);display:grid;place-items:center;padding:20px';document.body.appendChild(o)}o.innerHTML='<div class="glass" style="max-width:440px;padding:30px;text-align:center">'+h+'</div>';return o}
function guard(){if(!window.PRIVOK)return;users=getUsers();const u=sess&&users[sess];if(!u){if(sess){sess=null;LS.set('siq_sess',null);renderAuth()}return}const bl=blocked(sess,u.phone),b=bl||banInfo(u);
 if(b){sess=null;LS.set('siq_sess',null);renderAuth();closeAll();if(GATED.includes(PAGE))location.href='index.html';const o=ov('<h2 style="margin-bottom:10px">Account '+(bl?'blacklisted':'suspended')+'</h2><p style="color:var(--mu);margin-bottom:18px">'+esc(b.reason||'Policy violation')+(b.until?'<br>Until '+dt(b.until):'')+'</p><button class="btn b2" id="mdx">Close</button>');o.querySelector('#mdx').onclick=()=>o.remove();return}
 const i=(u.warns||[]).findIndex(w=>!w.ack);if(i>-1&&!$('#mdo')){const o=ov('<h2 style="margin-bottom:10px">⚠ Warning from admin</h2><p style="margin-bottom:18px">'+esc(u.warns[i].msg)+'</p><button class="btn b1" id="mdx">I understand</button>');o.querySelector('#mdx').onclick=()=>{users=getUsers();const w=users[sess]&&users[sess].warns;if(w&&w[i])w[i].ack=Date.now();LS.set('siq_users',users);o.remove()}}}
function loadChat(){const g={text:T('chat.welcome','Hi 👋 Share your project details and our team will reply here.'),at:Date.now(),me:false};ms.innerHTML='';bubble(g);LS.get('siq_chat',[]).filter(m=>m.email===sess).forEach(bubble)}
let lastN=-1,lastU=null;
function syncChat(){if(lastU!==sess){lastU=sess;lastN=-1}const t=LS.get('siq_chat',[]).filter(m=>m.email===sess),p=lastN;if(t.length===lastN)return;lastN=t.length;const l=t[t.length-1];if(p>=0&&l&&!l.me){if($('#chatd').classList.contains('on'))loadChat();else{setUnread(unread+1);notify('New message from support',URLS.chat)}}}
function ann(){const a=LS.get('siq_announce',null);let e=$('#ann');if(!a||!a.on||!a.text){e&&e.remove();return}if(!e){e=document.createElement('div');e.id='ann';e.style.cssText='background:#2563eb;color:#fff;text-align:center;padding:8px 14px;font-weight:600;font-size:14px';document.body.prepend(e)}e.textContent=a.text}
function brand(){const b=LS.get('siq_brand',null)||{},ok=v=>typeof v==='string'&&/^data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,]/.test(v)?v:'';
 const lg=ok(b.logo),hr=ok(b.hero),li=$('#logoimg'),tx=$('.logo .lt'),hi=$p('#heroimg'),st=$p('.stage');
 if(li){if(li.dataset.s!==lg){li.dataset.s=lg;if(lg)li.src=lg;else li.removeAttribute('src')}li.hidden=!lg;tx.hidden=!!lg&&b.showText===false}
 if(hi){if(hi.dataset.s!==hr){hi.dataset.s=hr;if(hr)hi.src=hr;else hi.removeAttribute('src')}hi.hidden=!hr;st.classList.toggle('hasimg',!!hr)}
 let f=$('#favi');if(lg){if(!f){f=document.createElement('link');f.id='favi';f.rel='icon';document.head.appendChild(f)}if(f.getAttribute('href')!==lg)f.href=lg}else if(f)f.remove()}

const U=v=>{v=String(v||'').trim();return v?(/^https?:\/\//i.test(v)?v:'https://'+v):''};
const PF=()=>{const a=LS.get('siq_portfolio',null);return Array.isArray(a)?a:[]};
/* default portfolio shown until admin adds real projects */
const DPF=[
 {t:'Plant ERP Portal',k:'Custom software',c:'Hanif Steel Works',d:'Replaced spreadsheet-based tracking with a portal for production orders, stock and dispatch.',r:'Faster order processing\nStock reconciliation reduced',g:'g0'},
 {t:'Machine Monitoring Dashboard',k:'Dashboards',c:'Crescent Textiles',d:'Real-time loom uptime, downtime reasons and shift reports, with multiple plants in one view.',r:'Downtime reporting\nShift reports automated',g:'g1'},
 {t:'Export Catalogue Website',k:'Websites & content',c:'Meridian Industrial Supply',d:'Multilingual B2B catalogue with RFQ forms and SEO-ready product pages.',r:'Qualified enquiries\nMultilingual catalogue',g:'g2c'},
 {t:'Safety & Compliance Tracker',k:'Custom software',c:'Orbit Chemicals',d:'Audit checklists, incident logging and certificate-expiry alerts for site teams.',r:'Audit-ready records\nExpiry reminders',g:'g3c'},
 {t:'Inventory SaaS MVP',k:'Product development',c:'StockLine',d:'Multi-warehouse inventory application with barcode scanning and role-based access.',r:'MVP delivery\nMulti-warehouse support',g:'g4'},
 {t:'Factory Promo Film',k:'Brand & video',c:'Delta Packaging',d:'Production-line brand film and short motion cuts for tender and social use.',r:'Tender presentation\nSocial-ready edits',g:'g5'}];
const DEMOS=[
 {t:'EarningsBee',k:'Prototype',d:'Rewards-app interface concept: account screens, tasks, referral and withdrawal flow. Demo prototype.',g:'g4',demo:1},
 {t:'FoilFlow',k:'Prototype',d:'Product sign-in screen preview. Demo prototype.',g:'g1',demo:1}];
const GR=['g0','g1','g2c','g3c','g4','g5'];
function pfCard(p){
 const im=/^data:image\//.test(p.img||'')?`<img class="pimg" src="${p.img}" alt="${esc(p.t)}" loading="lazy">`:`<div class="cover ${p.g||'g0'}"><div class="ca">${esc(p.k||'Project')}</div><div class="cb"></div></div>`;
 const l=U(p.l),rs=String(p.r||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,6);
 return `<article class="card pfc">${im}<div class="pm2"><span class="chip">${esc(p.k||'Case study')}</span><small>${p.demo?'Prototype':'Case study'}</small></div><h3>${esc(p.t)}</h3><p>${p.c?`<b>${esc(p.c)}</b> · `:''}${esc(p.d)}</p>${p.s?`<span class="res">${esc(p.s)}</span>`:''}${rs.length?`<div class="rs">${rs.map(x=>esc(x)).join(' · ')}</div>`:''}${l?`<a class="vl" href="${esc(l)}" target="_blank" rel="noopener noreferrer">View project →</a>`:`<a class="vl" href="contact.html" data-quote="">Discuss a similar project →</a>`}</article>`}
let pfK='',abK='',soK='';
function renderPF(){const a=PF(),k=JSON.stringify(a);if(k===pfK)return;pfK=k;
 const it=a.length?a.map((p,i)=>({...p,k:p.k||'Project',g:GR[i%6]})):DPF;
 $p('#pfg').innerHTML=it.map(pfCard).join('');$p('#pfh').innerHTML=it.slice(0,3).map(pfCard).join('');
 $p('#demos').hidden=a.length>0;$p('#pfd').innerHTML=DEMOS.map(pfCard).join('')}
const ABOUT_ROLE='Independent digital studio · Remote projects';
function renderAbout(){const a=LS.get('siq_about',null)||{},k=JSON.stringify(a);if(k===abK)return;abK=k;
 $p('#abname').textContent=a.name||'ShoaibScale';$p('#abrole').textContent=a.role||ABOUT_ROLE;const b=$p('#abbio');b.textContent=a.bio&&a.bio.trim()?a.bio:'';b.hidden=!b.textContent;
 const i=$p('#abimg'),ok=/^data:image\//.test(a.photo||'');i.hidden=!ok;$p('#abmono').hidden=ok;if(ok)i.src=a.photo;else i.removeAttribute('src')}
const SOC=[['linkedin','LinkedIn','in'],['fiverr','Fiverr','Fi'],['upwork','Upwork','Up'],['instagram','Instagram'],['facebook','Facebook','f'],['x','X','X'],['github','GitHub','GH'],['youtube','YouTube'],['tiktok','TikTok','Tt']];
const sIcon=(k,t)=>k==='instagram'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>':k==='youtube'?'<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>':`<svg viewBox="0 0 24 24"><text x="12" y="16.5" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="13" fill="currentColor">${t}</text></svg>`;
function renderSocial(){const s=LS.get('siq_social',null)||{},k=JSON.stringify(s);if(k===soK)return;soK=k;
 const wa=String(s.whatsapp||'').replace(/\D/g,''),it=SOC.filter(x=>U(s[x[0]])).map(x=>`<a href="${esc(U(s[x[0]]))}" target="_blank" rel="noopener noreferrer" aria-label="${x[1]}" title="${x[1]}">${sIcon(x[0],x[2])}</a>`);
 if(wa)it.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">${sIcon('wa','WA')}</a>`);
 ['#fsoc','#asoc','#csoc'].forEach(q=>{const e=$(q);if(e)e.innerHTML=it.join('')});
 const ci=[];if(s.email)ci.push(`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);if(s.phone)ci.push(`<a href="tel:${esc(String(s.phone).replace(/[^\d+]/g,''))}">${esc(s.phone)}</a>`);
 $p('#cinfo').innerHTML=ci.length?ci.join(''):'<span>Use the form to reach us — details appear here once added.</span>';
 const w=$('#wa');if(wa){w.href='https://wa.me/'+wa;w.hidden=false}else w.hidden=true}
function sync(){renderPF();renderAbout();renderSocial();guard();syncChat();ann();brand();applyTexts();dsync()}
addEventListener('siq-change',e=>{const k=e.detail.key;if(k==='siq_services'){const n=LS.get('siq_services',null);if(n){SV.length=0;SV.push(...n);renderSV()}}if(k==='siq_orders')orders=LS.get('siq_orders',[]);if(k==='siq_pays')pays=LS.get('siq_pays',[]);if(k==='siq_users'){users=getUsers();renderAuth()}if((k==='siq_orders'||k==='siq_pays')&&sess&&onAcct)renderAcct();sync()});
const isImg=f=>/^image\//.test(f.type||'');
function fileUrl(oid,f){const k=oid+'/'+f.id;if(FRES[k])return Promise.resolve(FRES[k]);
 return FPRO[k]||(FPRO[k]=firebase.database().ref('siq_files/'+oid+'/'+f.id).once('value').then(s=>{const v=s.val();if(!v||!v.data)throw 0;return fetch(v.data).then(r=>r.blob())}).then(b=>{const u=URL.createObjectURL(new Blob([b],{type:f.type||b.type}));FRES[k]=u;return u}).catch(()=>{delete FPRO[k];return null}))}
function dlvHTML(o){const d=DLV()[o.id]||{};return [['Processing',T('acct.upd1','Work in progress update')],['Delivered',T('acct.upd2','Delivery from our team')]].filter(([s])=>d[s]&&(d[s].note||(d[s].files||[]).length)).map(([s,l])=>{const x=d[s];
 return `<div class="dlv" data-dl="${esc(o.id)}" data-st="${s}"><div class="dh"><b>${esc(l)}</b><small>${dt(x.at)}</small></div>${x.note?`<div class="dn"><span>${esc(T('acct.inst','Instructions'))}</span>${esc(x.note)}</div>`:''}${(x.files||[]).length?'<div class="dfs"></div>':''}</div>`}).join('')}
function fileHTML(f,u){if(!u)return `<span class="fchip bd">${esc(f.name)} — unavailable</span>`;const nm=esc(f.name);
 return isImg(f)?`<div class="fth"><a class="im" href="${u}" data-lb="${u}" data-nm="${nm}"><img src="${u}" alt="${nm}"></a><a class="fdl" href="${u}" download="${nm}">${ic('dl')} ${nm}</a></div>`:`<a class="fchip" href="${u}" download="${nm}">${ic('dl')} ${nm} <small style="color:var(--mu)">${Math.max(1,Math.round(f.size/1024))} KB</small></a>`}
function hydrateDlv(){$$('.dlv').forEach(el=>{const oid=el.dataset.dl;
  if(!oid||!isPayApproved(oid)) return;
  const x=(DLV()[oid]||{})[el.dataset.st],box=el.querySelector('.dfs');if(!x||!box)return;const fs=x.files||[];
 if(fs.every(f=>FRES[oid+'/'+f.id])){box.innerHTML=fs.map(f=>fileHTML(f,FRES[oid+'/'+f.id])).join('');return}
 box.innerHTML='<span class="bd" style="font-size:13px">Loading files…</span>';
 Promise.all(fs.map(f=>fileUrl(oid,f))).then(us=>{if(box.isConnected)box.innerHTML=fs.map((f,i)=>fileHTML(f,us[i])).join('')})})}
document.addEventListener('click',e=>{const a=e.target.closest('[data-lb]');if(!a)return;e.preventDefault();
 const oid=a.closest('[data-dl]')&&a.closest('[data-dl]').dataset.dl;
 if(oid&&!isPayApproved(oid))return toast('🔒 Files locked until payment verified');
 const o=document.createElement('div');o.className='lbx';
 o.innerHTML=`<img src="${a.dataset.lb}" alt=""><a class="btn b1" href="${a.dataset.lb}" download="${esc(a.dataset.nm)}">${ic('dl')} Download</a>`;o.onclick=ev=>{if(!ev.target.closest('a.btn'))o.remove()};document.body.appendChild(o)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const l=$('.lbx');l&&l.remove()}});
let lastDC=0,lastDS;
const dlvCount=()=>{const d=DLV();return mine().reduce((n,o)=>n+Object.values(d[o.id]||{}).reduce((m,x)=>m+(x?(x.files||[]).length+(x.note?1:0):0),0),0)};
function dsync(){if(lastDS!==sess){lastDS=sess;lastDC=dlvCount()}}
addEventListener('siq-change',e=>{const k=e.detail.key;
 if(k==='siq_dlv'){const n=dlvCount();if(sess&&lastDS===sess&&n>lastDC){notify('New update on your order: files or instructions were added',URLS.orders);toast('New update on your order — open My Orders')}lastDC=n;lastDS=sess}
 if((k==='siq_dlv'||k==='siq_texts'||k==='siq_pays')&&sess&&onAcct)renderAcct()});
function applyTexts(){const o=LS.get('siq_texts',null)||{};
 $$('[data-t]').forEach(el=>{if(el.dataset.d===undefined)el.dataset.d=el.textContent;const v=o[el.dataset.t],n=typeof v==='string'&&v.trim()?v:el.dataset.d;if(el.textContent!==n)el.textContent=n})}
setInterval(sync,2500);
renderSV();renderAuth();setNc();rulesUI($('#arl'),'');rulesUI($p('#prl'),'');
$$('[data-page]').forEach(a=>a.classList.toggle('on',a.dataset.page===PAGE));
{const q=new URLSearchParams(location.search).get('service'),s=$p('#cservice');if(q&&[...s.options].some(o=>o.value===q))s.value=q}
if(PAGE==='login')authView(new URLSearchParams(location.search).get('tab')==='signup'?'signup':'login');
$('#nperm').onclick=()=>{try{Notification.requestPermission().then(renderNf)}catch(e){}};
/* ---- notifications: order status, payments, announcements ---- */
let osSnap=null,psSnap=null;
function snapOrders(){osSnap={};mine().forEach(o=>osSnap[o.id]=o.status)}
function snapPays(){psSnap={};pays.filter(p=>p.email===sess).forEach(p=>psSnap[p.id]=p.state)}
addEventListener('siq-change',e=>{const k=e.detail.key;if(!sess||!window.PRIVOK)return;
 if(k==='siq_orders'){if(osSnap)mine().forEach(o=>{const p=osSnap[o.id];if(p!==undefined&&p!==o.status)notify('Order '+o.id+' is now: '+o.status,URLS.orders)});snapOrders()}
 if(k==='siq_pays'){if(psSnap)pays.filter(p=>p.email===sess).forEach(p=>{const s=psSnap[p.id];if(s!==undefined&&s!==p.state)notify('Payment for '+p.orderId+': '+p.state,URLS.payment)});snapPays()}
 if(k==='siq_announce'){const a=LS.get('siq_announce',null);if(a&&a.on&&a.text){let l='';try{l=localStorage.getItem('siq_lastann')||''}catch(_){}try{localStorage.setItem('siq_lastann',a.text)}catch(_){}if(l&&l!==a.text)notify('Announcement: '+a.text)}}});
sync();
/* data lives in Firebase: once it has loaded, validate the saved session and finish page setup */
PRIV.then(()=>{users=getUsers();orders=LS.get('siq_orders',[]);pays=LS.get('siq_pays',[]);
 if(sess&&!users[sess]){sess=null;LS.set('siq_sess',null)}
 snapOrders();snapPays();renderAuth();loadChat();setNc();
 if(PAGE==='login'&&me()){const nx=new URLSearchParams(location.search).get('next');location.href=/^[a-z-]+\.html$/.test(nx||'')?nx:URLS.orders;return}
 if(onAcct){const ok=()=>renderAcct();if(me())ok();else needAuth(ok)}
 if(PAGE==='chat'&&me())openChat();
 if(PAGE==='payment')requireAuth(()=>openPay(new URLSearchParams(location.search).get('order')||''));
 sync()});
