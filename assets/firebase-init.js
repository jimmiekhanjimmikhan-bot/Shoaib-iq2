/* ShoaibScale: Firebase Realtime Database bootstrap (shared by every page) */
const firebaseConfig={apiKey:"AIzaSyB5h-ltxhulwY3AHubPOg-GDzAn4TYCp2M",authDomain:"shoaib-iq.firebaseapp.com",databaseURL:"https://shoaib-iq-default-rtdb.firebaseio.com",projectId:"shoaib-iq",storageBucket:"shoaib-iq.firebasestorage.app",messagingSenderId:"620967955154",appId:"1:620967955154:web:bb4c2ed41e41b1872c7b0b",measurementId:"G-VRJE4LES7C"};
firebase.initializeApp(firebaseConfig);
const DB=firebase.database().ref('siq');
const DEVICE_KEYS=['siq_sess','siq_cur'];
const PUB_KEYS=['siq_portfolio','siq_about','siq_social','siq_brand','siq_texts','siq_sections','siq_announce','siq_services'];
const PRIV_KEYS=['siq_users','siq_orders','siq_pays','siq_chat','siq_contacts','siq_dlv','siq_blacklist','siq_seq'];
const CACHE={};
window.PRIVOK=false;
try{const c=JSON.parse(localStorage.getItem('siq_pubcache')||'{}');PUB_KEYS.forEach(k=>{if(typeof c[k]==='string')CACHE[k]=c[k]})}catch(e){}
const savePub=()=>{try{const o={};PUB_KEYS.forEach(k=>{if(typeof CACHE[k]==='string')o[k]=CACHE[k]});localStorage.setItem('siq_pubcache',JSON.stringify(o))}catch(e){}};
const LS={
 get(k,d){
  if(DEVICE_KEYS.includes(k)){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
  const s=CACHE[k];if(s===undefined||s===null)return d;
  try{const v=JSON.parse(s);return v===null?d:v}catch(e){return d}
 },
 set(k,v){
  if(DEVICE_KEYS.includes(k)){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  if(PRIV_KEYS.includes(k)&&!window.PRIVOK){try{toast('Please wait a moment — data is still loading…')}catch(_){}return false}
  try{const s=JSON.stringify(v);CACHE[k]=s;DB.child(k).set(s).catch(e=>{try{toast('Database save failed: '+e.message)}catch(_){}});if(PUB_KEYS.includes(k))savePub();return true}
  catch(e){try{toast('Could not save data')}catch(_){}return false}
 },
 del(k){delete CACHE[k];DB.child(k).remove().catch(()=>{})},
 keys(){return Object.keys(CACHE)}
};
const fire=k=>window.dispatchEvent(new CustomEvent('siq-change',{detail:{key:k}}));
let dbErrShown=false;
const dbErr=e=>{if(dbErrShown)return;dbErrShown=true;document.body.insertAdjacentHTML('beforeend','<div style="position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:#12233d;color:#fff;border-radius:12px;padding:12px 16px;font:14px/1.5 system-ui,sans-serif">Could not connect to the database: '+String(e&&e.message||e).replace(/</g,'&lt;')+'. Please check your internet connection and reload.</div>')};
PUB_KEYS.forEach(k=>DB.child(k).on('value',s=>{const v=s.val();if(v===null){if(CACHE[k]===undefined)return;delete CACHE[k]}else{if(CACHE[k]===v)return;CACHE[k]=v}savePub();fire(k)},dbErr));
window.PRIV=new Promise(res=>{
 const seen={};let left=PRIV_KEYS.length;
 PRIV_KEYS.forEach(k=>DB.child(k).on('value',s=>{const v=s.val();if(v===null)delete CACHE[k];else CACHE[k]=v;
  if(!seen[k]){seen[k]=1;if(--left===0){window.PRIVOK=true;res(true)}}else fire(k)},e=>{dbErr(e)}));
});
                                                                                                                          
