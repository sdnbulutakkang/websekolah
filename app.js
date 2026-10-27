/**
 * ============================================================
 *  APP.JS — SPA hash-router. Semua tampilan dirender ke #app.
 *  Tidak ada framework: vanilla JS agar ringan di GitHub Pages.
 * ============================================================
 */
const $app = document.getElementById('app');
const $navbar = document.getElementById('navbar');
const $footer = document.getElementById('footer');
const $toastWrap = document.getElementById('toast-wrap');

// ---------------- SESSION ----------------
const Session = {
  get() {
    try { return JSON.parse(localStorage.getItem(window.APP_CONFIG.SESSION_STORAGE_KEY) || 'null'); }
    catch (e) { return null; }
  },
  set(data) { localStorage.setItem(window.APP_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(data)); },
  clear() { localStorage.removeItem(window.APP_CONFIG.SESSION_STORAGE_KEY); Api.clearToken(); }
};

// ---------------- TOAST ----------------
function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  $toastWrap.appendChild(el);
  setTimeout(function () { el.remove(); }, 4500);
}

// ---------------- HELPERS ----------------
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function skeletonCards(n, h) {
  let s = '<div class="grid grid-3">';
  for (let i = 0; i < n; i++) s += '<div class="skeleton" style="height:' + (h || 220) + 'px"></div>';
  return s + '</div>';
}
function qs(name) { return new URLSearchParams(location.hash.split('?')[1] || '').get(name); }

// ---------------- NAVBAR / FOOTER ----------------
const NAV_LINKS = [
  ['#/', 'Beranda'], ['#/profil', 'Profil'], ['#/guru', 'Guru'], ['#/akademik', 'Akademik'],
  ['#/berita', 'Berita'], ['#/pengumuman', 'Pengumuman'], ['#/galeri', 'Galeri'],
  ['#/ppdb', 'PPDB'], ['#/kontak', 'Kontak']
];
function renderNavbar() {
  const session = Session.get();
  const currentHash = location.hash.split('?')[0] || '#/';
  const links = NAV_LINKS.map(function (l) {
    return '<a href="' + l[0] + '" class="' + (currentHash === l[0] ? 'active' : '') + '">' + l[1] + '</a>';
  }).join('');

  const actions = session
    ? '<a href="#/' + roleHome_(session.role) + '" class="btn btn-outline btn-sm">Dashboard</a>' +
      '<button class="btn btn-sm btn-outline" onclick="doLogout()">Keluar</button>'
    : '<a href="#/login" class="btn btn-outline btn-sm">Masuk</a>' +
      '<a href="#/ppdb/formulir" class="btn btn-amber btn-sm">Daftar PPDB</a>';

  $navbar.innerHTML =
    '<div class="container">' +
      '<a href="#/" class="brand"><span class="logo-dot">SD</span>' + esc(window.APP_CONFIG.SITE_NAME) + '</a>' +
      '<nav>' + links + '</nav>' +
      '<div class="actions">' + actions + '</div>' +
      '<button class="nav-toggle" onclick="document.getElementById(\'navbar\').classList.toggle(\'open\')">&#9776;</button>' +
    '</div>';
}
function roleHome_(role) {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN_SEKOLAH' || role === 'PANITIA_PPDB') return 'admin';
  if (role === 'GURU') return 'portal/guru';
  return 'portal/orang-tua';
}
function renderFooter() {
  $footer.innerHTML =
    '<div class="container footer-grid">' +
      '<div><h4>' + esc(window.APP_CONFIG.SITE_NAME) + '</h4>' +
        '<p style="font-size:13px">Membentuk generasi pembelajar yang berakhlak mulia, berprestasi, mandiri, dan berbudaya lingkungan.</p></div>' +
      '<div><h4>Tautan Cepat</h4><p><a href="#/profil">Profil Sekolah</a></p><p><a href="#/akademik">Akademik</a></p><p><a href="#/berita">Berita</a></p><p><a href="#/pengumuman">Pengumuman</a></p></div>' +
      '<div><h4>Kontak</h4><p id="footer-kontak" style="font-size:13px">Memuat...</p></div>' +
      '<div><h4>Akses Portal</h4><p><a href="#/login">Masuk ke Portal</a></p><p><a href="#/ppdb">Cek Status PPDB</a></p></div>' +
    '</div>' +
    '<div class="container"><div class="footer-bottom">' +
      '<span>&copy; ' + new Date().getFullYear() + ' ' + esc(window.APP_CONFIG.SITE_NAME) + '. Seluruh hak cipta dilindungi.</span>' +
      '<span><a href="#/privasi">Kebijakan Privasi</a> &middot; <a href="#/ketentuan">Ketentuan Layanan</a></span>' +
    '</div></div>';
}

// ---------------- ROUTER ----------------
const routes = {};
function route(path, handler) { routes[path] = handler; }
async function router() {
  renderNavbar();
  renderFooter();
  window.scrollTo(0, 0);
  const full = location.hash || '#/';
  const path = full.split('?')[0];
  const handler = routes[path] || routes['#/404'];
  $app.innerHTML = '<div class="container section"><div class="skeleton" style="height:300px"></div></div>';
  try { await handler(); }
  catch (e) { $app.innerHTML = '<div class="container section"><p class="muted">Terjadi kesalahan memuat halaman ini.</p></div>'; }
}
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// Guard halaman yang butuh login
function requireAuth_(allowedRoles) {
  const s = Session.get();
  if (!s) { location.hash = '#/login'; return null; }
  if (allowedRoles && allowedRoles.indexOf(s.role) === -1) {
    $app.innerHTML = '<div class="container section text-center"><h2>Akses Ditolak</h2><p class="muted">Anda tidak memiliki hak akses ke halaman ini.</p><a href="#/" class="btn btn-primary">Kembali ke Beranda</a></div>';
    return null;
  }
  return s;
}

// ============================================================
// VIEW: BERANDA
// ============================================================
route('#/', async function () {
  $app.innerHTML =
    '<div class="container">' +
      '<div class="hero"><div class="hero-content">' +
        '<span class="pill pill-amber">Penerimaan Peserta Didik Baru Dibuka</span>' +
        '<h1>Membentuk Karakter Unggul, Cerdas, dan Berbudi Pekerti Luhur</h1>' +
        '<p>Sekolah dasar negeri unggulan yang menghadirkan lingkungan belajar ramah anak dan berakar pada budaya luhur.</p>' +
        '<div class="hero-actions">' +
          '<a href="#/ppdb/formulir" class="btn btn-amber">Daftar PPDB Sekarang</a>' +
          '<a href="#/profil" class="btn btn-outline-white">Kenali Sekolah Kami</a>' +
        '</div>' +
      '</div></div>' +
      '<div id="home-stats" class="grid grid-4 mt-3">' + skeletonCards(4, 90) + '</div>' +
    '</div>' +
    '<div class="container section"><div class="section-title"><span class="eyebrow">Warta Sekolah</span><h2>Berita &amp; Prestasi Terkini</h2></div><div id="home-berita">' + skeletonCards(3) + '</div></div>' +
    '<div class="container section"><div class="section-title"><span class="eyebrow">Papan Informasi</span><h2>Pengumuman Resmi</h2></div><div id="home-pengumuman"><div class="skeleton" style="height:160px"></div></div></div>' +
    '<div class="container"><div class="hero" style="min-height:0;padding:0"><div class="hero-content" style="padding:40px;max-width:100%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">' +
      '<div><h2 style="color:#fff">Siap Memberikan Pendidikan Terbaik Bagi Buah Hati Anda?</h2></div>' +
      '<a href="#/ppdb/formulir" class="btn btn-amber">Daftar PPDB Online</a>' +
    '</div></div></div>';

  const prof = await Api.get('public.profile');
  if (prof.success) {
    const s = prof.data.statistik;
    document.getElementById('home-stats').innerHTML =
      statCard_(s.totalSiswa + '+', 'Siswa Aktif') + statCard_(s.totalGuru, 'Guru & Pendidik') +
      statCard_(s.totalKelas, 'Rombongan Belajar') + statCard_('A', 'Akreditasi');
    document.getElementById('footer-kontak').innerHTML =
      esc(prof.data.alamat || '-') + '<br>' + esc(prof.data.telepon || '') + '<br>' + esc(prof.data.email || '');
  }

  const berita = await Api.get('public.berita.list', { page: 1 });
  const $b = document.getElementById('home-berita');
  if (berita.success && berita.data.length) {
    $b.innerHTML = '<div class="grid grid-3">' + berita.data.slice(0, 3).map(beritaCard_).join('') + '</div>';
  } else {
    $b.innerHTML = '<div class="empty-state">Belum ada berita dipublikasikan.</div>';
  }

  const pengumuman = await Api.get('public.pengumuman.list');
  const $p = document.getElementById('home-pengumuman');
  if (pengumuman.success && pengumuman.data.length) {
    $p.innerHTML = pengumuman.data.slice(0, 3).map(pengumumanRow_).join('');
  } else {
    $p.innerHTML = '<div class="empty-state">Belum ada pengumuman aktif.</div>';
  }
});
function statCard_(num, label) { return '<div class="stat-card"><div class="num">' + esc(num) + '</div><div class="label">' + esc(label) + '</div></div>'; }
function beritaCard_(b) {
  return '<a href="#/berita/' + esc(b.slug) + '" class="card card-hover" style="padding:0;overflow:hidden;display:block">' +
    '<div style="height:160px;background:' + (b.gambarUrl ? 'url(' + esc(b.gambarUrl) + ') center/cover' : 'var(--blue-light)') + '"></div>' +
    '<div style="padding:18px"><span class="pill pill-blue">' + esc(b.kategori) + '</span>' +
    '<h3 style="font-size:16px;margin-top:10px">' + esc(b.judul) + '</h3>' +
    '<p class="muted" style="font-size:13px">' + esc(b.ringkasan || '').slice(0, 90) + '&hellip;</p>' +
    '<span class="muted" style="font-size:12px">' + fmtDate(b.tayangPada) + '</span></div></a>';
}
function pengumumanRow_(p) {
  const prio = p.prioritas === 'URGENT' ? 'pill-amber' : 'pill-gray';
  return '<div class="card" style="display:flex;gap:16px;align-items:flex-start;margin-bottom:12px">' +
    '<div style="background:var(--navy);color:#fff;border-radius:10px;padding:8px 14px;text-align:center;min-width:64px">' +
      '<div style="font-size:11px">' + fmtDate(p.tayangPada).split(' ')[1] + '</div><div style="font-weight:700;font-size:18px">' + fmtDate(p.tayangPada).split(' ')[0] + '</div></div>' +
    '<div style="flex:1"><span class="pill ' + prio + '">' + esc(p.kategori || 'Umum') + '</span>' +
    '<h3 style="font-size:15px;margin:6px 0 4px">' + esc(p.judul) + '</h3><p class="muted" style="font-size:13px;margin:0">' + esc((p.isi || '').slice(0, 120)) + '&hellip;</p></div></div>';
}

// ============================================================
// VIEW: PROFIL
// ============================================================
route('#/profil', async function () {
  const r = await Api.get('public.profile');
  const d = r.success ? r.data : {};
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / Profil</div><h1>Profil &amp; Identitas Sekolah</h1></div>' +
    '<div class="container section">' +
      '<div class="card mb-0"><h3>Sejarah &amp; Perkembangan</h3><p class="muted">Profil lengkap sejarah sekolah dapat dilengkapi oleh admin melalui dashboard.</p></div>' +
      '<div class="card mt-3"><h3>Visi</h3><p>' + esc(d.visi || '-') + '</p><h3>Misi</h3><p style="white-space:pre-line">' + esc(d.misi || '-') + '</p></div>' +
      '<div class="card mt-3"><h3>Pimpinan Sekolah</h3><p><strong>' + esc(d.kepalaSekolah || '-') + '</strong><br><span class="muted">Kepala Sekolah</span></p></div>' +
      '<div class="card mt-3"><h3>Identitas Sekolah</h3>' +
        '<table><tr><td class="muted">NPSN</td><td>' + esc(d.npsn || '-') + '</td></tr>' +
        '<tr><td class="muted">Alamat</td><td>' + esc(d.alamat || '-') + '</td></tr>' +
        '<tr><td class="muted">Telepon</td><td>' + esc(d.telepon || '-') + '</td></tr>' +
        '<tr><td class="muted">Email</td><td>' + esc(d.email || '-') + '</td></tr></table></div>' +
    '</div>';
});

// ============================================================
// VIEW: GURU
// ============================================================
route('#/guru', async function () {
  $app.innerHTML = '<div class="container page-header"><div class="breadcrumb">Beranda / Guru &amp; Staf</div><h1>Guru &amp; Tenaga Kependidikan</h1></div><div class="container section" id="guru-list">' + skeletonCards(8, 180) + '</div>';
  const r = await Api.get('public.guru.list');
  const $g = document.getElementById('guru-list');
  if (r.success && r.data.length) {
    $g.innerHTML = '<div class="grid grid-4">' + r.data.map(function (g) {
      return '<div class="card text-center">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:var(--blue-light);margin:0 auto 12px"></div>' +
        '<strong>' + esc(g.nama) + '</strong><div class="pill pill-blue mt-1">' + esc(g.jabatan || '-') + '</div>' +
        '<p class="muted" style="font-size:13px;margin-top:8px">' + esc(g.bidang || '') + '</p></div>';
    }).join('') + '</div>';
  } else {
    $g.innerHTML = '<div class="empty-state">Belum ada data guru &amp; staf yang dipublikasikan.</div>';
  }
});

// ============================================================
// VIEW: AKADEMIK (statis — konten kurikulum biasanya jarang berubah)
// ============================================================
route('#/akademik', async function () {
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / Akademik</div><h1>Kurikulum &amp; Program Pembelajaran</h1></div>' +
    '<div class="container section"><div class="grid grid-3">' +
      ['Kelas 1–2 (Fase A)', 'Kelas 3–4 (Fase B)', 'Kelas 5–6 (Fase C)'].map(function (f, i) {
        return '<div class="card"><span class="pill pill-blue">Fase ' + 'ABC'[i] + '</span><h3 class="mt-2">' + f + '</h3><p class="muted">Kurikulum Merdeka dengan penguatan literasi, numerasi, dan Profil Pelajar Pancasila.</p></div>';
      }).join('') +
    '</div></div>';
});

// ============================================================
// VIEW: BERITA — list & detail
// ============================================================
route('#/berita', async function () {
  const page = Number(qs('page') || 1);
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / Berita</div><h1>Berita &amp; Prestasi</h1></div>' +
    '<div class="container section">' +
      '<div class="field" style="max-width:420px"><input id="berita-search" placeholder="Cari judul berita..."></div>' +
      '<div id="berita-list">' + skeletonCards(6) + '</div>' +
      '<div id="berita-pagination" class="flex gap-2 mt-3 text-center" style="justify-content:center"></div>' +
    '</div>';
  async function load() {
    const r = await Api.get('public.berita.list', { page: page, q: document.getElementById('berita-search').value });
    const $l = document.getElementById('berita-list');
    $l.innerHTML = r.success && r.data.length ? '<div class="grid grid-3">' + r.data.map(beritaCard_).join('') + '</div>' : '<div class="empty-state">Tidak ada berita ditemukan.</div>';
    const totalPage = Math.ceil((r.total || 0) / (r.perPage || 9));
    let pg = '';
    for (let i = 1; i <= totalPage; i++) pg += '<a href="#/berita?page=' + i + '" class="btn btn-sm ' + (i === page ? 'btn-primary' : 'btn-outline') + '">' + i + '</a>';
    document.getElementById('berita-pagination').innerHTML = pg;
  }
  document.getElementById('berita-search').addEventListener('input', debounce_(load, 400));
  load();
});
route('#/berita/:detail', null); // placeholder agar terdaftar; penanganan nyata di router override di bawah
function debounce_(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

// Override router untuk path dinamis /berita/<slug>
const originalRouter = router;
async function routerDynamic() {
  const full = (location.hash || '#/').split('?')[0];
  if (full.startsWith('#/berita/') && full !== '#/berita/:detail') {
    renderNavbar(); renderFooter(); window.scrollTo(0, 0);
    const slug = full.replace('#/berita/', '');
    $app.innerHTML = '<div class="container section"><div class="skeleton" style="height:300px"></div></div>';
    const r = await Api.get('public.berita.detail', { slug: slug });
    if (!r.success) { $app.innerHTML = '<div class="container section text-center"><h2>Berita tidak ditemukan</h2><a href="#/berita" class="btn btn-primary">Kembali ke Berita</a></div>'; return; }
    const b = r.data;
    $app.innerHTML =
      '<div class="container page-header"><div class="breadcrumb">Beranda / Berita / ' + esc(b.judul) + '</div></div>' +
      '<div class="container section"><div class="grid" style="grid-template-columns:2fr 1fr">' +
        '<div><span class="pill pill-blue">' + esc(b.kategori) + '</span><h1 class="mt-2">' + esc(b.judul) + '</h1>' +
        '<p class="muted">Oleh ' + esc(b.penulis) + ' &middot; ' + fmtDate(b.tayangPada) + '</p>' +
        (b.gambarUrl ? '<div style="height:320px;border-radius:16px;background:url(' + esc(b.gambarUrl) + ') center/cover;margin:16px 0"></div>' : '') +
        '<div style="white-space:pre-line">' + esc(b.isi) + '</div></div>' +
        '<div>' + (r.related && r.related.length ? '<h4>Berita Terkait</h4>' + r.related.map(function (x) { return '<a href="#/berita/' + esc(x.slug) + '" class="card mb-0 mt-2" style="display:block">' + esc(x.judul) + '</a>'; }).join('') : '') + '</div>' +
      '</div></div>';
    return;
  }
  if (full.startsWith('#/berita/:detail')) return;
  return originalRouter();
}
window.removeEventListener('hashchange', router);
window.removeEventListener('DOMContentLoaded', router);
window.addEventListener('hashchange', routerDynamic);
window.addEventListener('DOMContentLoaded', routerDynamic);

// ============================================================
// VIEW: PENGUMUMAN
// ============================================================
route('#/pengumuman', async function () {
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / Pengumuman</div><h1>Pengumuman &amp; Surat Edaran</h1></div>' +
    '<div class="container section"><div class="flex gap-2 mb-0"><button class="btn btn-sm btn-primary" id="tab-aktif">Aktif</button><button class="btn btn-sm btn-outline" id="tab-arsip">Arsip</button></div>' +
    '<div id="pengumuman-list" class="mt-3">' + skeletonCards(3, 100) + '</div></div>';
  async function load(status) {
    const r = await Api.get('public.pengumuman.list', { status: status });
    document.getElementById('pengumuman-list').innerHTML = r.success && r.data.length ? r.data.map(pengumumanRow_).join('') : '<div class="empty-state">Tidak ada pengumuman.</div>';
  }
  document.getElementById('tab-aktif').onclick = function () { this.className = 'btn btn-sm btn-primary'; document.getElementById('tab-arsip').className = 'btn btn-sm btn-outline'; load('aktif'); };
  document.getElementById('tab-arsip').onclick = function () { this.className = 'btn btn-sm btn-primary'; document.getElementById('tab-aktif').className = 'btn btn-sm btn-outline'; load('arsip'); };
  load('aktif');
});

// ============================================================
// VIEW: GALERI
// ============================================================
route('#/galeri', async function () {
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / Galeri</div><h1>Galeri Kegiatan Siswa</h1></div>' +
    '<div class="container section" id="galeri-grid">' + skeletonCards(8, 160) + '</div>';
  const r = await Api.get('public.galeri.list');
  const $g = document.getElementById('galeri-grid');
  if (r.success && r.data.length) {
    $g.innerHTML = '<div class="grid grid-4">' + r.data.map(function (g) {
      return '<div class="card" style="padding:0;overflow:hidden"><div style="height:140px;background:' + (g.gambarUrl ? 'url(' + esc(g.gambarUrl) + ') center/cover' : 'var(--blue-light)') + '"></div>' +
        '<div style="padding:10px"><p class="muted mb-0" style="font-size:12px">' + esc(g.caption || '') + '</p></div></div>';
    }).join('') + '</div>';
  } else {
    $g.innerHTML = '<div class="empty-state">Belum ada dokumentasi kegiatan yang dipublikasikan.</div>';
  }
});

// ============================================================
// VIEW: PPDB — info, formulir, konfirmasi, status
// ============================================================
route('#/ppdb', async function () {
  const r = await Api.get('public.ppdb.info');
  const d = r.success ? r.data : {};
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / PPDB</div>' +
      '<span class="pill ' + (d.bukaPendaftaran ? 'pill-success' : 'pill-danger') + '">' + (d.bukaPendaftaran ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup') + '</span>' +
      '<h1 class="mt-1">Penerimaan Peserta Didik Baru ' + esc(d.periodeAktif || '') + '</h1></div>' +
    '<div class="container section">' +
      '<div class="grid grid-3 mb-0">' +
        statCard_(d.kuota || '-', 'Daya Tampung') + statCard_((d.terpakai || 0) + '/' + (d.kuota || '-'), 'Kuota Terisi') + statCard_(d.tanggalSelesai ? fmtDate(d.tanggalSelesai) : '-', 'Batas Pendaftaran') +
      '</div>' +
      '<div class="card mt-3"><h3>Dokumen yang Diperlukan</h3><ul>' + (d.dokumenWajib || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p class="muted" style="font-size:13px">NIK dan Nomor KK tidak diminta pada tahap awal pendaftaran online.</p></div>' +
      '<div class="flex gap-3 mt-3">' +
        '<a href="#/ppdb/formulir" class="btn btn-amber">Daftar Sekarang</a>' +
        '<a href="#/ppdb/status" class="btn btn-outline">Cek Status Pendaftaran</a>' +
      '</div>' +
    '</div>';
});

route('#/ppdb/formulir', async function () {
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / PPDB / Formulir</div><h1>Formulir Pendaftaran Siswa Baru</h1></div>' +
    '<div class="container section" style="max-width:720px">' +
    '<form id="ppdb-form" class="card">' +
      '<h3>Data Calon Siswa</h3>' +
      '<div class="field"><label>Nama Lengkap Calon Siswa *</label><input name="namaCalon" required></div>' +
      '<div class="form-row">' +
        '<div class="field"><label>Tanggal Lahir *</label><input type="date" name="tanggalLahir" required></div>' +
        '<div class="field"><label>Jenis Kelamin</label><select name="jenisKelamin"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>' +
      '</div>' +
      '<div class="field"><label>Sekolah Asal (TK/PAUD, opsional)</label><input name="sekolahAsal"></div>' +
      '<h3 class="mt-3">Data Orang Tua / Wali</h3>' +
      '<div class="field"><label>Nama Lengkap Orang Tua / Wali *</label><input name="namaOrtu" required></div>' +
      '<div class="form-row">' +
        '<div class="field"><label>Nomor WhatsApp Aktif *</label><input name="kontakOrtu" required placeholder="08xxxxxxxxxx"></div>' +
        '<div class="field"><label>Jalur Pendaftaran *</label><select name="jalur" required><option value="Zonasi">Zonasi Domisili</option><option value="Afirmasi">Afirmasi (KIP/KPS)</option><option value="Tugas Orang Tua">Perpindahan Tugas Orang Tua</option></select></div>' +
      '</div>' +
      '<div class="field"><label>Alamat Domisili Sesuai Kartu Keluarga *</label><textarea name="alamat" required></textarea></div>' +
      '<div class="field"><div class="dropzone">Unggah dokumen pendukung akan tersedia setelah integrasi penyimpanan Drive (fase berikutnya). Untuk saat ini dokumen dapat diserahkan langsung ke sekretariat.</div></div>' +
      '<div class="field flex gap-2 items-center"><input type="checkbox" id="pernyataan" required style="width:auto;height:auto"><label for="pernyataan" class="mb-0">Saya menyatakan data yang diisi benar dan sah.</label></div>' +
      '<button class="btn btn-amber btn-block" type="submit" id="ppdb-submit-btn">Kirim Pendaftaran</button>' +
    '</form></div>';

  document.getElementById('ppdb-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    const btn = document.getElementById('ppdb-submit-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Mengirim...';
    const fd = new FormData(ev.target);
    const data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    const r = await Api.post('public.ppdb.submit', data);
    btn.disabled = false; btn.textContent = 'Kirim Pendaftaran';
    if (r.success) {
      sessionStorage.setItem('ppdb_last', JSON.stringify(r.data));
      location.hash = '#/ppdb/konfirmasi';
    } else {
      toast(r.message || 'Pendaftaran gagal dikirim.', 'error');
    }
  });
});

route('#/ppdb/konfirmasi', async function () {
  const data = JSON.parse(sessionStorage.getItem('ppdb_last') || 'null');
  if (!data) { location.hash = '#/ppdb'; return; }
  $app.innerHTML =
    '<div class="container section text-center" style="max-width:560px">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:var(--success-bg);color:var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px">&#10003;</div>' +
      '<h1>Pendaftaran Berhasil Dikirim!</h1>' +
      '<p class="muted">Simpan nomor registrasi dan token berikut untuk memantau status pendaftaran.</p>' +
      '<div class="card text-center mt-3">' +
        '<div class="muted" style="font-size:12px">NOMOR REGISTRASI</div>' +
        '<div style="font-size:24px;font-weight:700;color:var(--navy)">' + esc(data.registrasiId) + '</div>' +
        '<div class="muted mt-2" style="font-size:12px">TOKEN AKSES (RAHASIA)</div>' +
        '<div style="font-size:18px;font-weight:700">' + esc(data.token) + '</div>' +
      '</div>' +
      '<div class="flex gap-2 mt-3" style="justify-content:center">' +
        '<a href="#/ppdb/status" class="btn btn-amber">Cek Status</a>' +
        '<a href="#/" class="btn btn-outline">Kembali ke Beranda</a>' +
      '</div>' +
    '</div>';
});

route('#/ppdb/status', async function () {
  $app.innerHTML =
    '<div class="container section text-center" style="max-width:480px">' +
      '<h1>Cek Status Pendaftaran PPDB</h1>' +
      '<form id="status-form" class="card" style="text-align:left">' +
        '<div class="field"><label>Nomor Registrasi</label><input name="registrasiId" required placeholder="PPDB-2025-XXXXXX"></div>' +
        '<div class="field"><label>Token Akses</label><input name="token" required></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Periksa Status</button>' +
      '</form>' +
      '<div id="status-result" class="mt-3"></div>' +
    '</div>';
  document.getElementById('status-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target); const data = {}; fd.forEach(function (v, k) { data[k] = v; });
    const r = await Api.get('public.ppdb.status', data);
    const $r = document.getElementById('status-result');
    if (!r.success) { $r.innerHTML = '<div class="callout" style="border-color:var(--danger);background:var(--danger-bg)">' + esc(r.message) + '</div>'; return; }
    const statusMap = { SUBMITTED: 'pill-blue', UNDER_REVIEW: 'pill-amber', NEEDS_CORRECTION: 'pill-amber', ACCEPTED: 'pill-success', REJECTED: 'pill-danger', WITHDRAWN: 'pill-gray' };
    $r.innerHTML = '<div class="card text-left"><strong>' + esc(r.data.namaCalon) + '</strong><br><span class="muted">' + esc(r.data.jalur) + '</span>' +
      '<div class="mt-2"><span class="pill ' + (statusMap[r.data.status] || 'pill-gray') + '">' + esc(r.data.status) + '</span></div>' +
      (r.data.catatanPanitia ? '<div class="callout mt-3">' + esc(r.data.catatanPanitia) + '</div>' : '') + '</div>';
  });
});

// ============================================================
// VIEW: KONTAK
// ============================================================
route('#/kontak', async function () {
  $app.innerHTML =
    '<div class="container page-header"><div class="breadcrumb">Beranda / Kontak</div><h1>Hubungi Kami &amp; Pusat Bantuan</h1></div>' +
    '<div class="container section"><div class="grid" style="grid-template-columns:1fr 1.4fr">' +
      '<div class="card"><h3>Alamat &amp; Kontak</h3><p id="kontak-info" class="muted">Memuat...</p></div>' +
      '<form id="kontak-form" class="card">' +
        '<div class="form-row"><div class="field"><label>Nama Lengkap *</label><input name="nama" required></div><div class="field"><label>Email *</label><input type="email" name="email" required></div></div>' +
        '<div class="field"><label>Perihal</label><input name="subjek"></div>' +
        '<div class="field"><label>Pesan *</label><textarea name="pesan" required></textarea></div>' +
        '<button class="btn btn-amber" type="submit">Kirim Pesan</button>' +
      '</form>' +
    '</div></div>';
  const prof = await Api.get('public.profile');
  if (prof.success) document.getElementById('kontak-info').innerHTML = esc(prof.data.alamat) + '<br>' + esc(prof.data.telepon) + '<br>' + esc(prof.data.email) + '<br><br>' + esc(prof.data.jamLayanan);
  document.getElementById('kontak-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target); const data = {}; fd.forEach(function (v, k) { data[k] = v; });
    const r = await Api.post('public.kontak.submit', data);
    toast(r.message, r.success ? 'success' : 'error');
    if (r.success) ev.target.reset();
  });
});

// ============================================================
// VIEW: LOGIN
// ============================================================
route('#/login', async function () {
  $app.innerHTML =
    '<div class="container section text-center" style="max-width:420px">' +
      '<div class="card">' +
        '<h2>Masuk ke Sistem</h2><p class="muted">Portal Administrasi, Guru &amp; Wali Murid</p>' +
        '<form id="login-form" style="text-align:left">' +
          '<div class="field"><label>Username / NIP / NISN</label><input name="username" required></div>' +
          '<div class="field"><label>Kata Sandi</label><input type="password" name="password" required></div>' +
          '<button class="btn btn-primary btn-block" type="submit" id="login-btn">Masuk</button>' +
        '</form>' +
      '</div>' +
    '</div>';
  document.getElementById('login-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    const btn = document.getElementById('login-btn'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    const fd = new FormData(ev.target); const data = {}; fd.forEach(function (v, k) { data[k] = v; });
    const r = await Api.post('auth.login', data);
    btn.disabled = false; btn.textContent = 'Masuk';
    if (!r.success) { toast(r.message, 'error'); return; }
    Api.setToken(r.data.token);
    Session.set(r.data);
    toast('Berhasil masuk.', 'success');
    location.hash = '#/' + roleHome_(r.data.role);
  });
});
window.doLogout = async function () {
  await Api.post('auth.logout', {});
  Session.clear();
  toast('Berhasil keluar.', 'success');
  location.hash = '#/';
};

// ============================================================
// VIEW: ADMIN (Fase 1 — dashboard ringkas + CRUD Berita/Pengumuman)
// ============================================================
route('#/admin', async function () {
  const sesi = requireAuth_(['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'PANITIA_PPDB']);
  if (!sesi) return;
  $app.innerHTML =
    '<div class="container section">' +
      '<div class="flex justify-between items-center"><h1>Dashboard Admin</h1>' +
        '<div class="flex gap-2"><a href="#/admin/berita" class="btn btn-outline btn-sm">Kelola Berita</a><a href="#/admin/pengumuman" class="btn btn-outline btn-sm">Kelola Pengumuman</a></div></div>' +
      '<div id="admin-stats" class="grid grid-4 mt-2">' + skeletonCards(4, 90) + '</div>' +
      '<div class="card mt-3"><h3>Aktivitas Terbaru</h3><div id="admin-log"></div></div>' +
    '</div>';
  const r = await Api.get('admin.dashboard.stats');
  if (!r.success) { toast(r.message, 'error'); if (r.code === 'UNAUTHORIZED') { Session.clear(); location.hash = '#/login'; } return; }
  const d = r.data;
  document.getElementById('admin-stats').innerHTML =
    statCard_(d.siswaAktif, 'Siswa Aktif') + statCard_(d.guruStaf, 'Guru & Staf') + statCard_(d.pendaftarPpdb, 'Pendaftar PPDB') + statCard_(d.menungguVerifikasi, 'Menunggu Verifikasi');
  document.getElementById('admin-log').innerHTML = d.aktivitasTerbaru.length
    ? '<table><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Keterangan</th></tr>' +
      d.aktivitasTerbaru.map(function (a) { return '<tr><td>' + fmtDate(a.waktu) + '</td><td>' + esc(a.aktor) + '</td><td>' + esc(a.aksi) + '</td><td>' + esc(a.keterangan) + '</td></tr>'; }).join('') + '</table>'
    : '<div class="empty-state">Belum ada aktivitas.</div>';
});

route('#/admin/berita', async function () {
  const sesi = requireAuth_(['SUPER_ADMIN', 'ADMIN_SEKOLAH']);
  if (!sesi) return;
  $app.innerHTML =
    '<div class="container section"><div class="flex justify-between items-center"><h1>Kelola Berita</h1><button class="btn btn-primary" id="btn-new-berita">+ Tulis Berita</button></div>' +
    '<div id="berita-admin-list" class="mt-2">' + skeletonCards(1, 300) + '</div>' +
    '<div id="berita-editor"></div></div>';
  async function load() {
    const r = await Api.get('admin.berita.list', { token: Api.getToken() });
    const $l = document.getElementById('berita-admin-list');
    if (!r.success) { $l.innerHTML = '<div class="empty-state">' + esc(r.message) + '</div>'; return; }
    $l.innerHTML = r.data.length ? '<table><tr><th>Judul</th><th>Kategori</th><th>Status</th><th>Tanggal</th><th></th></tr>' +
      r.data.map(function (b) {
        return '<tr><td>' + esc(b.judul) + '</td><td>' + esc(b.kategori) + '</td><td><span class="pill ' + (b.status === 'TERBIT' ? 'pill-success' : 'pill-gray') + '">' + esc(b.status) + '</span></td><td>' + fmtDate(b.tayangPada) + '</td>' +
          '<td><button class="btn btn-sm btn-outline" onclick=\'editBerita(' + JSON.stringify(JSON.stringify(b)) + ')\'>Edit</button></td></tr>';
      }).join('') + '</table>' : '<div class="empty-state">Belum ada berita. Klik "Tulis Berita" untuk membuat yang pertama.</div>';
  }
  function editor(b) {
    b = b || {};
    document.getElementById('berita-editor').innerHTML =
      '<div class="card mt-3"><h3>' + (b.beritaId ? 'Edit Berita' : 'Berita Baru') + '</h3>' +
      '<form id="berita-form">' +
        '<input type="hidden" name="beritaId" value="' + esc(b.beritaId || '') + '">' +
        '<div class="field"><label>Judul *</label><input name="judul" value="' + esc(b.judul || '') + '" required></div>' +
        '<div class="form-row"><div class="field"><label>Kategori</label><input name="kategori" value="' + esc(b.kategori || 'Kegiatan') + '"></div>' +
        '<div class="field"><label>Status</label><select name="status"><option value="DRAFT"' + (b.status === 'DRAFT' ? ' selected' : '') + '>Draf</option><option value="TERBIT"' + (b.status === 'TERBIT' ? ' selected' : '') + '>Terbit</option></select></div></div>' +
        '<div class="field"><label>URL Gambar Sampul</label><input name="gambarUrl" value="' + esc(b.gambarUrl || '') + '"></div>' +
        '<div class="field"><label>Ringkasan</label><textarea name="ringkasan">' + esc(b.ringkasan || '') + '</textarea></div>' +
        '<div class="field"><label>Isi Berita *</label><textarea name="isi" style="min-height:200px" required>' + esc(b.isi || '') + '</textarea></div>' +
        '<button class="btn btn-primary" type="submit">Simpan</button> <button class="btn btn-outline" type="button" onclick="document.getElementById(\'berita-editor\').innerHTML=\'\'">Batal</button>' +
      '</form></div>';
    document.getElementById('berita-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const fd = new FormData(ev.target); const data = {}; fd.forEach(function (v, k) { data[k] = v; });
      const r = await Api.post('admin.berita.save', data);
      toast(r.message, r.success ? 'success' : 'error');
      if (r.success) { document.getElementById('berita-editor').innerHTML = ''; load(); }
    });
  }
  window.editBerita = function (json) { editor(JSON.parse(json)); };
  document.getElementById('btn-new-berita').onclick = function () { editor(null); };
  load();
});

route('#/admin/pengumuman', async function () {
  const sesi = requireAuth_(['SUPER_ADMIN', 'ADMIN_SEKOLAH']);
  if (!sesi) return;
  $app.innerHTML =
    '<div class="container section"><div class="flex justify-between items-center"><h1>Kelola Pengumuman</h1><button class="btn btn-primary" id="btn-new-p">+ Buat Pengumuman</button></div>' +
    '<div id="p-admin-list" class="mt-2">' + skeletonCards(1, 300) + '</div><div id="p-editor"></div></div>';
  async function load() {
    const r = await Api.get('admin.pengumuman.list', { token: Api.getToken() });
    const $l = document.getElementById('p-admin-list');
    if (!r.success) { $l.innerHTML = '<div class="empty-state">' + esc(r.message) + '</div>'; return; }
    $l.innerHTML = r.data.length ? '<table><tr><th>Judul</th><th>Prioritas</th><th>Status</th><th></th></tr>' +
      r.data.map(function (p) {
        return '<tr><td>' + esc(p.judul) + '</td><td>' + esc(p.prioritas) + '</td><td><span class="pill ' + (p.status === 'AKTIF' ? 'pill-success' : 'pill-gray') + '">' + esc(p.status) + '</span></td>' +
          '<td><button class="btn btn-sm btn-outline" onclick=\'editP(' + JSON.stringify(JSON.stringify(p)) + ')\'>Edit</button></td></tr>';
      }).join('') + '</table>' : '<div class="empty-state">Belum ada pengumuman.</div>';
  }
  function editor(p) {
    p = p || {};
    document.getElementById('p-editor').innerHTML =
      '<div class="card mt-3"><h3>' + (p.pengumumanId ? 'Edit' : 'Pengumuman Baru') + '</h3><form id="p-form">' +
      '<input type="hidden" name="pengumumanId" value="' + esc(p.pengumumanId || '') + '">' +
      '<div class="field"><label>Judul *</label><input name="judul" value="' + esc(p.judul || '') + '" required></div>' +
      '<div class="form-row"><div class="field"><label>Prioritas</label><select name="prioritas"><option value="NORMAL"' + (p.prioritas === 'NORMAL' ? ' selected' : '') + '>Normal</option><option value="URGENT"' + (p.prioritas === 'URGENT' ? ' selected' : '') + '>Mendesak</option></select></div>' +
      '<div class="field"><label>Status</label><select name="status"><option value="AKTIF"' + (p.status === 'AKTIF' ? ' selected' : '') + '>Aktif</option><option value="ARSIP"' + (p.status === 'ARSIP' ? ' selected' : '') + '>Arsip</option></select></div></div>' +
      '<div class="field"><label>Isi *</label><textarea name="isi" required>' + esc(p.isi || '') + '</textarea></div>' +
      '<button class="btn btn-primary" type="submit">Simpan</button> <button class="btn btn-outline" type="button" onclick="document.getElementById(\'p-editor\').innerHTML=\'\'">Batal</button></form></div>';
    document.getElementById('p-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const fd = new FormData(ev.target); const data = {}; fd.forEach(function (v, k) { data[k] = v; });
      const r = await Api.post('admin.pengumuman.save', data);
      toast(r.message, r.success ? 'success' : 'error');
      if (r.success) { document.getElementById('p-editor').innerHTML = ''; load(); }
    });
  }
  window.editP = function (json) { editor(JSON.parse(json)); };
  document.getElementById('btn-new-p').onclick = function () { editor(null); };
  load();
});

// Portal Guru & Orang Tua — placeholder Fase 1 (menampilkan status, UI penuh di Fase 2)
route('#/portal/guru', async function () {
  const sesi = requireAuth_(['GURU']);
  if (!sesi) return;
  $app.innerHTML = '<div class="container section"><h1>Portal Guru</h1><p class="muted">Selamat datang, ' + esc(sesi.nama) + '. Modul nilai, presensi, dan jadwal akan tersedia di Fase 2.</p></div>';
});
route('#/portal/orang-tua', async function () {
  const sesi = requireAuth_(['ORANG_TUA']);
  if (!sesi) return;
  $app.innerHTML = '<div class="container section"><h1>Portal Orang Tua</h1><p class="muted">Selamat datang, ' + esc(sesi.nama) + '. Rapor, presensi, dan jadwal anak akan tersedia di Fase 2.</p></div>';
});

// ============================================================
// VIEW: 404
// ============================================================
route('#/404', async function () {
  $app.innerHTML = '<div class="container section text-center"><h1>404</h1><h2>Halaman Tidak Ditemukan</h2><p class="muted">Tautan yang Anda tuju mungkin telah dipindahkan.</p><a href="#/" class="btn btn-primary">Kembali ke Beranda</a></div>';
});
route('#/privasi', async function () { $app.innerHTML = '<div class="container section"><h1>Kebijakan Privasi</h1><p class="muted">Lengkapi kebijakan privasi resmi sekolah di sini.</p></div>'; });
route('#/ketentuan', async function () { $app.innerHTML = '<div class="container section"><h1>Ketentuan Layanan</h1><p class="muted">Lengkapi ketentuan layanan resmi sekolah di sini.</p></div>'; });
