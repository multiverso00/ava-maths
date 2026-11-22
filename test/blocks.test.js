"use strict";

var assert = require("assert");
var B = require("../js/blocks.js");
var lessons = require("../js/lessons.js");

var failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (error) {
    failed += 1;
    console.error("FAIL " + name);
    console.error("  " + error.message);
  }
}

check("numbers split into H, T, O and back", function () {
  assert.deepStrictEqual(B.fromNumber(175), { h: 1, t: 7, o: 5 });
  assert.strictEqual(B.value({ h: 1, t: 6, o: 15 }), 175);
});

check("175 − 128: not enough ones until a ten is broken", function () {
  var m = B.createModel(175, 128, "sub");
  assert.strictEqual(B.needsBreak(m), "o");
  assert.ok(/Zehnerstange zu den Einern/.test(B.guide(m)));
  var taken = B.takeOut(m, "o");
  for (var i = 0; i < 4; i++) taken = B.takeOut(taken.model, "o");
  assert.strictEqual(taken.model.mat.o, 0);
  var stuck = B.takeOut(taken.model, "o");
  assert.strictEqual(stuck.ok, false);
  var broken = B.breakDown(m, "t");
  assert.ok(broken.ok);
  assert.deepStrictEqual(broken.model.mat, { h: 1, t: 6, o: 15 });
  assert.ok(/1 Zehner ist jetzt 10 Einer/.test(broken.model.say));
  assert.strictEqual(B.value(broken.model.mat), 175);
});

check("taking more than needed bounces back", function () {
  var m = B.createModel(73, 20, "sub");
  var r = B.takeOut(m, "o");
  assert.strictEqual(r.ok, false);
  assert.ok(/keine Einer/.test(r.model.say), r.model.say);
  r = B.takeOut(m, "t");
  r = B.takeOut(r.model, "t");
  assert.ok(r.ok);
  var extra = B.takeOut(r.model, "t");
  assert.strictEqual(extra.ok, false);
  assert.ok(/schon genug Zehner/.test(extra.model.say));
  assert.ok(B.isDone(r.model));
  assert.strictEqual(B.value(r.model.mat), 53);
});

check("46 + 27 bundles 13 ones into a ten", function () {
  var m = B.createModel(46, 27, "add");
  while (m.tray.o) m = B.moveIn(m, "o").model;
  assert.strictEqual(m.mat.o, 13);
  assert.strictEqual(B.bundleCol(m), "o");
  assert.ok(/Bündele 10 Einer zu 1 Zehner/.test(B.guide(m)));
  m = B.bundleUp(m, "o").model;
  assert.deepStrictEqual(m.mat, { h: 0, t: 5, o: 3 });
  while (m.tray.t) m = B.moveIn(m, "t").model;
  assert.ok(B.isDone(m));
  assert.strictEqual(B.value(m.mat), 73);
});

check("a ten dropped on the ones goes back", function () {
  var m = B.createModel(46, 10, "add");
  var r = B.moveIn(m, "t", "o");
  assert.strictEqual(r.ok, false);
  assert.ok(/Zehner gehören zu den Zehnern/.test(r.model.say), r.model.say);
  assert.strictEqual(r.model.mat.t, 4);
});

check("frames and the hundred square", function () {
  var f = B.frameModel(4, 10, "fill");
  f = B.tapFrame(f, 9).model;
  assert.strictEqual(f.filled, 10);
  assert.ok(B.isDone(f));
  f = B.tapFrame(f, 6).model;
  assert.strictEqual(f.filled, 6);
  assert.strictEqual(B.tapFrame(f, 2).ok, false);
  var h = B.hundredModel(64);
  h = B.tapHundred(h, 65).model;
  assert.strictEqual(h.filled, 70);
  h = B.tapHundred(h, 99).model;
  assert.strictEqual(h.filled, 100);
  h = B.tapHundred(h, 85).model;
  assert.strictEqual(h.filled, 80);
});

check("every demo ends on the right number and speaks German", function () {
  var items = [];
  lessons.LESSONS.forEach(function (lesson) {
    lesson.stations.forEach(function (station) {
      station.items.forEach(function (item) { items.push(item); });
    });
  });
  var demos = 0;
  items.forEach(function (item) {
    if (!B.modelFor(item)) return;
    var steps = B.demoSteps(item);
    var last = steps[steps.length - 1].model;
    demos += 1;
    if (last.kind === "blocks") {
      assert.strictEqual(B.value(last.mat), item.answer, item.id);
      assert.ok(B.isDone(last), item.id);
    } else if (last.kind === "frame" && last.mode === "fill") {
      assert.strictEqual(last.filled - last.start, item.answer, item.id);
    } else if (last.kind === "frame") {
      assert.strictEqual(last.start - last.filled, item.answer, item.id);
    } else if (last.kind === "hundred") {
      assert.strictEqual(last.filled - last.start, item.answer, item.id);
    }
    steps.forEach(function (step) {
      assert.ok(step.say && !/\b(the|and|take|add)\b/i.test(step.say), item.id + ": " + step.say);
    });
  });
  assert.ok(demos >= 20, "only " + demos + " demos");
});

check("175 − 128 demo breaks a ten and shows 15 ones", function () {
  var steps = B.demoSteps({ kind: "compute", op: "sub", a: 175, b: 128, answer: 47 });
  var broke = steps.filter(function (s) { return /entbündele 1 Zehner/.test(s.say); });
  assert.strictEqual(broke.length, 1);
  assert.strictEqual(broke[0].model.mat.o, 15);
});

check("no mat on paper questions or impossible numbers", function () {
  assert.strictEqual(B.modelFor({ kind: "compute", type: "column", paper: true, op: "add", a: 63, b: 24 }), null);
  assert.strictEqual(B.modelFor({ kind: "compute", op: "sub", a: 5, b: 9 }), null);
  assert.strictEqual(B.modelFor({ kind: "estimate", op: "add", a: 278, b: 190 }), null);
  assert.strictEqual(B.modelFor({ kind: "decide", choose: true, op: "sub", a: 70, b: 20 }), null);
});

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nAll block checks passed.");
