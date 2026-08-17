/* Varredura que forma o "be" — assinatura visual da Be Medical.
   Ruído entra, a varredura passa, a marca aparece. Repete.

   A marca é amostrada do arquivo do logo (assets/logo-be.svg), então o desenho
   e o espaçamento são exatamente os da marca. Se o arquivo não estiver lá,
   cai numa aproximação em fonte geométrica. */
(function () {
  var LOGO_SRC = 'assets/logo-be.svg';
  var BRILHO_MIN = 140; // logo é branco sobre preto — amostra pelo brilho

  var cv = document.getElementById('scan');
  if (!cv || !cv.getContext) return;

  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, step = 4;
  var pts = [], scanX = 0, hold = 0, raf = null;
  var logo = null; // HTMLImageElement pronto, ou null

  function size() {
    w = cv.clientWidth;
    h = cv.clientHeight;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = w < 640 ? 4 : 3;
  }

  /* Desenha a marca num canvas do tamanho do visível e devolve os pixels. */
  function mascara() {
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    var o = off.getContext('2d', { willReadFrequently: true });

    if (logo) {
      var caixa = recorte(logo);
      var alvoH = h * 0.74;
      var escala = alvoH / caixa.h;
      var alvoW = caixa.w * escala;
      if (alvoW > w * 0.62) { escala = (w * 0.62) / caixa.w; alvoW = w * 0.62; alvoH = caixa.h * escala; }
      o.drawImage(
        logo,
        caixa.x, caixa.y, caixa.w, caixa.h,
        (w - alvoW) / 2, (h - alvoH) / 2, alvoW, alvoH
      );
    } else {
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      if ('letterSpacing' in o) o.letterSpacing = '-0.05em';
      o.font = '400 ' + Math.min(h * 1.02, w * 0.38) + 'px Jost, Century Gothic, sans-serif';
      o.fillStyle = '#fff';
      o.fillRect(0, 0, w, h);
      o.fillStyle = '#000';
      o.fillText('be', w / 2, h / 2);
      // Sem logo, o desenho é preto sobre branco: inverte o critério.
      return { data: o.getImageData(0, 0, w, h).data, escuro: true };
    }
    return { data: o.getImageData(0, 0, w, h).data, escuro: false };
  }

  /* Caixa que envolve os pixels claros do logo — corta a moldura preta. */
  var caixaCache = null;
  function recorte(img) {
    if (caixaCache) return caixaCache;
    var lado = Math.min(img.naturalWidth, 400);
    var prop = img.naturalHeight / img.naturalWidth;
    var cw = lado, ch = Math.round(lado * prop);
    var t = document.createElement('canvas');
    t.width = cw; t.height = ch;
    var c = t.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0, cw, ch);
    var d = c.getImageData(0, 0, cw, ch).data;
    var x0 = cw, y0 = ch, x1 = 0, y1 = 0, achou = false;
    for (var y = 0; y < ch; y++) {
      for (var x = 0; x < cw; x++) {
        var i = (y * cw + x) * 4;
        if (d[i + 3] > 40 && (d[i] + d[i + 1] + d[i + 2]) / 3 > BRILHO_MIN) {
          achou = true;
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
    }
    var f = img.naturalWidth / cw;
    caixaCache = achou
      ? { x: x0 * f, y: y0 * f, w: (x1 - x0 + 1) * f, h: (y1 - y0 + 1) * f }
      : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    return caixaCache;
  }

  function build() {
    if (w < 1 || h < 1) { pts = []; return; }
    var m = mascara();
    var d = m.data;
    pts = [];
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        var brilho = (d[i] + d[i + 1] + d[i + 2]) / 3;
        var dentro = m.escuro ? brilho < 120 : (d[i + 3] > 40 && brilho > BRILHO_MIN);
        if (dentro) {
          var a = Math.random() * 6.283, r = 24 + Math.random() * 36;
          pts.push({
            hx: x, hy: y,
            x: x + Math.cos(a) * r,
            y: y + Math.sin(a) * r,
            on: 0,
            s: Math.random() * 6.283
          });
        }
      }
    }
    scanX = 0;
    hold = 0;
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    var i, p;

    ctx.fillStyle = '#CFCFD4';
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.on) continue;
      ctx.fillRect(
        p.x + Math.sin(t * 0.0016 + p.s) * 1.5,
        p.y + Math.cos(t * 0.0013 + p.s) * 1.5,
        1.7, 1.7
      );
    }

    ctx.fillStyle = '#111114';
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (!p.on) continue;
      ctx.fillRect(p.x, p.y, step * 0.72, step * 0.72);
    }

    if (scanX < w + 30) {
      ctx.fillStyle = 'rgba(17,17,20,0.045)';
      ctx.fillRect(scanX - 46, 0, 46, h);
      ctx.fillStyle = 'rgba(17,17,20,0.5)';
      ctx.fillRect(scanX, 0, 1, h);
    }
  }

  function frame(t) {
    var i, p;
    if (!pts.length) { raf = requestAnimationFrame(frame); return; }
    if (scanX < w + 30) scanX += w / 200;
    else if (++hold > 170) build();

    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.hx < scanX) p.on = 1;
      if (p.on) {
        p.x += (p.hx - p.x) * 0.13;
        p.y += (p.hy - p.y) * 0.13;
      }
    }
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  function still() {
    for (var i = 0; i < pts.length; i++) {
      pts[i].x = pts[i].hx;
      pts[i].y = pts[i].hy;
      pts[i].on = 1;
    }
    scanX = w + 40;
    draw(0);
  }

  function start() {
    size();
    // O canvas pode ter largura 0 se a aba ainda não foi pintada — tenta de novo.
    if (w < 1 || h < 1) { setTimeout(start, 120); return; }
    build();
    if (reduce) { still(); return; }
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  });

  // Pausa quando a aba sai de vista — não gasta bateria à toa.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    } else if (!reduce && !raf) {
      raf = requestAnimationFrame(frame);
    }
  });

  function comFonte() {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('400 120px Jost').then(start).catch(start);
    } else {
      start();
    }
  }

  var img = new Image();
  img.onload = function () { logo = img; start(); };
  img.onerror = comFonte;
  img.src = LOGO_SRC;
})();
