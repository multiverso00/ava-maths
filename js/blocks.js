(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AvaBlocks = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var COLS = ["h", "t", "o"];
  var NAME = { h: "Hunderter", t: "Zehner", o: "Einer" };
  var LOWER = { h: "t", t: "o" };
  var HIGHER = { o: "t", t: "h" };

  function fromNumber(n) {
    return { h: Math.floor(n / 100) % 10, t: Math.floor(n / 10) % 10, o: n % 10 };
  }

  function value(s) {
    return s.h * 100 + s.t * 10 + s.o;
  }

  function copy(s) {
    return { h: s.h, t: s.t, o: s.o };
  }

  function zero() {
    return { h: 0, t: 0, o: 0 };
  }

  function plural(n, col) {
    return n === 1 ? NAME[col] : NAME[col] + "n";
  }

  function createModel(a, b, op) {
    return {
      kind: "blocks",
      op: op,
      a: a,
      b: b,
      mat: fromNumber(a),
      tray: op === "add" ? fromNumber(b) : zero(),
      taken: zero(),
      target: op === "sub" ? fromNumber(b) : zero(),
      say: "",
      flash: null
    };
  }

  function clone(m) {
    if (m.kind !== "blocks") return Object.assign({}, m);
    return {
      kind: "blocks",
      op: m.op,
      a: m.a,
      b: m.b,
      mat: copy(m.mat),
      tray: copy(m.tray),
      taken: copy(m.taken),
      target: copy(m.target),
      say: "",
      flash: null
    };
  }

  function moveIn(m, col, dropCol) {
    var n = clone(m);
    if (m.op !== "add" || m.tray[col] <= 0) return { model: m, ok: false };
    if (dropCol && dropCol !== col) {
      n.say = NAME[col] + " gehören zu den " + plural(2, col) + ".";
      n.flash = { col: col, kind: "bounce" };
      return { model: n, ok: false };
    }
    n.tray[col] -= 1;
    n.mat[col] += 1;
    n.flash = { col: col, kind: "in" };
    return { model: n, ok: true };
  }

  function takeOut(m, col) {
    var n = clone(m);
    if (m.op !== "sub" || m.mat[col] <= 0) return { model: m, ok: false };
    if (m.taken[col] >= m.target[col]) {
      n.say = m.target[col] === 0
        ? "Hier musst du keine " + NAME[col] + " wegnehmen."
        : "Du hast schon genug " + NAME[col] + " weggenommen.";
      n.flash = { col: col, kind: "bounce" };
      return { model: n, ok: false };
    }
    n.mat[col] -= 1;
    n.taken[col] += 1;
    n.flash = { col: col, kind: "out" };
    return { model: n, ok: true };
  }

  function breakDown(m, col) {
    var lower = LOWER[col];
    if (!lower || m.mat[col] <= 0) return { model: m, ok: false };
    var n = clone(m);
    n.mat[col] -= 1;
    n.mat[lower] += 10;
    n.say = "1 " + NAME[col] + " ist jetzt 10 " + NAME[lower] + ".";
    n.flash = { col: lower, kind: "split", count: 10 };
    return { model: n, ok: true };
  }

  function bundleUp(m, col) {
    var higher = HIGHER[col];
    if (!higher || m.mat[col] < 10) return { model: m, ok: false };
    var n = clone(m);
    n.mat[col] -= 10;
    n.mat[higher] += 1;
    n.say = "10 " + NAME[col] + " sind jetzt 1 " + NAME[higher] + ".";
    n.flash = { col: higher, kind: "bundle", count: 1 };
    return { model: n, ok: true };
  }

  function bundleCol(m) {
    if (m.mat.o >= 10) return "o";
    if (m.mat.t >= 10) return "t";
    return null;
  }

  function needsBreak(m) {
    if (m.op !== "sub") return null;
    var order = ["o", "t"];
    for (var i = 0; i < order.length; i++) {
      var col = order[i];
      if (m.target[col] - m.taken[col] > m.mat[col]) return col;
    }
    return null;
  }

  function isDone(m) {
    if (m.kind === "frame") return m.mode === "fill" ? m.filled === m.total : false;
    if (m.kind === "hundred") return m.filled === 100;
    if (m.op === "add") return m.tray.h + m.tray.t + m.tray.o === 0 && !bundleCol(m);
    return COLS.every(function (c) { return m.taken[c] === m.target[c]; });
  }

  function guide(m) {
    if (m.kind === "frame") {
      if (m.mode === "fill") return m.filled < m.total ? "Füll die leeren Felder bis " + m.total + "." : "Zähl, wie viele dazugekommen sind.";
      return "Nimm Plättchen weg, bis noch " + m.goal + " übrig sind.";
    }
    if (m.kind === "hundred") {
      return m.filled < 100 ? "Füll zuerst bis zum nächsten Zehner, dann immer 10 auf einmal." : "Zähl, wie viele dazugekommen sind.";
    }
    if (m.op === "add") {
      var b = bundleCol(m);
      if (m.tray.o > 0) return "Leg die Einer zu den Einern.";
      if (b === "o") return "Hier sind 10 oder mehr Einer. Bündele 10 Einer zu 1 Zehner.";
      if (m.tray.t > 0) return "Leg die Zehner zu den Zehnern.";
      if (b === "t") return "Hier sind 10 oder mehr Zehner. Bündele 10 Zehner zu 1 Hunderter.";
      if (m.tray.h > 0) return "Leg die Hunderter zu den Hundertern.";
      return "Zähl jetzt die Blöcke.";
    }
    var need = needsBreak(m);
    if (need === "o") return "Du brauchst mehr Einer. Zieh eine Zehnerstange zu den Einern.";
    if (need === "t") return "Du brauchst mehr Zehner. Zieh eine Hunderterplatte zu den Zehnern.";
    for (var i = 2; i >= 0; i--) {
      var col = COLS[i];
      var rest = m.target[col] - m.taken[col];
      if (rest > 0) return "Nimm noch " + rest + " " + NAME[col] + " weg.";
    }
    return "Zähl jetzt, was übrig ist.";
  }

  function frameModel(start, total, mode, goal) {
    return { kind: "frame", start: start, total: total, filled: start, mode: mode, goal: goal == null ? null : goal, say: "", flash: null };
  }

  function tapFrame(m, index) {
    var n = Object.assign({}, m, { say: "", flash: null });
    if (m.mode === "fill") {
      if (index >= m.total) return { model: m, ok: false };
      if (index >= m.filled) n.filled = index + 1;
      else if (index >= m.start) n.filled = index;
      else return { model: m, ok: false };
    } else {
      if (index < m.filled) n.filled = index;
      else if (index < m.start) n.filled = index + 1;
      else return { model: m, ok: false };
    }
    return { model: n, ok: true };
  }

  function hundredModel(start) {
    return { kind: "hundred", start: start, filled: start, say: "", flash: null };
  }

  function tapHundred(m, index) {
    var n = Object.assign({}, m, { say: "", flash: null });
    var row = Math.floor(index / 10);
    if (index >= m.filled) n.filled = Math.max(m.start, (row + 1) * 10);
    else if (index >= m.start) n.filled = Math.max(m.start, row * 10);
    else return { model: m, ok: false };
    return { model: n, ok: true };
  }

  function demoSteps(item) {
    var steps = [];
    var m;
    if (item.kind === "bond" || item.kind === "missingAdd") {
      m = frameModel(item.known, item.target, "fill");
      steps.push({ model: m, say: item.known + " sind schon da." });
      for (var f = item.known; f < item.target; f++) {
        m = Object.assign({}, m, { filled: f + 1 });
        steps.push({ model: m, say: "Ich lege eins dazu." });
      }
      steps.push({ model: m, say: "Zähl, wie viele dazugekommen sind." });
      return steps;
    }
    if (item.kind === "missingSub") {
      m = frameModel(item.start, item.start, "empty", item.result);
      steps.push({ model: m, say: "Das sind " + item.start + "." });
      while (m.filled > item.result) {
        m = Object.assign({}, m, { filled: m.filled - 1 });
        steps.push({ model: m, say: "Ich nehme eins weg." });
      }
      steps.push({ model: m, say: "Zähl, wie viele weg sind." });
      return steps;
    }
    if (item.kind === "complement") {
      m = hundredModel(item.known);
      steps.push({ model: m, say: item.known + " sind schon da." });
      var next = Math.ceil(item.known / 10) * 10;
      if (next > item.known) {
        m = Object.assign({}, m, { filled: next });
        steps.push({ model: m, say: "Zuerst bis zum nächsten Zehner: bis " + next + "." });
      }
      while (m.filled < 100) {
        m = Object.assign({}, m, { filled: m.filled + 10 });
        steps.push({ model: m, say: "Jetzt 10 auf einmal." });
      }
      steps.push({ model: m, say: "Zähl, wie viele dazugekommen sind." });
      return steps;
    }
    m = createModel(item.a, item.b, item.op);
    steps.push({ model: m, say: "Das ist " + item.a + "." });
    var r;
    if (item.op === "add") {
      ["o", "t", "h"].forEach(function (col) {
        if (m.tray[col] > 0) {
          var count = m.tray[col];
          while (m.tray[col] > 0) m = moveIn(m, col).model;
          m.flash = { col: col, kind: "in" };
          steps.push({ model: m, say: "Ich lege " + count + " " + NAME[col] + " dazu." });
        }
        if (m.mat[col] >= 10 && HIGHER[col]) {
          r = bundleUp(m, col);
          m = r.model;
          steps.push({ model: m, say: m.say });
        }
      });
    } else {
      ["o", "t", "h"].forEach(function (col) {
        var need = m.target[col];
        if (need > m.mat[col]) {
          var have = m.mat[col];
          var higher = HIGHER[col];
          if (higher && m.mat[higher] === 0 && HIGHER[higher]) {
            m = breakDown(m, HIGHER[higher]).model;
            steps.push({ model: m, say: m.say });
          }
          r = breakDown(m, higher);
          m = r.model;
          steps.push({ model: m, say: "Von " + have + " " + plural(have, col) + " kann ich nicht " + need + " wegnehmen. Ich entbündele 1 " + NAME[higher] + "." });
        }
        if (need > 0) {
          while (m.taken[col] < need) m = takeOut(m, col).model;
          m.flash = { col: col, kind: "out" };
          steps.push({ model: m, say: "Ich nehme " + need + " " + NAME[col] + " weg." });
        }
      });
    }
    steps.push({ model: m, say: "Zähl jetzt die Blöcke." });
    return steps;
  }

  function modelFor(item) {
    if ((item.kind === "bond" || item.kind === "missingAdd") && item.target <= 20) {
      return frameModel(item.known, item.target, "fill");
    }
    if (item.kind === "missingSub" && item.start <= 20) {
      return frameModel(item.start, item.start, "empty", item.result);
    }
    if (item.kind === "complement" && item.target === 100) return hundredModel(item.known);
    var blocky = item.kind === "compute" || (item.kind === "decide" && item.choose === false);
    if (!blocky || item.paper) return null;
    if (item.a >= 1000 || item.b >= 1000) return null;
    if (item.op === "sub" && item.b > item.a) return null;
    if (item.op === "add" && item.a + item.b >= 1000) return null;
    return createModel(item.a, item.b, item.op);
  }

  // ---------- DOM ----------

  function pieceHTML(col, src, extra) {
    var cls = col === "h" ? "flat" : col === "t" ? "rod" : "cube";
    return '<span class="piece ' + cls + (extra || "") + '" data-piece="' + col + '" data-src="' + src + '" role="button" tabindex="0" aria-label="' + NAME[col] + '"></span>';
  }

  function pileHTML(count, col, src, flash, live) {
    var html = "";
    for (var i = 0; i < count; i++) {
      var extra = "";
      if (flash && flash.col === col && live) {
        var fresh = flash.count || 1;
        if (i >= count - fresh && (flash.kind === "split" || flash.kind === "bundle" || flash.kind === "in")) extra = " pop";
      }
      if (flash && flash.col === col && flash.kind === "bounce" && i === count - 1) extra = " shake";
      html += pieceHTML(col, src, extra);
    }
    return html;
  }

  function blocksHTML(m, opts) {
    var interactive = opts.interactive;
    var html = '<div class="mat mat-' + m.op + (interactive ? " live" : "") + '">';
    html += '<div class="mat-cols">';
    COLS.forEach(function (col) {
      html += '<div class="mat-col ' + col + '" data-drop="' + col + '">';
      html += '<div class="mat-head">' + col.replace("t", "T").replace("h", "H").replace("o", "O") + "</div>";
      html += '<div class="mat-pile">' + pileHTML(m.mat[col], col, "mat", m.flash, true) + "</div>";
      if (opts.counts) html += '<div class="mat-count">' + m.mat[col] + "</div>";
      if (interactive) {
        if (m.op === "sub" && LOWER[col] && m.mat[col] > 0) {
          html += '<button type="button" class="mat-btn ' + col + '" data-mat-act="break" data-col="' + col + '" lang="de">entbündeln</button>';
        }
        if (m.op === "add" && HIGHER[col] && m.mat[col] >= 10) {
          html += '<button type="button" class="mat-btn ' + col + '" data-mat-act="bundle" data-col="' + col + '" lang="de">bündeln</button>';
        }
      }
      html += "</div>";
    });
    html += "</div>";
    if (m.op === "add") {
      var left = m.tray.h + m.tray.t + m.tray.o;
      html += '<div class="tray"><span class="tray-label">Add ' + m.b + "</span>";
      html += '<div class="tray-pieces">';
      COLS.forEach(function (col) { html += pileHTML(m.tray[col], col, "tray", null, false); });
      if (!left) html += '<span class="tray-empty">All in</span>';
      html += "</div></div>";
    } else {
      html += '<div class="bin" data-drop="bin"><span class="tray-label">Take away ' + m.b + "</span>";
      html += '<div class="tray-pieces">';
      COLS.forEach(function (col) { html += pileHTML(m.taken[col], col, "bin", null, false); });
      if (!(m.taken.h + m.taken.t + m.taken.o)) html += '<span class="tray-empty">Drag blocks here</span>';
      html += "</div></div>";
    }
    return html + "</div>";
  }

  function frameHTML(m, opts) {
    var cells = Math.ceil(Math.max(m.total, m.start) / 10) * 10;
    var html = '<div class="mat frame-mat' + (opts.interactive ? " live" : "") + '"><div class="frames">';
    for (var i = 0; i < cells; i++) {
      if (i % 10 === 0) html += '<div class="tenframe">';
      var on = i < m.filled;
      var added = on && i >= m.start;
      var removed = m.mode === "empty" && !on && i < m.start;
      var off = m.mode === "fill" && i >= m.total;
      html += '<span class="dot' + (on ? " on" : "") + (added ? " added" : "") + (removed ? " gone" : "") + (off ? " off" : "") +
        '" data-cell="' + i + '"></span>';
      if (i % 10 === 9) html += "</div>";
    }
    html += "</div>";
    var shown = m.mode === "fill"
      ? m.start + " + " + (m.filled - m.start) + " = " + m.filled
      : m.start + " − " + (m.start - m.filled) + " = " + m.filled;
    if (opts.counts) html += '<p class="mat-sum">' + shown + "</p>";
    return html + "</div>";
  }

  function hundredHTML(m, opts) {
    var html = '<div class="mat hundred-mat' + (opts.interactive ? " live" : "") + '"><div class="hundred">';
    for (var i = 0; i < 100; i++) {
      var on = i < m.filled;
      html += '<span class="sq' + (on ? " on" : "") + (on && i >= m.start ? " added" : "") + '" data-cell="' + i + '"></span>';
    }
    html += "</div>";
    if (opts.counts) html += '<p class="mat-sum">' + m.start + " + " + (m.filled - m.start) + " = " + m.filled + "</p>";
    return html + "</div>";
  }

  function render(el) {
    var st = el.__ava;
    var m = st.model;
    var opts = st.opts;
    var body = m.kind === "frame" ? frameHTML(m, opts) : m.kind === "hundred" ? hundredHTML(m, opts) : blocksHTML(m, opts);
    var line = opts.caption || m.say || (opts.hints ? guide(m) : "");
    if (line) body += '<p class="mat-say" lang="de">' + line + "</p>";
    el.innerHTML = body;
  }

  function apply(el, result) {
    var st = el.__ava;
    st.model = result.model;
    render(el);
    if (st.opts.onChange) st.opts.onChange(st.model, result.ok);
  }

  function dropAction(m, src, col, target) {
    if (src === "tray") {
      if (COLS.indexOf(target) !== -1) return moveIn(m, col, target);
      return { model: m, ok: false };
    }
    if (src === "mat") {
      if (target === "bin") return takeOut(m, col);
      if (target === LOWER[col] && m.op === "sub") return breakDown(m, col);
    }
    return { model: m, ok: false };
  }

  function tapAction(m, src, col) {
    if (src === "tray") return moveIn(m, col);
    if (src === "mat" && m.op === "sub") return takeOut(m, col);
    return { model: m, ok: false };
  }

  var drag = null;

  function targetAt(el, x, y) {
    var under = document.elementFromPoint(x, y);
    var zone = under && under.closest ? under.closest("[data-drop]") : null;
    return zone && el.contains(zone) ? zone : null;
  }

  function onMove(event) {
    if (!drag) return;
    var dx = event.clientX - drag.x;
    var dy = event.clientY - drag.y;
    if (!drag.ghost && Math.abs(dx) + Math.abs(dy) > 6) {
      var rect = drag.piece.getBoundingClientRect();
      var ghost = drag.piece.cloneNode(true);
      ghost.classList.add("ghost");
      ghost.style.width = rect.width + "px";
      ghost.style.height = rect.height + "px";
      drag.offX = drag.x - rect.left;
      drag.offY = drag.y - rect.top;
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      drag.piece.classList.add("lifted");
    }
    if (drag.ghost) {
      drag.ghost.style.left = (event.clientX - drag.offX) + "px";
      drag.ghost.style.top = (event.clientY - drag.offY) + "px";
      var zone = targetAt(drag.el, event.clientX, event.clientY);
      if (drag.over && drag.over !== zone) drag.over.classList.remove("over");
      if (zone) zone.classList.add("over");
      drag.over = zone;
    }
  }

  function onUp(event) {
    if (!drag) return;
    var d = drag;
    drag = null;
    var st = d.el.__ava;
    if (d.over) d.over.classList.remove("over");
    if (d.ghost) {
      d.ghost.remove();
      var zone = targetAt(d.el, event.clientX, event.clientY);
      var result = zone ? dropAction(st.model, d.src, d.col, zone.getAttribute("data-drop")) : { model: st.model, ok: false };
      if (!result.ok && result.model === st.model) render(d.el);
      else apply(d.el, result);
    } else {
      apply(d.el, tapAction(st.model, d.src, d.col));
    }
  }

  function onCancel() {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    var el = drag.el;
    drag = null;
    render(el);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
  }

  function bind(el) {
    if (el.__bound) return;
    el.__bound = true;

    el.addEventListener("click", function (event) {
      var st = el.__ava;
      if (!st.opts.interactive) return;
      var btn = event.target.closest("[data-mat-act]");
      if (btn) {
        var col = btn.getAttribute("data-col");
        apply(el, btn.getAttribute("data-mat-act") === "break" ? breakDown(st.model, col) : bundleUp(st.model, col));
        return;
      }
      var cell = event.target.closest("[data-cell]");
      if (cell) {
        var index = Number(cell.getAttribute("data-cell"));
        apply(el, st.model.kind === "frame" ? tapFrame(st.model, index) : tapHundred(st.model, index));
      }
    });

    el.addEventListener("pointerdown", function (event) {
      var st = el.__ava;
      if (!st.opts.interactive || st.model.kind !== "blocks") return;
      var piece = event.target.closest("[data-piece]");
      if (!piece || piece.getAttribute("data-src") === "bin") return;
      event.preventDefault();
      drag = {
        el: el,
        piece: piece,
        col: piece.getAttribute("data-piece"),
        src: piece.getAttribute("data-src"),
        x: event.clientX,
        y: event.clientY,
        ghost: null,
        over: null
      };
    });
  }

  function mount(el, model, opts) {
    el.__ava = { model: model, opts: opts || {} };
    bind(el);
    render(el);
  }

  return {
    fromNumber: fromNumber,
    value: value,
    createModel: createModel,
    moveIn: moveIn,
    takeOut: takeOut,
    breakDown: breakDown,
    bundleUp: bundleUp,
    bundleCol: bundleCol,
    needsBreak: needsBreak,
    isDone: isDone,
    guide: guide,
    frameModel: frameModel,
    tapFrame: tapFrame,
    hundredModel: hundredModel,
    tapHundred: tapHundred,
    demoSteps: demoSteps,
    modelFor: modelFor,
    mount: mount
  };
});
