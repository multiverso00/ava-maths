(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AvaBuddy = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var INK = "#2b211d";

  function face(o) {
    return '<g class="b-eyes">' +
      '<ellipse cx="' + o.lx + '" cy="' + o.ey + '" rx="' + o.er + '" ry="' + (o.er * 1.15) + '" fill="' + INK + '"/>' +
      '<ellipse cx="' + o.rx + '" cy="' + o.ey + '" rx="' + o.er + '" ry="' + (o.er * 1.15) + '" fill="' + INK + '"/>' +
      '<circle cx="' + (o.lx + o.er * 0.35) + '" cy="' + (o.ey - o.er * 0.4) + '" r="' + (o.er * 0.32) + '" fill="#fff"/>' +
      '<circle cx="' + (o.rx + o.er * 0.35) + '" cy="' + (o.ey - o.er * 0.4) + '" r="' + (o.er * 0.32) + '" fill="#fff"/>' +
      "</g>" +
      '<g class="b-eyes-happy" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round">' +
      '<path d="M' + (o.lx - 5) + " " + (o.ey + 1) + " Q" + o.lx + " " + (o.ey - 6) + " " + (o.lx + 5) + " " + (o.ey + 1) + '"/>' +
      '<path d="M' + (o.rx - 5) + " " + (o.ey + 1) + " Q" + o.rx + " " + (o.ey - 6) + " " + (o.rx + 5) + " " + (o.ey + 1) + '"/>' +
      "</g>";
  }

  function mouth(cx, y) {
    return '<path class="b-smile" d="M' + (cx - 7) + " " + y + " Q" + cx + " " + (y + 7) + " " + (cx + 7) + " " + y +
      '" stroke="' + INK + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse class="b-o" cx="' + cx + '" cy="' + (y + 2) + '" rx="3" ry="3.6" fill="' + INK + '"/>';
  }

  function blush(lx, rx, y) {
    return '<circle cx="' + lx + '" cy="' + y + '" r="5" fill="#ff8c8c" opacity=".45"/>' +
      '<circle cx="' + rx + '" cy="' + y + '" r="5" fill="#ff8c8c" opacity=".45"/>';
  }

  function fox() {
    return '<ellipse cx="60" cy="114" rx="30" ry="5" fill="rgba(0,0,0,.08)"/>' +
      '<path class="b-tail" d="M82 106 C104 104 114 86 106 70 C102 86 94 94 80 98 Z" fill="#f08a3c"/>' +
      '<path d="M106 70 C110 78 109 86 104 92 C102 84 103 77 106 70 Z" fill="#fff6ec"/>' +
      '<ellipse cx="60" cy="102" rx="26" ry="13" fill="#f08a3c"/>' +
      '<ellipse cx="60" cy="104" rx="13" ry="9" fill="#fff6ec"/>' +
      '<g class="b-head">' +
      '<path d="M24 52 L32 12 L54 36 Z" fill="#f08a3c"/><path d="M31 42 L34 22 L46 35 Z" fill="#5a3a2c"/>' +
      '<path d="M96 52 L88 12 L66 36 Z" fill="#f08a3c"/><path d="M89 42 L86 22 L74 35 Z" fill="#5a3a2c"/>' +
      '<path d="M60 28 C88 28 100 46 100 62 C100 82 82 92 60 92 C38 92 20 82 20 62 C20 46 32 28 60 28 Z" fill="#f39a4a"/>' +
      '<path d="M28 64 C40 63 50 70 60 70 C70 70 80 63 92 64 C88 84 75 92 60 92 C45 92 32 84 28 64 Z" fill="#fff6ec"/>' +
      face({ lx: 45, rx: 75, ey: 57, er: 5 }) +
      '<ellipse cx="60" cy="72" rx="5.5" ry="4" fill="' + INK + '"/>' +
      mouth(60, 79) + blush(36, 84, 70) +
      "</g>";
  }

  function owl() {
    return '<ellipse cx="60" cy="114" rx="30" ry="5" fill="rgba(0,0,0,.08)"/>' +
      '<ellipse class="b-wing" cx="25" cy="80" rx="9" ry="20" fill="#6650c0"/>' +
      '<ellipse class="b-wing r" cx="95" cy="80" rx="9" ry="20" fill="#6650c0"/>' +
      '<g class="b-head">' +
      '<path d="M27 38 L30 10 L48 28 Z" fill="#7b61d1"/><path d="M93 38 L90 10 L72 28 Z" fill="#7b61d1"/>' +
      '<ellipse cx="60" cy="66" rx="37" ry="44" fill="#7b61d1"/>' +
      '<ellipse cx="60" cy="88" rx="22" ry="19" fill="#ece6fc"/>' +
      '<path d="M50 84 q5 4 10 0 q5 4 10 0 M46 93 q5 4 10 0 q5 4 10 0 q5 4 10 0" stroke="#b9a8ee" stroke-width="2" fill="none"/>' +
      '<circle cx="45" cy="52" r="14" fill="#fff"/><circle cx="75" cy="52" r="14" fill="#fff"/>' +
      face({ lx: 45, rx: 75, ey: 53, er: 6.5 }) +
      '<path d="M54 64 L66 64 L60 74 Z" fill="#ffb43c"/>' +
      '<ellipse class="b-o" cx="60" cy="79" rx="2.6" ry="3" fill="' + INK + '"/>' +
      blush(32, 88, 68) +
      "</g>" +
      '<ellipse cx="50" cy="110" rx="6" ry="3" fill="#ffb43c"/><ellipse cx="70" cy="110" rx="6" ry="3" fill="#ffb43c"/>';
  }

  function spikes() {
    var pts = [];
    var n = 22;
    for (var i = 0; i <= n; i++) {
      var a = Math.PI * (1.05 + (i / n) * 0.9) ;
      var r = i % 2 === 0 ? 40 : 52;
      pts.push((60 + Math.cos(a) * r * 1.05).toFixed(1) + "," + (72 + Math.sin(a) * r).toFixed(1));
    }
    var sides = [];
    for (var j = 0; j <= 8; j++) {
      var b = Math.PI * (0.08 + (j / 8) * 0.18);
      var rr = j % 2 === 0 ? 40 : 50;
      sides.push((60 + Math.cos(b) * rr * 1.05).toFixed(1) + "," + (72 + Math.sin(b) * rr).toFixed(1));
    }
    var left = sides.map(function (p) {
      var xy = p.split(",");
      return (120 - Number(xy[0])).toFixed(1) + "," + xy[1];
    }).reverse();
    return '<polygon points="' + left.concat(pts).concat(sides.slice().reverse()).join(" ") + '" fill="#8a5a3c"/>';
  }

  function hedgehog() {
    return '<ellipse cx="60" cy="114" rx="30" ry="5" fill="rgba(0,0,0,.08)"/>' +
      '<g class="b-head">' + spikes() +
      '<ellipse cx="60" cy="74" rx="31" ry="30" fill="#f3d3a4"/>' +
      '<circle cx="36" cy="50" r="7" fill="#e7bf8c"/><circle cx="84" cy="50" r="7" fill="#e7bf8c"/>' +
      face({ lx: 49, rx: 71, ey: 68, er: 4.6 }) +
      '<ellipse cx="60" cy="80" rx="5.5" ry="4.2" fill="' + INK + '"/>' +
      mouth(60, 87) + blush(40, 80, 82) +
      "</g>" +
      '<ellipse cx="46" cy="106" rx="8" ry="5" fill="#e7bf8c"/><ellipse cx="74" cy="106" rx="8" ry="5" fill="#e7bf8c"/>';
  }

  var LIST = [
    { id: "fox", name: "Fips", kind: "fox", draw: fox },
    { id: "owl", name: "Ola", kind: "owl", draw: owl },
    { id: "hedgehog", name: "Igel", kind: "hedgehog", draw: hedgehog }
  ];

  function find(id) {
    for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
    return LIST[0];
  }

  function svg(id) {
    var b = find(id);
    return '<svg class="buddy-svg ' + b.kind + '" viewBox="0 0 120 120" aria-hidden="true">' + b.draw() + "</svg>";
  }

  var STICKERS = {
    bonds: { name: "Rainbow", art: '<path d="M8 46 A24 24 0 0 1 56 46" stroke="#ff6b6b" stroke-width="6" fill="none"/><path d="M14 46 A18 18 0 0 1 50 46" stroke="#ffb43c" stroke-width="6" fill="none"/><path d="M20 46 A12 12 0 0 1 44 46" stroke="#4cc38a" stroke-width="6" fill="none"/><path d="M26 46 A6 6 0 0 1 38 46" stroke="#4d8df6" stroke-width="6" fill="none"/><ellipse cx="12" cy="48" rx="9" ry="5" fill="#fff"/><ellipse cx="52" cy="48" rx="9" ry="5" fill="#fff"/>' },
    digits: { name: "Rocket", art: '<path d="M32 6 C44 14 46 30 40 44 L24 44 C18 30 20 14 32 6 Z" fill="#eef3ff" stroke="#4d8df6" stroke-width="3"/><circle cx="32" cy="24" r="5" fill="#4d8df6"/><path d="M24 36 L14 46 L24 44 Z M40 36 L50 46 L40 44 Z" fill="#ff6b6b"/><path d="M27 46 L32 58 L37 46 Z" fill="#ffb43c"/>' },
    crossing: { name: "Kite", art: '<path d="M32 4 L52 26 L32 48 L12 26 Z" fill="#ffb43c" stroke="#e0871a" stroke-width="2"/><path d="M32 4 L32 48 M12 26 L52 26" stroke="#e0871a" stroke-width="2"/><path d="M32 48 C28 54 36 56 32 62" stroke="#7b61d1" stroke-width="2" fill="none"/><path d="M28 54 L24 52 L26 57 Z M34 59 L38 57 L37 62 Z" fill="#ff6b6b"/>' },
    columns: { name: "Planet", art: '<circle cx="32" cy="32" r="16" fill="#7b61d1"/><circle cx="26" cy="27" r="4" fill="#9d88e6"/><circle cx="37" cy="38" r="3" fill="#9d88e6"/><ellipse cx="32" cy="34" rx="28" ry="8" fill="none" stroke="#ffb43c" stroke-width="4" transform="rotate(-15 32 34)"/>' },
    exchange: { name: "Crown", art: '<path d="M10 46 L8 20 L22 32 L32 12 L42 32 L56 20 L54 46 Z" fill="#ffcf3f" stroke="#e0a11a" stroke-width="2.5" stroke-linejoin="round"/><rect x="10" y="46" width="44" height="7" rx="2" fill="#e0a11a"/><circle cx="32" cy="36" r="4" fill="#ff6b6b"/><circle cx="20" cy="40" r="3" fill="#4d8df6"/><circle cx="44" cy="40" r="3" fill="#4cc38a"/>' },
    decide: { name: "Trophy", art: '<path d="M18 10 H46 V24 C46 34 40 40 32 40 C24 40 18 34 18 24 Z" fill="#ffcf3f" stroke="#e0a11a" stroke-width="2.5"/><path d="M18 14 H10 C10 24 14 28 19 28 M46 14 H54 C54 24 50 28 45 28" stroke="#e0a11a" stroke-width="3" fill="none"/><rect x="28" y="40" width="8" height="8" fill="#e0a11a"/><rect x="20" y="48" width="24" height="8" rx="2" fill="#7b4a2a"/><path d="M32 16 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" fill="#fff"/>' }
  };

  function sticker(id) {
    var s = STICKERS[id];
    if (!s) return "";
    return '<svg class="sticker-svg" viewBox="0 0 64 64" aria-hidden="true">' + s.art + "</svg>";
  }

  return { LIST: LIST, find: find, svg: svg, STICKERS: STICKERS, sticker: sticker };
});
