/* Login dan register (akun disimpan di LocalStorage; password belum dienkripsi - hanya untuk demo) */
const f=$('#authForm'),isReg=f.dataset.mode==='register';
const setErr=(id,m)=>{$('#e-'+id).textContent=m;return !m};
f.onsubmit=e=>{
  e.preventDefault();const v=Object.fromEntries(new FormData(f));let ok=true;
  ['username','password'].forEach(k=>{ok=setErr(k,v[k]&&v[k].trim().length>=(k==='password'?6:3)?'':'Isi minimal '+(k==='password'?6:3)+' karakter')&&ok});
  if(isReg){ok=setErr('name',v.name.trim()?'':'Nama wajib diisi')&&ok;ok=setErr('wa',/^(08|\+?628)\d{7,12}$/.test(v.wa)?'':'Nomor WhatsApp tidak valid')&&ok}
  if(!ok)return;
  const list=users();
  if(isReg){
    if(list.some(u=>u.username===v.username))return setErr('username','Username sudah dipakai');
    const u={id:Date.now(),name:v.name.trim(),username:v.username.trim(),password:v.password,wa:v.wa,role:'customer'};
    DB.set('users',[...list,u]);DB.set('session',u);toast('Akun berhasil dibuat');setTimeout(()=>location.href='booking.html',700);return;
  }
  const u=list.find(x=>x.username===v.username&&x.password===v.password&&x.role===v.role);
  if(!u)return toast('Username, password, atau jenis akun salah',true);
  DB.set('session',u);
  const next=new URLSearchParams(location.search).get('next');
  location.href=u.role==='admin'?'admin/dashboard.html':(next||'index.html');
};
