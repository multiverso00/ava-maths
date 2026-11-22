"use strict";

var assert = require("assert");
var lessons = require("../js/lessons.js");
var diagnose = require("../js/diagnose.js").diagnose;

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

function roundTo(n, unit) {
  return Math.round(n / unit) * unit;
}

function expectedAnswer(item) {
  if (item.kind === "compute") {
    return item.op === "add" ? item.a + item.b : item.a - item.b;
  }
  if (item.kind === "bond" || item.kind === "complement" || item.kind === "missingAdd") {
    return item.target - item.known;
  }
  if (item.kind === "missingSub") return item.start - item.result;
  if (item.kind === "twoStep") {
    var mid = item.op1 === "add" ? item.a + item.b : item.a - item.b;
    var end = item.op2 === "add" ? mid + item.c : mid - item.c;
    return { mid: mid, end: end };
  }
  if (item.kind === "decide") {
    return item.op === "add" ? item.a + item.b : item.a - item.b;
  }
  if (item.kind === "estimate") {
    var ra = roundTo(item.a, item.roundTo);
    var rb = roundTo(item.b, item.roundTo);
    return item.op === "sub" ? ra - rb : ra + rb;
  }
  if (item.kind === "inverse") {
    return item.checkOp === "add" ? item.result + item.other : item.result - item.other;
  }
  return null;
}

function rightGiven(item) {
  if (item.kind === "twoStep") return { first: String(item.mid), second: String(item.answer) };
  if (item.kind === "decide" && item.choose !== false) return { op: item.op, value: String(item.answer) };
  return String(item.answer);
}

var seen = {};
var all = [];

lessons.LESSONS.forEach(function (lesson) {
  assert.strictEqual(lesson.stations.length, 4, lesson.id);
  lesson.stations.forEach(function (station, index) {
    assert.strictEqual(station.fade, ["see", "help", "turn", "check"][index], lesson.id + " " + station.id);
    station.items.forEach(function (item) {
      all.push(item);
    });
  });
});

lessons.TONIGHT.forEach(function (item) { all.push(item); });

check("ids are unique and every answer is the true result", function () {
  all.forEach(function (item) {
    assert.ok(item.id && !seen[item.id], "duplicate or missing id " + item.id);
    seen[item.id] = true;
    assert.ok(item.reason && item.reason.length > 8, item.id);
    assert.ok(item.label, item.id);
    var expected = expectedAnswer(item);
    if (item.kind === "twoStep") {
      assert.strictEqual(item.mid, expected.mid, item.id);
      assert.strictEqual(item.answer, expected.end, item.id);
    } else {
      assert.strictEqual(item.answer, expected, item.id + " stored " + item.answer + " computed " + expected);
    }
    var result = diagnose(item, rightGiven(item));
    assert.strictEqual(result.code, "correct", item.id + " " + result.help);
    assert.ok(result.reason, item.id);
  });
});

check("tonight is three exchanges, then check-only questions", function () {
  assert.ok(lessons.TONIGHT.length >= 8);
  lessons.TONIGHT.slice(0, 3).forEach(function (item) {
    assert.strictEqual(item.fade, "turn");
    assert.strictEqual(item.type, "column");
    assert.strictEqual(item.place, true);
    assert.strictEqual(item.askExchange, true);
  });
  lessons.TONIGHT.slice(3).forEach(function (item) {
    assert.strictEqual(item.fade, "check", item.id);
  });
});

check("check-only columns are answered on paper, earlier columns are lined up by hand", function () {
  lessons.LESSONS.forEach(function (lesson) {
    lesson.stations.forEach(function (station) {
      station.items.forEach(function (item) {
        if (item.type !== "column") return;
        if (station.fade === "check") assert.strictEqual(item.paper, true, item.id);
        if (station.fade === "help" || station.fade === "turn") {
          if (lesson.id === "columns" || lesson.id === "exchange") {
            assert.strictEqual(item.place, true, item.id);
          }
        }
      });
    });
  });
});

check("rules and reasons are German, questions stay English", function () {
  var english = /\b(the|and|ones|tens|hundreds|exchange|is|so)\b/i;
  all.forEach(function (item) {
    assert.ok(!english.test(item.reason), item.id + " reason: " + item.reason);
    ((item.worked && item.worked.lines) || []).forEach(function (line) {
      assert.ok(!english.test(line), item.id + " worked: " + line);
    });
    if (item.story) assert.ok(/\b(the|are|has|is)\b/.test(item.story), item.id + " story");
  });
});

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nAll answer checks passed.");
