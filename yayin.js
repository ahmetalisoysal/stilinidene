document.addEventListener('DOMContentLoaded', () => {
  try {
    // -----------------------------
    // Mobil menü toggle
    (function(){
      const btn = document.querySelector('.menu-toggle');
      const mobile = document.getElementById('mobileMenu');
      if(btn && mobile){
        btn.addEventListener('click', () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          mobile.classList.toggle('open', !expanded);
          if(!expanded){
            const firstLink = mobile.querySelector('a');
            if(firstLink) firstLink.focus();
          } else btn.focus();
        });

        document.addEventListener('keydown', e => {
          if(e.key === 'Escape' && mobile.classList.contains('open')){
            mobile.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            btn.focus();
          }
        });
      }
    })();

    // -----------------------------
    // Thumbnail seçici
    (async function(){
      const frame = document.getElementById('largeFrame') || document.querySelector('.large-frame');
      const buttons = Array.from(document.querySelectorAll('.button-row .btn'));
      const styleBtn = document.querySelector('.btn-try'); // "Stili Dene"
      const previewFinal = document.getElementById('preview-final');
      const API_URL = "https://stilserveri.loophole.site/swap";
      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

      if(!frame) return;
      const thumbEls = Array.from(frame.querySelectorAll('.thumbnail'));
      const thumbs = thumbEls.map(el => {
        let bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
        let url = '';
        if(bg && bg !== 'none') url = bg.replace(/^url\((['"]?)(.*)\1\)$/, '$2');
        let cats = [];
        if(el.dataset.cats) cats = el.dataset.cats.split(',').map(s=>s.trim()).filter(Boolean);
        else cats = Array.from(el.classList).filter(c=>c.startsWith('cat-')).map(c=>c.replace('cat-',''));
        return { el, url, cats, exists:!!url, selected:false };
      });

      // Thumbnail DOM hazırla
      thumbs.forEach(t => {
        if(t.exists){
          t.el.style.backgroundImage = 'none';
          let inner = t.el.querySelector('.thumb-img');
          if(!inner){
            inner = document.createElement('div');
            inner.className = 'thumb-img';
            inner.style.cssText = 'width:100%;height:100%;background-size:cover;background-position:center;border-radius:6px;';
            t.el.appendChild(inner);
          }
          inner.style.backgroundImage = `url("${t.url}")`;
        } else t.el.style.display = 'none';
      });

      // Thumbnail click
      thumbs.forEach(t => {
        t.el.addEventListener('click', () => {
          if(t.el.style.display === 'none') return;
          thumbs.forEach(other => { other.selected = false; other.el.classList.remove('selected'); });
          t.selected = true;
          t.el.classList.add('selected');
        });
      });

      // Filtre butonları
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.dataset.category;
          buttons.forEach(b => b.classList.toggle('active', b === btn));
          thumbs.forEach(t => {
            t.el.style.display = t.exists && t.cats.includes(String(cat)) ? 'flex' : 'none';
            if(t.el.style.display !== 'flex'){ t.selected = false; t.el.classList.remove('selected'); }
          });
        });
      });

      // Başlangıç
      let initBtn = buttons.find(b => b.classList.contains('active')) || buttons[0];
      if(initBtn) initBtn.click();

      // -----------------------------
      // Kullanıcı fotoğraf yükleme (Galeri ve Kamera)
      const galleryBtn = document.getElementById('uploadGallery');
      const cameraBtn = document.getElementById('uploadCamera');
      const fileGallery = document.getElementById('fileGallery');
      const fileCamera = document.getElementById('fileCamera');
      let uploadedFile = null;

      // HTML'deki mevcut span kullan
      const infoText = document.getElementById('upload-status');

      galleryBtn.addEventListener('click', () => fileGallery.click());
      cameraBtn.addEventListener('click', () => fileCamera.click());

      [fileGallery, fileCamera].forEach(input => {
        input.addEventListener('change', () => {
          const file = input.files[0];
          if(file){
            if(!file.type.startsWith('image/')){
              alert("Lütfen sadece resim dosyası seçin!");
              input.value = '';
              uploadedFile = null;
              infoText.textContent = '';
              return;
            }
            if(file.size > MAX_SIZE){
              alert("Dosya boyutu 10 MB'dan büyük olamaz!");
              input.value = '';
              uploadedFile = null;
              infoText.textContent = '';
              return;
            }
            uploadedFile = file;
            infoText.textContent = 'Resim yüklendi ✅';
          } else {
            uploadedFile = null;
            infoText.textContent = '';
          }
        });
      });

      // -----------------------------
      // "Stili Dene" işlemi
      if(styleBtn){
        styleBtn.addEventListener('click', async () => {
          const selectedThumb = thumbs.find(t => t.selected);
          if(!uploadedFile){
            alert("Lütfen kendi fotoğrafınızı yükleyin!");
            return;
          }
          if(!selectedThumb){
            alert("Lütfen bir saç stili seçin!");
            return;
          }

          try {
            const thumbResponse = await fetch(selectedThumb.url);
            const thumbBlob = await thumbResponse.blob();

            const formData = new FormData();
            formData.append('source', uploadedFile);
            formData.append('target', thumbBlob, 'style.jpg');
            formData.append('face_index', 0);

            const response = await fetch(API_URL, { method:'POST', body: formData });
            if(!response.ok){
              const err = await response.json();
              alert("Hata: " + (err.detail || err.error || response.status));
              return;
            }
            const data = await response.json();
            previewFinal.src = `data:image/jpeg;base64,${data.swapped_image}`;
          } catch(err){
            console.error('İşlem hatası:', err);
            alert('Bir hata oluştu. Konsolu kontrol edin.');
          }
        });
      }

    })();
  } catch(err){
    console.error('Yayin.js hata:', err);
  }
});
