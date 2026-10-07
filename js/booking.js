/* Form booking dan cek booking */
function slotsFull(date,time,ignore){return bookings().filter(b=>b.date===date&&b.time===time&&b.status!=='Dibatalkan').length>=MAX_SLOT}
function summary(b){return [['Nomor booking',b.id],['Nama',b.name],['WhatsApp',b.wa],['Motor',b.motor+' ('+b.plat+')'],['Layanan',b.svcName+' - '+rp(b.price)],['Tanggal',fmtDate(b.date)],['Jam',b.time],['Keluhan',b.note||'-']].map(([k,v])=>`<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}

const bf=$('#bookForm');
if(bf){
  const u=session();
  if(!u||u.role!=='customer'){document.querySelector('main').innerHTML='<div class="wrap sec"><div class="card ok"><h2>Login dulu untuk booking</h2><p class="sub" style="margin:8px auto 20px">Masuk atau daftar sebagai pelanggan agar booking Anda tersimpan.</p><a class="btn" href="login.html?next=booking.html">Login</a> <a class="btn btn-gray" href="register.html">Daftar</a></div></div>'}
  else{
    $('#svc').innerHTML='<option value="">Pilih layanan</option>'+services().map(s=>`<option value="${s.id}">${esc(s.name)} - ${rp(s.price)}</option>`).join('');
    $('#svc').value=new URLSearchParams(location.search).get('svc')||'';
    bf.name.value=u.name;bf.wa.value=u.wa||'';bf.date.min=today();
    const refresh=()=>{const d=bf.date.value;$('#time').innerHTML='<option value="">Pilih jam</option>'+SLOTS.map(t=>{const full=d&&slotsFull(d,t);return `<option value="${t}" ${full?'disabled':''}>${t}${full?' (Penuh)':''}</option>`}).join('')};
    bf.date.onchange=refresh;refresh();
    bf.onsubmit=e=>{
      e.preventDefault();const v=Object.fromEntries(new FormData(bf));const E={};
      if(!v.name.trim())E.name='Nama wajib diisi';
      if(!/^(08|\+?628)\d{7,12}$/.test(v.wa))E.wa='Nomor WhatsApp tidak valid (contoh 081234567890)';
      if(v.motor.trim().length<3)E.motor='Isi jenis motor';
      if(!/^[A-Za-z]{1,2}\s?\d{1,4}\s?[A-Za-z]{0,3}$/.test(v.plat.trim()))E.plat='Format plat salah (contoh BK 1234 AB)';
      if(!v.svc)E.svc='Pilih layanan';
      if(!v.date)E.date='Pilih tanggal';else if(v.date<today())E.date='Tanggal tidak boleh sudah lewat';
      if(!v.time)E.time='Pilih jam';else if(v.date&&slotsFull(v.date,v.time))E.time='Jam ini sudah penuh';
      ['name','wa','motor','plat','svc','date','time'].forEach(k=>$('#e-'+k).textContent=E[k]||'');
      if(Object.keys(E).length){refresh();return}
      const s=services().find(x=>x.id==v.svc),all=bookings(),t=today().replace(/-/g,'');
      const n=all.filter(b=>b.id.includes('-'+t+'-')).length+1;
      const b={id:`MCG-${t}-${String(n).padStart(3,'0')}`,uid:u.id,name:v.name.trim(),wa:v.wa,motor:v.motor.trim(),plat:v.plat.trim().toUpperCase(),svc:s.id,svcName:s.name,price:s.price,date:v.date,time:v.time,note:v.note.trim(),status:'Menunggu Konfirmasi'};
      DB.set('bookings',[...all,b]);toast('Booking berhasil dibuat');
      $('#bookWrap').innerHTML=`<div class="card ok"><h2>Booking berhasil</h2><div class="no">${b.id}</div>${badge(b.status)}<div style="text-align:left;margin:16px 0">${summary(b)}</div><a class="btn" href="cek-booking.html">Cek status booking</a></div>`;
    };
  }
}

/* Cek booking: cari dengan nomor booking atau nomor WhatsApp */
const cf=$('#checkForm');
if(cf){
  const show=list=>{$('#result').innerHTML=list.length?list.map(b=>`<div class="card" style="margin-bottom:14px"><div class="meta"><b>${b.id}</b>${badge(b.status)}</div>
    <div class="kv"><span>Nama</span>${esc(b.name)}</div><div class="kv"><span>Motor</span>${esc(b.motor)} (${esc(b.plat)})</div><div class="kv"><span>Layanan</span>${esc(b.svcName)}</div><div class="kv"><span>Tanggal servis</span>${fmtDate(b.date)}</div><div class="kv"><span>Jam servis</span>${b.time}</div>
    ${['Menunggu Konfirmasi','Dikonfirmasi'].includes(b.status)&&session()?.id===b.uid?`<button class="btn btn-red btn-sm" style="margin-top:12px" onclick="cancelBooking('${b.id}')">Batalkan booking</button>`:''}</div>`).join(''):'<p class="note">Booking tidak ditemukan. Periksa kembali nomor yang dimasukkan.</p>'};
  window.cancelBooking=id=>{if(!confirm('Batalkan booking '+id+'?'))return;DB.set('bookings',bookings().map(b=>b.id===id?{...b,status:'Dibatalkan'}:b));toast('Booking dibatalkan');cf.onsubmit(new Event('submit'))};
  cf.onsubmit=e=>{e.preventDefault();const q=cf.q.value.trim().toUpperCase().replace(/\s/g,'');if(!q){$('#e-q').textContent='Isi nomor booking atau WhatsApp';return}$('#e-q').textContent='';show(bookings().filter(b=>b.id===q||b.wa.replace(/\s/g,'')===q))};
  // Pelanggan yang login langsung melihat semua booking miliknya
  const u=session();
  if(u?.role==='customer'){const mine=bookings().filter(b=>b.uid===u.id).reverse();if(mine.length)show(mine)}
}
