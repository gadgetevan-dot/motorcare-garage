/* Dashboard admin: statistik, booking, layanan */
const me2=session();
if(!me2||me2.role!=='admin'){location.href='../login.html'}
$('#out').onclick=e=>{e.preventDefault();logout()};
const pg=document.body.dataset.page,save=(k,v)=>DB.set(k,v);

if(pg==='dashboard'){
  const b=bookings(),cust=users().filter(u=>u.role==='customer');
  const st=[['Total Booking',b.length],['Booking Hari Ini',b.filter(x=>x.date===today()).length],['Booking Menunggu',b.filter(x=>x.status===STATUS[0]).length],['Booking Selesai',b.filter(x=>x.status===STATUS[3]).length],['Total Pelanggan',cust.length]];
  $('#stats').innerHTML=st.map(([k,v])=>`<div class="card stat"><b>${v}</b><span>${k}</span></div>`).join('');
  $('#byStatus').innerHTML=STATUS.map(s=>{const n=b.filter(x=>x.status===s).length;return `<div class="kv">${badge(s)}<b>${n}</b></div>`}).join('');
  $('#custBody').innerHTML=cust.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.username)}</td><td>${esc(u.wa||'-')}</td><td>${b.filter(x=>x.uid===u.id).length}</td></tr>`).join('');
}

if(pg==='booking'){
  const draw=()=>{
    const q=$('#q').value.toLowerCase(),s=$('#fs').value,d=$('#fd').value;
    const rows=bookings().filter(b=>(!s||b.status===s)&&(!d||b.date===d)&&(!q||(b.id+b.name+b.wa+b.motor+b.plat).toLowerCase().includes(q)));
    $('#body').innerHTML=rows.map(b=>`<tr><td>${b.id}</td><td>${esc(b.name)}</td><td>${esc(b.wa)}</td><td>${esc(b.motor)}</td><td>${esc(b.svcName)}</td><td>${b.date}</td><td>${b.time}</td><td>${badge(b.status)}</td>
      <td class="act"><button class="btn btn-sm btn-gray" onclick="detail('${b.id}')">Detail</button><button class="btn btn-sm" onclick="changeStatus('${b.id}')">Ubah Status</button><button class="btn btn-sm btn-red" onclick="del('${b.id}')">Hapus</button></td></tr>`).join('')||'<tr><td colspan="9">Tidak ada booking yang cocok dengan filter.</td></tr>';
  };
  $('#fs').innerHTML='<option value="">Semua status</option>'+STATUS.map(s=>`<option>${s}</option>`).join('');
  ['q','fs','fd'].forEach(i=>$('#'+i).oninput=draw);draw();
  window.detail=id=>{const b=bookings().find(x=>x.id===id);modal(`<h3>Detail ${b.id}</h3>${summary(b)}<div class="kv"><span>Status</span>${badge(b.status)}</div><button class="btn btn-gray" style="margin-top:14px" onclick="closeModal()">Tutup</button>`)};
  window.changeStatus=id=>{const b=bookings().find(x=>x.id===id);modal(`<h3>Ubah status ${b.id}</h3><select id="ns">${STATUS.map(s=>`<option ${s===b.status?'selected':''}>${s}</option>`).join('')}</select><button class="btn" style="margin-top:14px" onclick="applyStatus('${id}')">Simpan status</button>`)};
  window.applyStatus=id=>{save('bookings',bookings().map(b=>b.id===id?{...b,status:$('#ns').value}:b));closeModal();toast('Status diperbarui');draw()};
  window.del=id=>{if(!confirm('Hapus booking '+id+'? Data tidak bisa dikembalikan.'))return;save('bookings',bookings().filter(b=>b.id!==id));toast('Booking dihapus');draw()};
}

if(pg==='layanan'){
  const draw=()=>{$('#body').innerHTML=services().map(s=>`<tr><td>${s.icon} ${esc(s.name)}</td><td>${esc(s.desc)}</td><td>${rp(s.price)}</td><td>${esc(s.time)}</td><td class="act"><button class="btn btn-sm btn-gray" onclick="edit(${s.id})">Edit</button><button class="btn btn-sm btn-red" onclick="del(${s.id})">Hapus</button></td></tr>`).join('')};
  const form=(s={})=>`<h3>${s.id?'Edit':'Tambah'} layanan</h3><form id="sf"><label>Nama layanan</label><input name="name" value="${esc(s.name)}"><label>Deskripsi</label><textarea name="desc" rows="2">${esc(s.desc)}</textarea><div class="row"><div><label>Harga (Rp)</label><input name="price" type="number" min="0" value="${s.price||''}"></div><div><label>Estimasi waktu</label><input name="time" value="${esc(s.time)}" placeholder="1 jam"></div></div><label>Icon (emoji)</label><input name="icon" value="${esc(s.icon||'🔧')}" maxlength="4"><p class="err" id="fe"></p><button class="btn">Simpan layanan</button></form>`;
  const open=s=>{modal(form(s));$('#sf').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));
    if(!v.name.trim()||!v.desc.trim()||!v.time.trim()||!(+v.price>0)){$('#fe').textContent='Lengkapi semua kolom dan isi harga lebih dari 0';return}
    const item={id:s?.id||Date.now(),name:v.name.trim(),desc:v.desc.trim(),price:+v.price,time:v.time.trim(),icon:v.icon||'🔧'};
    save('services',s?.id?services().map(x=>x.id===s.id?item:x):[...services(),item]);closeModal();toast('Layanan disimpan');draw()}};
  $('#add').onclick=()=>open();window.edit=id=>open(services().find(x=>x.id===id));
  window.del=id=>{if(!confirm('Hapus layanan ini?'))return;save('services',services().filter(x=>x.id!==id));toast('Layanan dihapus');draw()};
  draw();
}
