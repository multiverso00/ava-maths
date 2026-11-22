(function (root) {
  "use strict";

  var COLORS = ["#ff6b6b", "#ffb43c", "#4cc38a", "#4d8df6", "#7b61d1", "#ffcf3f"];

  function reduced() {
    return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function confetti(duration) {
    if (reduced()) return;
    var ms = duration || 1500;
    var canvas = document.createElement("canvas");
    canvas.className = "confetti";
    var ratio = root.devicePixelRatio || 1;
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    var parts = [];
    for (var i = 0; i < 140; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
        y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 11,
        vy: -Math.random() * 11 - 4,
        size: 5 + Math.random() * 6,
        spin: Math.random() * Math.PI,
        vs: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length]
      });
    }
    var start = performance.now();
    function frame(now) {
      var t = now - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      var fade = t > ms ? Math.max(0, 1 - (t - ms) / 500) : 1;
      ctx.globalAlpha = fade;
      parts.forEach(function (p) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.spin += p.vs;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (fade > 0) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function burst(el) {
    if (reduced() || !el) return;
    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    for (var i = 0; i < 8; i++) {
      var star = document.createElement("span");
      star.className = "burst-star";
      star.textContent = "★";
      var angle = (Math.PI * 2 * i) / 8;
      star.style.left = cx + "px";
      star.style.top = cy + "px";
      star.style.color = COLORS[i % COLORS.length];
      document.body.appendChild(star);
      star.animate([
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
        { transform: "translate(calc(-50% + " + Math.cos(angle) * 56 + "px), calc(-50% + " + Math.sin(angle) * 56 + "px)) scale(1)", opacity: 0 }
      ], { duration: 650, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = (function (s) {
        return function () { s.remove(); };
      })(star);
    }
  }

  function flyStar(fromEl, toEl, done) {
    if (!fromEl || !toEl || reduced()) {
      if (done) done();
      return;
    }
    var a = fromEl.getBoundingClientRect();
    var b = toEl.getBoundingClientRect();
    var star = document.createElement("span");
    star.className = "fly-star";
    star.textContent = "★";
    star.style.left = (a.left + a.width / 2) + "px";
    star.style.top = (a.top + a.height / 2) + "px";
    document.body.appendChild(star);
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    star.animate([
      { transform: "translate(-50%, -50%) scale(1.4)" },
      { transform: "translate(calc(-50% + " + dx * 0.5 + "px), calc(-50% + " + (dy * 0.5 - 60) + "px)) scale(1.1)", offset: 0.5 },
      { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(0.5)" }
    ], { duration: 900, easing: "ease-in-out" }).onfinish = function () {
      star.remove();
      toEl.classList.add("bump");
      setTimeout(function () { toEl.classList.remove("bump"); }, 400);
      if (done) done();
    };
  }

  root.AvaCelebrate = { reduced: reduced, confetti: confetti, burst: burst, flyStar: flyStar };
})(typeof window !== "undefined" ? window : this);
