/* MotoCare Garage - fungsi bersama. Semua data disimpan di LocalStorage.
   Nanti tiap DB.get/DB.set bisa diganti dengan panggilan API ke MySQL. */
const DB={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const today=()=>iso(new Date());
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const fmtDate=d=>new Date(d+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
const SLOTS=['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
const MAX_SLOT=2; // maksimal booking aktif per jam
const STATUS=['Menunggu Konfirmasi','Dikonfirmasi','Sedang Dikerjakan','Selesai','Dibatalkan'];
const badge=s=>`<span class="badge s${STATUS.indexOf(s)}">${s}</span>`;
const services=()=>DB.get('services',[]),bookings=()=>DB.get('bookings',[]),users=()=>DB.get('users',[]);
const session=()=>DB.get('session',null);

/* Data contoh, dibuat sekali saat pertama kali dibuka */
function seed(){
  if(DB.get('seeded'))return;
  DB.set('services',[
    {id:1,name:'Servis Ringan',desc:'Pengecekan rutin, setel rantai, bersihkan filter udara.',price:75000,time:'1 jam',icon:'🔧'},
    {id:2,name:'Servis Lengkap',desc:'Pemeriksaan menyeluruh mesin, kelistrikan, dan kaki-kaki.',price:250000,time:'3 jam',icon:'🛠️'},
    {id:3,name:'Ganti Oli',desc:'Oli mesin pilihan plus pengecekan kebocoran.',price:50000,time:'30 menit',icon:'🛢️'},
    {id:4,name:'Tune Up',desc:'Setel karburator/injeksi, busi, dan pengapian.',price:150000,time:'2 jam',icon:'⚙️'},
    {id:5,name:'Service Rem',desc:'Ganti kampas rem, bersihkan kaliper, cek minyak rem.',price:80000,time:'1 jam',icon:'🛑'},
    {id:6,name:'Service CVT',desc:'Bersihkan CVT, cek belt, roller, dan kampas ganda.',price:100000,time:'1,5 jam',icon:'🔩'},
    {id:7,name:'Ganti Ban',desc:'Pasang ban baru, balancing, dan cek tekanan angin.',price:120000,time:'45 menit',icon:'🛞'},
    {id:8,name:'Perawatan Mesin',desc:'Kuras ruang bakar, bersihkan injektor, cek kompresi.',price:300000,time:'4 jam',icon:'🏍️'}]);
  DB.set('users',[
    {id:1,name:'Admin MotoCare',username:'admin',password:'admin123',role:'admin'},
    {id:2,name:'Budi Santoso',username:'budi',password:'budi123',wa:'081234567890',role:'customer'}]);
  const t=today().replace(/-/g,'');
  DB.set('bookings',[
    {id:'MCG-'+t+'-001',uid:2,name:'Budi Santoso',wa:'081234567890',motor:'Honda Vario 150',plat:'BK 1234 AB',svc:3,svcName:'Ganti Oli',price:50000,date:today(),time:'09:00',note:'Oli mesin terasa kasar.',status:'Dikonfirmasi'},
    {id:'MCG-'+t+'-002',uid:3,name:'Sari Dewi',wa:'081355577788',motor:'Yamaha NMAX',plat:'BK 5678 CD',svc:6,svcName:'Service CVT',price:100000,date:addDays(1),time:'10:00',note:'Suara kasar saat jalan.',status:'Menunggu Konfirmasi'},
    {id:'MCG-'+t+'-003',uid:4,name:'Andi Pratama',wa:'082111222333',motor:'Honda Beat',plat:'BK 9012 EF',svc:5,svcName:'Service Rem',price:80000,date:today(),time:'13:00',note:'Rem belakang blong.',status:'Sedang Dikerjakan'}]);
  DB.set('seeded',1);
}
seed();

/* Notifikasi kecil dan modal */
function toast(msg,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),3200)}
function modal(html){closeModal();const o=document.createElement('div');o.className='ov';o.id='ov';o.innerHTML='<div class="modal">'+html+'</div>';o.onclick=e=>{if(e.target===o)closeModal()};document.body.append(o)}
function closeModal(){$('#ov')?.remove()}
function logout(){DB.set('session',null);location.href=(location.pathname.includes('/admin/')?'../':'')+'index.html'}

/* Navbar: hamburger, menu aktif, tombol login/keluar */
const burger=$('#burger');if(burger)burger.onclick=()=>$('#menu').classList.toggle('open');
const page=location.pathname.split('/').pop()||'index.html';
$$('#menu a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('on')});
const al=$('#authLink'),me=session();
if(al&&me){al.textContent='Keluar';al.href='#';al.onclick=e=>{e.preventDefault();logout()};
  if(me.role==='admin')al.insertAdjacentHTML('beforebegin','<a href="admin/dashboard.html">Dashboard</a>')}

/* Kartu layanan (layanan.html dan home) */
const grid=$('#svcGrid');
if(grid){const lim=+grid.dataset.limit||99;grid.innerHTML=services().slice(0,lim).map(s=>`<article class="card svc"><div class="ico">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p><div class="meta"><b>${rp(s.price)}</b><span>Estimasi ${esc(s.time)}</span></div><a class="btn" href="booking.html?svc=${s.id}">Booking</a></article>`).join('')}
/* Tabel harga */
const pb=$('#priceBody');
if(pb)pb.innerHTML=services().map(s=>`<tr><td>${s.icon} ${esc(s.name)}</td><td>${esc(s.time)}</td><td><b>${rp(s.price)}</b></td><td><a class="btn btn-sm" href="booking.html?svc=${s.id}">Booking</a></td></tr>`).join('');
