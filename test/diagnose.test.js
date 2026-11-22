"use strict";

var assert = require("assert");
var D = require("../js/diagnose.js");
var diagnose = D.diagnose;

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

function calm(result) {
  var blob = [result.help, result.turn, result.check, result.hint, result.reason].join(" ");
  assert.ok(!/try again|nochmal versuchen|super|toll|prima|klasse|great|well done|let's|!/i.test(blob), blob);
}

function hides(result, answer) {
  var pattern = new RegExp("(?:^|\\D)" + answer + "(?:\\D|$)");
  assert.ok(!pattern.test(result.check), "check leaked " + answer + ": " + result.check);
}

function hintHides(result, answer) {
  var pattern = new RegExp("(?:^|\\D)" + answer + "(?:\\D|$)");
  assert.ok(!pattern.test(result.hint), "hint leaked " + answer + ": " + result.hint);
}

check("26 + 20 = 46 is correct and names the tens", function () {
  var r = diagnose({ kind: "compute", op: "add", a: 26, b: 20, answer: 46, changes: "tens", reason: "Nur die Zehnerstelle hat sich verändert." }, "46");
  assert.strictEqual(r.code, "correct");
  assert.ok(r.reason.indexOf("Zehnerstelle") !== -1);
});

check("26 + 20 written as 406, mental wording", function () {
  var r = diagnose({ kind: "compute", op: "add", a: 26, b: 20, answer: 46 }, "406");
  assert.strictEqual(r.code, "place_shift");
  assert.ok(r.help.indexOf("20 sind 2 Zehner") !== -1, r.help);
  assert.ok(r.help.indexOf("Zehnerstelle") !== -1, r.help);
  assert.ok(r.help.indexOf("unter die") === -1, "mental sum got a column rule: " + r.help);
  assert.ok(r.check.indexOf("Hunderterstelle") !== -1, r.check);
  assert.ok(r.hint.indexOf("2 Zehner + 2 Zehner") !== -1, r.hint);
  hides(r, 46);
  hintHides(r, 46);
  calm(r);
});

check("26 + 20 written as 406 in a column", function () {
  var r = diagnose({ kind: "compute", type: "column", op: "add", a: 26, b: 20, answer: 46 }, "406");
  assert.strictEqual(r.code, "place_shift");
  assert.ok(r.help.indexOf("unter die 2 von 26") !== -1, r.help);
});

check("46 + 10 written as 406", function () {
  var r = diagnose({ kind: "compute", op: "add", a: 46, b: 10, answer: 56 }, "406");
  assert.strictEqual(r.code, "place_shift");
  assert.ok(r.help.indexOf("10 ist 1 Zehner") !== -1, r.help);
  hides(r, 56);
  hintHides(r, 56);
});

check("73 − 20 written as 503, the third-miss hint is a step", function () {
  var r = diagnose({ kind: "compute", op: "sub", a: 73, b: 20, answer: 53 }, "503");
  assert.strictEqual(r.code, "place_shift");
  assert.ok(r.hint.indexOf("7 Zehner − 2 Zehner") !== -1, r.hint);
  hintHides(r, 53);
  hides(r, 53);
});

check("a ten-times answer is also a place shift", function () {
  var r = diagnose({ kind: "compute", op: "add", a: 26, b: 20, answer: 46 }, "460");
  assert.strictEqual(r.code, "place_shift");
  assert.ok(r.check.indexOf("zehnmal") !== -1, r.check);
  hides(r, 46);
});

check("150 − 70 written as 83", function () {
  var r = diagnose({ kind: "compute", type: "column", op: "sub", a: 150, b: 70, answer: 80 }, "83");
  assert.strictEqual(r.code, "ones_should_stay");
  assert.strictEqual(r.column, "ones");
  assert.ok(r.help.indexOf("70 hat 0 Einer") !== -1, r.help);
  assert.ok(r.help.indexOf("150") !== -1, r.help);
  assert.ok(r.help.indexOf("Entbündele") !== -1, r.help);
  assert.ok(/0 bleiben/.test(r.check), r.check);
  hides(r, 80);
  hintHides(r, 80);
  calm(r);
});

check("123 − 60 written as 143", function () {
  var r = diagnose({ kind: "compute", type: "column", op: "sub", a: 123, b: 60, answer: 63 }, "143");
  assert.strictEqual(r.code, "wrong_operation");
  assert.ok(/Minusaufgabe/.test(r.check), r.check);
  assert.ok(/größer/.test(r.check), r.check);
  assert.ok(r.help.indexOf("143") !== -1 && r.help.indexOf("123") !== -1, r.help);
  hides(r, 63);
  hintHides(r, 63);
  calm(r);
});

check("175 − 128 by swapping digits", function () {
  var r = diagnose({ kind: "compute", type: "column", op: "sub", a: 175, b: 128, answer: 47 }, "53");
  assert.strictEqual(r.code, "smaller_from_larger");
  assert.ok(r.help.indexOf("Von 5 Einern kannst du nicht 8 Einer abziehen") !== -1, r.help);
  hides(r, 47);
  hintHides(r, 47);
});

check("52 − 5 written as 53 is an exchange slip", function () {
  assert.strictEqual(diagnose({ kind: "compute", op: "sub", a: 52, b: 5, answer: 47 }, "53").code, "smaller_from_larger");
});

check("52 − 5 written as 57 is an addition", function () {
  assert.strictEqual(diagnose({ kind: "compute", op: "sub", a: 52, b: 5, answer: 47 }, "57").code, "wrong_operation");
});

check("forgetting to reduce the tens, written and mental", function () {
  var col = diagnose({ kind: "compute", type: "column", op: "sub", a: 175, b: 128, answer: 47 }, "57");
  assert.strictEqual(col.code, "forgot_reduce_tens");
  assert.ok(col.hint.indexOf("Streich") !== -1, col.hint);
  hides(col, 47);
  var mental = diagnose({ kind: "compute", op: "sub", a: 91, b: 4, answer: 87 }, "97");
  assert.strictEqual(mental.code, "forgot_reduce_tens");
  assert.ok(mental.hint.indexOf("bis 90") !== -1, mental.hint);
  assert.ok(mental.help.indexOf("Streich") === -1 && mental.hint.indexOf("Streich") === -1, "mental got a column rule");
  hintHides(mental, 87);
});

check("forgetting to reduce the hundreds", function () {
  var r = diagnose({ kind: "compute", type: "column", op: "sub", a: 150, b: 70, answer: 80 }, "180");
  assert.strictEqual(r.code, "forgot_reduce_hundreds");
  hides(r, 80);
});

check("forgetting the Merkzahl", function () {
  var col = diagnose({ kind: "compute", type: "column", op: "add", a: 46, b: 27, answer: 73 }, "63");
  assert.strictEqual(col.code, "forgot_carry");
  assert.ok(/merke dir die 1/.test(col.help), col.help);
  hides(col, 73);
  var mental = diagnose({ kind: "compute", op: "add", a: 48, b: 5, answer: 53 }, "43");
  assert.strictEqual(mental.code, "forgot_carry");
  assert.ok(mental.hint.indexOf("bis 50") !== -1, mental.hint);
  assert.ok(!/Merk|merke/.test(mental.help + mental.hint), "mental got a written rule");
  var hundred = diagnose({ kind: "compute", op: "add", a: 180, b: 40, answer: 220 }, "120");
  assert.strictEqual(hundred.code, "forgot_carry");
  assert.strictEqual(hundred.column, "hundreds");
  assert.ok(hundred.hint.indexOf("bis 200") !== -1, hundred.hint);
});

check("off by one, ten and hundred", function () {
  assert.strictEqual(diagnose({ kind: "compute", op: "add", a: 48, b: 1, answer: 49 }, "48").code, "off_by_one");
  assert.strictEqual(diagnose({ kind: "compute", op: "add", a: 234, b: 30, answer: 264 }, "254").code, "off_by_ten");
  assert.strictEqual(diagnose({ kind: "compute", op: "add", a: 356, b: 100, answer: 456 }, "357").code, "added_as_ones");
  var h = diagnose({ kind: "compute", op: "add", a: 356, b: 100, answer: 456 }, "556");
  assert.strictEqual(h.code, "off_by_hundred");
  assert.strictEqual(h.column, "hundreds");
});

check("treating 10 as 1 one", function () {
  var r = diagnose({ kind: "compute", op: "add", a: 46, b: 10, answer: 56 }, "47");
  assert.strictEqual(r.code, "added_as_ones");
  assert.ok(r.help.indexOf("1 Zehner") !== -1, r.help);
  hides(r, 56);
});

check("64 + □ = 100 answered 40", function () {
  var r = diagnose({ kind: "complement", known: 64, target: 100, answer: 36 }, "40");
  assert.strictEqual(r.code, "complement_tens_only");
  assert.ok(r.help.indexOf("von 64 bis 70") !== -1, r.help);
  assert.ok(/Einer/.test(r.check), r.check);
  hides(r, 36);
  hintHides(r, 36);
  calm(r);
});

check("97 + □ = 100 answered 10", function () {
  var r = diagnose({ kind: "complement", known: 97, target: 100, answer: 3 }, "10");
  assert.strictEqual(r.code, "complement_tens_only");
  assert.ok(/nur noch Einer/.test(r.help), r.help);
});

check("reversing 64 is not the complement", function () {
  var r = diagnose({ kind: "complement", known: 64, target: 100, answer: 36 }, "46");
  assert.strictEqual(r.code, "digit_reversal");
  hides(r, 36);
});

check("7 + □ = 10 answered 4 hides the 3", function () {
  var r = diagnose({ kind: "bond", known: 7, target: 10, answer: 3 }, "4");
  assert.strictEqual(r.code, "off_by_one");
  hides(r, 3);
});

check("8 + □ = 15 adding the printed numbers", function () {
  var r = diagnose({ kind: "missingAdd", known: 8, target: 15, answer: 7 }, "23");
  assert.strictEqual(r.code, "added_the_numbers");
  assert.ok(r.hint.indexOf("bis 10") !== -1, r.hint);
  hides(r, 7);
});

check("10 − □ = 3 answered 3", function () {
  var r = diagnose({ kind: "missingSub", start: 10, result: 3, answer: 7 }, "3");
  assert.strictEqual(r.code, "copied");
  assert.ok(r.help.indexOf("übrig") !== -1, r.help);
  hides(r, 7);
});

check("a blank second step is unfinished", function () {
  var q = { kind: "twoStep", op1: "add", op2: "sub", a: 52, b: 30, c: 10, mid: 82, answer: 72, reason: "52 + 30 = 82, und 82 − 10 = 72." };
  var blank = diagnose(q, { first: "82", second: "" });
  assert.strictEqual(blank.code, "unfinished");
  assert.ok(/zweiten Schritt/.test(blank.check), blank.check);
  hides(blank, 72);
  assert.strictEqual(diagnose(q, { first: "", second: "" }).code, "empty");
  assert.strictEqual(diagnose(q, { first: "82", second: "72" }).code, "correct");
  calm(blank);
});

check("estimates: exact, size, near, and a finer rounding", function () {
  var q = { kind: "estimate", op: "add", a: 278, b: 190, roundTo: 100, exact: 468, answer: 500 };
  var exact = diagnose(q, "468");
  assert.strictEqual(exact.code, "gave_exact");
  assert.ok(/kein Überschlag/.test(exact.check), exact.check);
  hides(exact, 500);
  assert.strictEqual(diagnose(q, "40").code, "estimate_magnitude");
  var near = diagnose(q, "400");
  assert.strictEqual(near.code, "estimate_near");
  assert.ok(near.help.indexOf("300") !== -1, near.help);
  assert.strictEqual(diagnose(q, "500").code, "correct");
  var finer = diagnose(q, "470");
  assert.strictEqual(finer.code, "correct");
  assert.ok(finer.reason.indexOf("280 + 190") !== -1, finer.reason);
  var tens = { kind: "estimate", op: "sub", a: 175, b: 128, roundTo: 10, exact: 47, answer: 50 };
  assert.strictEqual(diagnose(tens, "100").code !== "correct", true);
});

check("an inverse that does not return to the start", function () {
  var q = { kind: "inverse", checkOp: "add", result: 54, other: 36, answer: 90 };
  var wrong = diagnose(q, "80");
  assert.strictEqual(wrong.code, "inverse_mismatch");
  assert.ok(/Anfang/.test(wrong.check), wrong.check);
  assert.strictEqual(diagnose(q, "54").code, "inverse_mismatch");
  assert.strictEqual(diagnose(q, "90").code, "correct");
  hides(wrong, 90);
});

check("a story added instead of taken away", function () {
  var q = { kind: "decide", choose: true, op: "sub", a: 70, b: 20, answer: 50, reason: "Weggeben ist Wegnehmen." };
  var r = diagnose(q, { op: "add", value: "90" });
  assert.strictEqual(r.code, "wrong_operation");
  assert.ok(/Minus/.test(r.check), r.check);
  hides(r, 50);
  assert.strictEqual(diagnose(q, { op: "sub", value: "50" }).code, "correct");
});

check("placing the 3 of 342 in the tens", function () {
  var r = D.diagnosePlacement({ number: 342, digit: "3", correct: "H", chosen: "T" });
  assert.strictEqual(r.code, "wrong_column");
  assert.ok(r.help.indexOf("3 Hunderter") !== -1, r.help);
  assert.ok(r.help.indexOf("Spalte H") !== -1, r.help);
  assert.ok(r.turn.indexOf("Spalte H") === -1, r.turn);
  assert.ok(r.turn.indexOf("Zehnern") !== -1, r.turn);
});

check("exchange choice", function () {
  var no = diagnose({ kind: "exchange", a: 342, b: 125, op: "add" }, "yes");
  assert.strictEqual(no.code, "exchange_choice");
  assert.ok(/nicht bündeln/.test(no.help), no.help);
  var yes = diagnose({ kind: "exchange", a: 175, b: 128, op: "sub" }, "no");
  assert.strictEqual(yes.code, "exchange_choice");
  assert.ok(yes.help.indexOf("Von 5 Einern") !== -1, yes.help);
  assert.strictEqual(diagnose({ kind: "exchange", a: 342, b: 125, op: "add" }, "no").code, "correct");
  var tens = diagnose({ kind: "exchange", a: 150, b: 70, op: "sub" }, "no");
  assert.ok(tens.help.indexOf("Von 5 Zehnern") !== -1, tens.help);
});

check("needsExchange agrees with the column rules", function () {
  assert.strictEqual(D.needsExchange(34, 25, "add"), false);
  assert.strictEqual(D.needsExchange(46, 27, "add"), true);
  assert.strictEqual(D.needsExchange(175, 128, "sub"), true);
  assert.strictEqual(D.needsExchange(150, 70, "sub"), true);
  assert.strictEqual(D.needsExchange(500, 200, "sub"), false);
  assert.strictEqual(D.needsExchange(180, 40, "add"), true);
  assert.strictEqual(D.needsExchange(123, 60, "sub"), true);
});

check("empty and digits only", function () {
  var q = { kind: "compute", op: "add", a: 2, b: 3, answer: 5 };
  assert.strictEqual(diagnose(q, "").code, "empty");
  assert.strictEqual(diagnose(q, "  ").code, "empty");
  assert.strictEqual(diagnose(q, "no").code, "not_a_number");
});

check("parent notes exist for every code we rely on", function () {
  ["place_shift", "wrong_operation", "ones_should_stay", "smaller_from_larger", "forgot_reduce_tens", "forgot_reduce_hundreds", "forgot_carry", "complement_tens_only", "estimate_magnitude", "inverse_mismatch", "unfinished", "wrong_column", "exchange_choice"].forEach(function (code) {
    assert.ok(D.PARENT[code] && D.PARENT[code].length > 10, code);
  });
});

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nAll diagnose checks passed.");
