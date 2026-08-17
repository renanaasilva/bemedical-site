/* Marca da Be Medical desenhada em pontos, amostrada do próprio arquivo do logo
   (assets/logo-be.svg) — desenho e espaçamento são exatamente os da marca.
   Sem o arquivo, cai numa aproximação em fonte geométrica.

   Dois usos na página:
   - #scan   → abertura: ruído entra, a varredura passa, a marca aparece, repete
   - #marca  → fechamento: a mesma marca, já formada e parada */
(function () {
  var LOGO_SRC = 'assets/logo-be.svg';
  var BRILHO_MIN = 140; // logo é branco sobre preto — amostra pelo brilho
  var logo = null;
  var caixaCache = null;

  /* ---------- amostragem ---------- */

  /* Caixa que envolve os pixels claros do logo — corta a moldura preta. */
  function recorte(img) {
    if (caixaCache) return caixaCache;
    var lado = Math.min(img.naturalWidth, 400);
    var cw = lado, ch = Math.round(lado * (img.naturalHeight / img.naturalWidth));
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

  /* Devolve os pontos que formam a marca dentro de uma área w×h. */
  function pontos(w, h, step, ocupacaoAlt, ocupacaoLarg) {
    if (w < 1 || h < 1) return [];
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var o = off.getContext('2d', { willReadFrequently: true });
    var escuro = false;

    if (logo) {
      var caixa = recorte(logo);
      var alvoH = h * ocupacaoAlt;
      var escala = alvoH / caixa.h;
      var alvoW = caixa.w * escala;
      if (alvoW > w * ocupacaoLarg) {
        escala = (w * ocupacaoLarg) / caixa.w;
        alvoW = w * ocupacaoLarg;
        alvoH = caixa.h * escala;
      }
      o.drawImage(logo, caixa.x, caixa.y, caixa.w, caixa.h,
        (w - alvoW) / 2, (h - alvoH) / 2, alvoW, alvoH);
    } else {
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      if ('letterSpacing' in o) o.letterSpacing = '-0.05em';
      o.font = '400 ' + Math.min(h * ocupacaoAlt, w * 0.38) + 'px Jost, Century Gothic, sans-serif';
      o.fillStyle = '#fff';
      o.fillRect(0, 0, w, h);
      o.fillStyle = '#000';
      o.fillText('be', w / 2, h / 2);
      escuro = true;
    }

    var d = o.getImageData(0, 0, w, h).data;
    var pts = [];
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        var brilho = (d[i] + d[i + 1] + d[i + 2]) / 3;
        var dentro = escuro ? brilho < 120 : (d[i + 3] > 40 && brilho > BRILHO_MIN);
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
    return pts;
  }

  function prepara(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------- abertura: varredura animada ---------- */

  function abertura(cv) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ctx, w, h, step, pts = [], scanX = 0, hold = 0, raf = null;

    function monta() {
      var p = prepara(cv);
      ctx = p.ctx; w = p.w; h = p.h;
      step = w < 640 ? 4 : 3;
      pts = pontos(w, h, step, 0.74, 0.62);
      scanX = 0; hold = 0;
    }

    function desenha(t) {
      ctx.clearRect(0, 0, w, h);
      var i, p;
      ctx.fillStyle = '#CFCFD4';
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        if (p.on) continue;
        ctx.fillRect(p.x + Math.sin(t * 0.0016 + p.s) * 1.5,
          p.y + Math.cos(t * 0.0013 + p.s) * 1.5, 1.7, 1.7);
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

    function quadro(t) {
      if (!pts.length) { raf = requestAnimationFrame(quadro); return; }
      if (scanX < w + 30) scanX += w / 200;
      else if (++hold > 170) monta();
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (p.hx < scanX) p.on = 1;
        if (p.on) {
          p.x += (p.hx - p.x) * 0.13;
          p.y += (p.hy - p.y) * 0.13;
        }
      }
      desenha(t);
      raf = requestAnimationFrame(quadro);
    }

    function parada() {
      for (var i = 0; i < pts.length; i++) {
        pts[i].x = pts[i].hx; pts[i].y = pts[i].hy; pts[i].on = 1;
      }
      scanX = w + 40;
      desenha(0);
    }

    function inicia() {
      var p = prepara(cv);
      if (p.w < 1 || p.h < 1) { setTimeout(inicia, 120); return; }
      monta();
      if (reduce) { parada(); return; }
      // Aba em segundo plano não roda animação. Pinta a marca formada para a
      // área nunca ficar vazia; a varredura começa quando a aba receber foco.
      if (document.hidden) { parada(); return; }
      desenha(0);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(quadro);
    }

    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(inicia, 200);
    });

    // Pausa quando a aba sai de vista — não gasta bateria à toa.
    // Ao voltar, recomeça do zero: quem chega vê a varredura inteira.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      } else if (!reduce && !raf) {
        monta();
        desenha(0);
        raf = requestAnimationFrame(quadro);
      }
    });

    inicia();
  }

  /* ---------- fechamento: marca parada ---------- */

  function fechamento(cv) {
    function inicia() {
      var p = prepara(cv);
      if (p.w < 1 || p.h < 1) { setTimeout(inicia, 120); return; }
      var step = p.w < 640 ? 4 : 3;
      var pts = pontos(p.w, p.h, step, 0.66, 0.78);
      p.ctx.clearRect(0, 0, p.w, p.h);
      p.ctx.fillStyle = '#111114';
      for (var i = 0; i < pts.length; i++) {
        p.ctx.fillRect(pts[i].hx, pts[i].hy, step * 0.72, step * 0.72);
      }
    }
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(inicia, 200);
    });
    inicia();
  }

  /* ---------- partida ---------- */

  function liga() {
    var a = document.getElementById('scan');
    var f = document.getElementById('marca');
    if (a && a.getContext) abertura(a);
    if (f && f.getContext) fechamento(f);
  }

  var img = new Image();
  img.onload = function () { logo = img; liga(); };
  img.onerror = function () {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('400 120px Jost').then(liga).catch(liga);
    } else { liga(); }
  };
  img.src = LOGO_SRC;
})();
