(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AvaDiagnose = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PARENT = {
    place_shift: "Puts a tens digit in the hundreds place, or makes the answer ten times too big.",
    wrong_operation: "Adds when the calculation takes away, or takes away when it should add.",
    ones_should_stay: "Writes a ones digit when the ones should stay 0.",
    smaller_from_larger: "Takes the smaller digit from the larger one instead of exchanging (entbündeln).",
    forgot_reduce_tens: "Exchanges a ten, then forgets to take 1 off the tens.",
    forgot_reduce_hundreds: "Exchanges a hundred, then forgets to take 1 off the hundreds.",
    forgot_carry: "Makes a ten or a hundred, then forgets the carried 1 (Merkzahl) in the next column.",
    complement_tens_only: "Builds a complement to 100 from the tens and leaves the ones out.",
    complement_ones_only: "Finds the ones partner and stops before the tens.",
    digit_reversal: "Reverses the digits instead of finding the complement.",
    off_by_one: "Is one away, usually in the ones.",
    off_by_ten: "Is ten away. The tens slipped.",
    off_by_hundred: "Is a hundred away. The hundreds slipped.",
    added_as_ones: "Treats a ten as a one, or a hundred as a ten.",
    estimate_magnitude: "Estimates with a number of the wrong size.",
    estimate_near: "Rounds a number the wrong way before estimating.",
    gave_exact: "Gives the exact total when an estimate was asked.",
    inverse_mismatch: "The inverse check does not return to the start.",
    unfinished: "Leaves a step of a two-step calculation empty.",
    wrong_column: "Lines a digit up in the wrong column.",
    exchange_choice: "Misjudges whether an exchange is needed.",
    column_digit: "Has one column whose digit does not match.",
    added_the_numbers: "Adds the two numbers already printed, instead of finding the gap.",
    copied: "Copies a number already on the page.",
    decision: "Chooses add or take away in a way that does not match the story.",
    other: "Makes a slip that does not sit in a single column."
  };

  var NAME = { ones: "Einer", tens: "Zehner", hundreds: "Hunderter" };
  var PLACE = { ones: "Einerstelle", tens: "Zehnerstelle", hundreds: "Hunderterstelle" };

  function pack(fields) {
    return Object.assign({
      correct: false,
      code: "other",
      column: null,
      help: "",
      turn: "",
      check: "",
      hint: "",
      reason: ""
    }, fields);
  }

  function ok(reason, column) {
    return pack({
      correct: true,
      code: "correct",
      column: column || null,
      reason: reason,
      help: reason,
      turn: reason,
      check: reason
    });
  }

  function emptyResult() {
    return pack({
      code: "empty",
      help: "Das Kästchen ist noch leer.",
      turn: "Das Kästchen ist noch leer.",
      check: "Das Kästchen ist noch leer.",
      hint: "Schreib eine Zahl hinein."
    });
  }

  function badResult() {
    return pack({
      code: "not_a_number",
      help: "Schreib nur Ziffern.",
      turn: "Schreib nur Ziffern.",
      check: "Schreib nur Ziffern.",
      hint: "Schreib nur Ziffern."
    });
  }

  function parseDigits(raw) {
    if (raw == null) return { empty: true };
    if (typeof raw === "number") {
      if (!Number.isFinite(raw) || raw < 0 || !Number.isInteger(raw)) return { bad: true };
      return { n: raw };
    }
    var s = String(raw).trim();
    if (s === "") return { empty: true };
    if (!/^\d+$/.test(s)) return { bad: true };
    return { n: Number(s) };
  }

  function isAre(n) {
    return n === 1 ? "ist" : "sind";
  }

  function dat(n, name) {
    return n === 1 ? name : name + "n";
  }

  function ceilTo(n, unit) {
    var up = Math.ceil(n / unit) * unit;
    return up === n ? n + unit : up;
  }

  function floorTo(n, unit) {
    var down = Math.floor(n / unit) * unit;
    return down === n ? n - unit : down;
  }

  function digitsOf(n, width) {
    var s = String(Math.abs(n));
    var padded = s.padStart(width || s.length, "0");
    var out = [];
    for (var i = 0; i < padded.length; i++) out.push(Number(padded[i]));
    return out;
  }

  function columnFromRight(indexFromRight) {
    return ["ones", "tens", "hundreds", "thousands"][indexFromRight] || null;
  }

  function needsExchange(a, b, op) {
    var width = Math.max(String(a).length, String(b).length);
    var A = digitsOf(a, width);
    var B = digitsOf(b, width);
    var i;
    if (op === "add") {
      for (i = width - 1; i >= 0; i--) {
        if (A[i] + B[i] >= 10) return true;
      }
      return false;
    }
    for (i = 0; i < width; i++) {
      if (A[i] < B[i]) return true;
    }
    return false;
  }

  function exchangeColumns(a, b, op) {
    var width = Math.max(String(a).length, String(b).length, 3);
    var need = { ones: false, tens: false, hundreds: false };
    var A = digitsOf(a, width);
    var B = digitsOf(b, width);
    var i;
    if (op === "add") {
      var carry = 0;
      for (i = width - 1; i >= 0; i--) {
        var sum = A[i] + B[i] + carry;
        var name = columnFromRight(width - 1 - i);
        if (sum >= 10 && name && Object.prototype.hasOwnProperty.call(need, name)) need[name] = true;
        carry = Math.floor(sum / 10);
      }
      return need;
    }
    for (i = width - 1; i >= 0; i--) {
      var subName = columnFromRight(width - 1 - i);
      if (A[i] < B[i]) {
        if (subName && Object.prototype.hasOwnProperty.call(need, subName)) need[subName] = true;
        var j = i - 1;
        while (j >= 0 && A[j] === 0) {
          A[j] = 9;
          j--;
        }
        if (j >= 0) A[j] -= 1;
        A[i] += 10;
      }
    }
    return need;
  }

  function digitwiseAbs(a, b) {
    var width = Math.max(String(a).length, String(b).length);
    var A = digitsOf(a, width);
    var B = digitsOf(b, width);
    var s = "";
    for (var i = 0; i < width; i++) s += String(Math.abs(A[i] - B[i]));
    return Number(s);
  }

  function insertedZero(truth, given) {
    var t = String(truth);
    var g = String(given);
    if (g.length !== t.length + 1) return false;
    for (var i = 0; i < g.length; i++) {
      if (g[i] === "0" && g.slice(0, i) + g.slice(i + 1) === t) return true;
    }
    return false;
  }

  function isPlaceShift(a, b, truth, given) {
    if (truth === 0 || given === truth) return false;
    if (given === truth * 10 || given === truth * 100) return true;
    if (insertedZero(truth, given)) return true;
    if (b % 10 === 0 && b !== 0 && (given === a * 10 || insertedZero(a, given))) return true;
    if (truth >= 10 && truth < 100) {
      if (given === Math.floor(truth / 10) * 100 + (truth % 10)) return true;
    }
    if (truth >= 100 && truth < 1000) {
      if (given === Math.floor(truth / 100) * 1000 + (truth % 100)) return true;
    }
    return false;
  }

  function singleColumn(truth, given) {
    var width = Math.max(String(truth).length, String(given).length);
    var T = digitsOf(truth, width);
    var G = digitsOf(given, width);
    var diff = [];
    for (var i = 0; i < width; i++) {
      if (T[i] !== G[i]) diff.push(columnFromRight(width - 1 - i));
    }
    return diff.length === 1 ? diff[0] : null;
  }

  function written(q) {
    return q.type === "column";
  }

  function defaultReason(q) {
    if (q.reason) return q.reason;
    if (q.changes) return "Nur die " + PLACE[q.changes] + " hat sich verändert.";
    if (q.op === "add" && needsExchange(q.a, q.b, "add")) return "An einer Stelle kamen 10 oder mehr zusammen. Du hast gebündelt.";
    if (q.op === "sub" && needsExchange(q.a, q.b, "sub")) return "An einer Stelle hat es nicht gereicht. Du hast entbündelt.";
    if (q.op === "add") return "An keiner Stelle kamen 10 oder mehr zusammen.";
    return "An jeder Stelle war oben genug da.";
  }

  function nearMessages(truth, given, fallback) {
    var delta = given - truth;
    if (delta === 1 || delta === -1) {
      return pack({
        code: "off_by_one",
        column: "ones",
        help: "Du bist 1 daneben. Zähl die Einer noch einmal.",
        turn: "Du bist 1 daneben. Zähl die Einer noch einmal.",
        check: "Das Ergebnis liegt 1 daneben.",
        hint: fallback.hint || "Zähl die Einer langsam noch einmal."
      });
    }
    if (delta === 10 || delta === -10) {
      return pack({
        code: "off_by_ten",
        column: "tens",
        help: "Du bist 10 daneben. Schau dir die Zehner an.",
        turn: "Du bist 10 daneben. Schau dir die Zehner an.",
        check: "Schau dir die Zehnerstelle an.",
        hint: fallback.hint || "Rechne die Zehner für sich."
      });
    }
    if (delta === 100 || delta === -100) {
      return pack({
        code: "off_by_hundred",
        column: "hundreds",
        help: "Du bist 100 daneben. Schau dir die Hunderter an.",
        turn: "Du bist 100 daneben. Schau dir die Hunderter an.",
        check: "Schau dir die Hunderterstelle an.",
        hint: fallback.hint || "Rechne die Hunderter für sich."
      });
    }
    var col = singleColumn(truth, given);
    if (col) {
      return pack({
        code: "column_digit",
        column: col,
        help: "Schau dir die " + PLACE[col] + " an.",
        turn: "Schau dir die " + PLACE[col] + " an.",
        check: "Die Ziffer an der " + PLACE[col] + " stimmt nicht.",
        hint: "Deck die anderen Stellen ab und rechne nur die " + NAME[col] + "."
      });
    }
    return pack({
      code: "other",
      help: fallback.help,
      turn: fallback.turn,
      check: fallback.check,
      hint: fallback.hint
    });
  }

  function placeShiftPack(q, truth, given) {
    var a = q.a;
    var b = q.b;
    var op = q.op;
    var sign = op === "add" ? " + " : " − ";
    var classic = truth >= 10 && truth < 100 &&
      given === Math.floor(truth / 10) * 100 + (truth % 10) &&
      given !== truth * 10;
    var help = "Eine Ziffer steht an der falschen Stelle. Dadurch ist die Zahl zu groß geworden.";
    var turn = "Das Ergebnis hat zu viele Stellen.";
    var hint = written(q)
      ? "Schreib Hunderter, Zehner und Einer genau untereinander. Dann rechne Stelle für Stelle."
      : "Rechne Stelle für Stelle. Jede Ziffer bleibt an ihrer Stelle.";
    if (b % 10 === 0 && b > 0 && b < 100) {
      var t = b / 10;
      var aT = Math.floor(a / 10) % 10;
      if (written(q)) {
        help = "Die " + t + " in " + b + " " + isAre(t) + " " + t + " Zehner. Sie gehört an die Zehnerstelle, unter die " + aT + " von " + a + ".";
        turn = "Die " + t + " in " + b + " " + isAre(t) + " " + t + " Zehner. Sie gehört an die Zehnerstelle.";
      } else {
        help = b + " " + isAre(t) + " " + t + " Zehner. Nur die Zehnerstelle verändert sich. Dein Ergebnis hat eine Stelle zu viel.";
        turn = b + " " + isAre(t) + " " + t + " Zehner. Nur die Zehnerstelle verändert sich.";
      }
      hint = "Rechne nur die Zehner: " + aT + " Zehner" + sign + t + " Zehner. Die Einer bleiben gleich.";
    } else if (b % 100 === 0 && b > 0) {
      var h = b / 100;
      var aH = Math.floor(a / 100) % 10;
      help = b + " " + isAre(h) + " " + h + " Hunderter. Nur die Hunderterstelle verändert sich.";
      turn = help;
      hint = "Rechne nur die Hunderter: " + aH + " Hunderter" + sign + h + " Hunderter. Zehner und Einer bleiben gleich.";
    }
    var check;
    if (classic) check = "Eine Zehnerziffer ist an die Hunderterstelle gerutscht.";
    else if (given === truth * 100) check = "Das Ergebnis ist hundertmal zu groß.";
    else if (given === truth * 10) check = "Das Ergebnis ist zehnmal zu groß.";
    else check = "Eine zusätzliche Null hat die Zahl verändert.";
    return pack({ code: "place_shift", column: "hundreds", help: help, turn: turn, check: check, hint: hint });
  }

  function smallerPack(a, b) {
    var cols = exchangeColumns(a, b, "sub");
    var aO = a % 10;
    var bO = b % 10;
    var aT = Math.floor(a / 10) % 10;
    var bT = Math.floor(b / 10) % 10;
    var help = "An einer Stelle ist oben zu wenig da. Entbündele zuerst an der nächsten Stelle, dann zieh ab.";
    var hint = "Such die erste Stelle, an der oben die kleinere Ziffer steht. Dort musst du entbündeln.";
    var column = "ones";
    if (aO < bO) {
      help = "Von " + aO + " " + dat(aO, "Einer") + " kannst du nicht " + bO + " Einer abziehen. Entbündele zuerst 1 Zehner in 10 Einer.";
      hint = "Nach dem Entbündeln hast du " + (10 + aO) + " Einer.";
    } else if (cols.tens && aT < bT) {
      column = "tens";
      help = "Von " + aT + " " + dat(aT, "Zehner") + " kannst du nicht " + bT + " Zehner abziehen. Entbündele zuerst 1 Hunderter in 10 Zehner.";
      hint = "Nach dem Entbündeln hast du " + (aT + 10) + " Zehner.";
    }
    return pack({
      code: "smaller_from_larger",
      column: column,
      help: help,
      turn: "Du hast die kleinere Ziffer von der größeren abgezogen. An dieser Stelle musst du zuerst entbündeln.",
      check: "An einer Stelle reicht es nicht. Zuerst muss entbündelt werden.",
      hint: hint
    });
  }

  function directionPack(q, given, wasAdded) {
    var a = q.a;
    var b = q.b;
    var help = given + " ist größer als " + a + ". Bei Minus wird das Ergebnis kleiner.";
    if (wasAdded) help += " Du hast plus gerechnet.";
    var hint = "Fang bei " + a + " an und zieh ab. Das Ergebnis ist kleiner als " + a + ".";
    if (written(q)) {
      hint = "Fang bei den Einern an und zieh Stelle für Stelle ab. Das Ergebnis ist kleiner als " + a + ".";
    } else if (b % 10 === 0 && b > 0 && b < 100) {
      hint = "Fang bei " + a + " an und zieh " + (b / 10) + " Zehner ab. Die Einer bleiben gleich.";
    }
    return pack({
      code: "wrong_operation",
      help: help,
      turn: given + " ist größer als " + a + ". Bei Minus muss das Ergebnis kleiner werden.",
      check: "Das ist eine Minusaufgabe, und dein Ergebnis ist größer als die Zahl am Anfang.",
      hint: hint
    });
  }

  function diagnoseCompute(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    var a = q.a;
    var b = q.b;
    var op = q.op;
    var truth = q.answer;
    if (given === truth) return ok(defaultReason(q), q.changes || null);

    if (isPlaceShift(a, b, truth, given)) return placeShiftPack(q, truth, given);

    var sum = a + b;
    var diff = a - b;
    if (op === "sub" && given === sum) return directionPack(q, given, true);

    var cols = exchangeColumns(a, b, op);
    var exchanged = needsExchange(a, b, op);

    if (op === "sub" && cols.ones && given === truth + 10) {
      if (written(q)) {
        return pack({
          code: "forgot_reduce_tens",
          column: "tens",
          help: "Du hast 1 Zehner entbündelt. Dann ist oben an der Zehnerstelle 1 Zehner weniger.",
          turn: "Nach dem Entbündeln ist oben 1 Zehner weniger.",
          check: "Der entbündelte Zehner wurde oben nicht weggenommen.",
          hint: "Streich die Zehnerziffer oben durch und schreib die Zahl daneben, die 1 kleiner ist. Dann rechne die Zehner."
        });
      }
      return pack({
        code: "forgot_reduce_tens",
        column: "tens",
        help: "Du rechnest über einen Zehner zurück. Dabei wird auch die Zehnerstelle 1 kleiner.",
        turn: "Du rechnest über einen Zehner zurück. Die Zehnerstelle wird 1 kleiner.",
        check: "Beim Rückwärtsrechnen über den Zehner ist die Zehnerstelle gleich geblieben.",
        hint: "Rechne zuerst bis " + floorTo(a, 10) + " zurück. Dann zieh den Rest ab."
      });
    }
    if (op === "sub" && cols.tens && given === truth + 100) {
      if (written(q)) {
        return pack({
          code: "forgot_reduce_hundreds",
          column: "hundreds",
          help: "Du hast 1 Hunderter entbündelt. Dann ist oben an der Hunderterstelle 1 Hunderter weniger.",
          turn: "Nach dem Entbündeln ist oben 1 Hunderter weniger.",
          check: "Der entbündelte Hunderter wurde oben nicht weggenommen.",
          hint: "Streich die Hunderterziffer oben durch und schreib die Zahl daneben, die 1 kleiner ist."
        });
      }
      return pack({
        code: "forgot_reduce_hundreds",
        column: "hundreds",
        help: "Du rechnest über einen Hunderter zurück. Dabei wird auch die Hunderterstelle 1 kleiner.",
        turn: "Du rechnest über einen Hunderter zurück. Die Hunderterstelle wird 1 kleiner.",
        check: "Beim Rückwärtsrechnen über den Hunderter ist die Hunderterstelle gleich geblieben.",
        hint: "Rechne zuerst bis " + floorTo(a, 100) + " zurück. Dann zieh den Rest ab."
      });
    }
    if (op === "add" && cols.ones && given === truth - 10) {
      if (written(q)) {
        return pack({
          code: "forgot_carry",
          column: "tens",
          help: (a % 10) + " Einer + " + (b % 10) + " Einer sind mehr als 9 Einer. Bündele 10 Einer zu 1 Zehner und merke dir die 1 an der Zehnerstelle.",
          turn: "Bei den Einern ist ein Zehner entstanden. Die gemerkte 1 fehlt an der Zehnerstelle.",
          check: "Bei den Einern ist ein Zehner entstanden, aber die Zehnerstelle ist nicht größer geworden.",
          hint: "Rechne die Zehner zusammen mit der gemerkten 1."
        });
      }
      return pack({
        code: "forgot_carry",
        column: "tens",
        help: (a % 10) + " + " + (b % 10) + " geht über den Zehner. Dann wird auch die Zehnerstelle 1 größer.",
        turn: "Du rechnest über einen Zehner. Die Zehnerstelle wird 1 größer.",
        check: "Beim Rechnen über den Zehner ist die Zehnerstelle gleich geblieben.",
        hint: "Rechne zuerst bis " + ceilTo(a, 10) + ". Dann rechne den Rest dazu."
      });
    }
    if (op === "add" && cols.tens && given === truth - 100) {
      if (written(q)) {
        return pack({
          code: "forgot_carry",
          column: "hundreds",
          help: "Die Zehner sind zusammen mehr als 9 Zehner. Bündele 10 Zehner zu 1 Hunderter und merke dir die 1 an der Hunderterstelle.",
          turn: "Bei den Zehnern ist ein Hunderter entstanden. Die gemerkte 1 fehlt an der Hunderterstelle.",
          check: "Bei den Zehnern ist ein Hunderter entstanden, aber die Hunderterstelle ist nicht größer geworden.",
          hint: "Rechne die Hunderter zusammen mit der gemerkten 1."
        });
      }
      return pack({
        code: "forgot_carry",
        column: "hundreds",
        help: "Die Zehner gehen über den Hunderter. Dann wird auch die Hunderterstelle 1 größer.",
        turn: "Du rechnest über einen Hunderter. Die Hunderterstelle wird 1 größer.",
        check: "Beim Rechnen über den Hunderter ist die Hunderterstelle gleich geblieben.",
        hint: "Rechne zuerst bis " + ceilTo(a, 100) + ". Dann rechne den Rest dazu."
      });
    }
    if (op === "add" && diff >= 0 && given === diff) {
      return pack({
        code: "wrong_operation",
        help: "Das ist eine Plusaufgabe. Das Ergebnis muss größer als " + Math.max(a, b) + " sein.",
        turn: "Bei Plus wird das Ergebnis größer.",
        check: "Das ist eine Plusaufgabe, und dein Ergebnis ist kleiner als die Zahl am Anfang.",
        hint: "Rechne plus. Das Ergebnis wird größer als " + a + "."
      });
    }

    if (op === "sub" && exchanged && given === digitwiseAbs(a, b) && ((a % 10 < b % 10) || given <= a)) {
      return smallerPack(a, b);
    }

    if (op === "sub" && a % 10 === 0 && b % 10 === 0 && truth % 10 === 0 &&
        given % 10 !== 0 && Math.floor(given / 10) === Math.floor(truth / 10)) {
      var aT = Math.floor(a / 10) % 10;
      var bT = Math.floor(b / 10) % 10;
      var help = b + " hat 0 Einer. Die Einerstelle von " + a + " bleibt 0.";
      var hint = written(q)
        ? "Die Einerstelle bleibt 0. Dann rechne die Zehner."
        : "Rechne nur mit Zehnern: " + (a / 10) + " Zehner − " + (b / 10) + " Zehner.";
      if (cols.tens && written(q)) {
        help += " Bei den Zehnern: Von " + aT + " " + dat(aT, "Zehner") + " kannst du nicht " + bT + " Zehner abziehen. Entbündele 1 Hunderter.";
        hint = "Entbündele 1 Hunderter in 10 Zehner. Dann hast du " + (aT + 10) + " Zehner.";
      }
      return pack({
        code: "ones_should_stay",
        column: "ones",
        help: help,
        turn: b + " hat 0 Einer, also bleibt die Einerstelle 0.",
        check: "Die Einerstelle muss 0 bleiben. Die Zahl, die du abziehst, hat keine Einer.",
        hint: hint
      });
    }

    if (b % 10 === 0 && b % 100 !== 0 && b !== 0) {
      var tenCount = b / 10;
      var treated = op === "add" ? a + tenCount : a - tenCount;
      if (given === treated) {
        return pack({
          code: "added_as_ones",
          column: "tens",
          help: b + " " + isAre(tenCount) + " " + tenCount + " Zehner. Es verändert sich die Zehnerstelle, nicht die Einerstelle.",
          turn: b + " " + isAre(tenCount) + " " + tenCount + " Zehner. Die Zehnerstelle verändert sich.",
          check: "Zehner wurden wie Einer gerechnet.",
          hint: "Verändere die Zehnerstelle um " + tenCount + ". Die Einer bleiben gleich."
        });
      }
    }
    if (b % 100 === 0 && b !== 0) {
      var hundredCount = b / 100;
      var asOnes = op === "add" ? a + hundredCount : a - hundredCount;
      var asTens = op === "add" ? a + hundredCount * 10 : a - hundredCount * 10;
      if (given === asOnes || given === asTens) {
        return pack({
          code: "added_as_ones",
          column: "hundreds",
          help: b + " " + isAre(hundredCount) + " " + hundredCount + " Hunderter. Es verändert sich die Hunderterstelle.",
          turn: b + " " + isAre(hundredCount) + " " + hundredCount + " Hunderter. Die Hunderterstelle verändert sich.",
          check: given === asOnes ? "Hunderter wurden wie Einer gerechnet." : "Hunderter wurden wie Zehner gerechnet.",
          hint: "Verändere die Hunderterstelle um " + hundredCount + ". Zehner und Einer bleiben gleich."
        });
      }
    }

    if (op === "sub" && given > a) return directionPack(q, given, false);

    return nearMessages(truth, given, written(q) ? {
      help: "Prüfe das Rechenzeichen. Dann rechne Stelle für Stelle, bei den Einern beginnend.",
      turn: "Prüfe das Rechenzeichen und dann jede Stelle.",
      check: "Das Ergebnis passt nicht zu dieser Aufgabe.",
      hint: "Fang bei den Einern an."
    } : {
      help: "Prüfe zuerst das Rechenzeichen. Dann rechne in kleinen Schritten.",
      turn: "Prüfe das Rechenzeichen und rechne in kleinen Schritten.",
      check: "Das Ergebnis passt nicht zu dieser Aufgabe.",
      hint: "Rechne in Schritten, zuerst bis zum nächsten glatten Zehner."
    });
  }

  function diagnoseBond(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    if (given === q.answer) return ok(q.reason || (q.known + " und " + q.answer + " ergeben " + q.target + "."));
    if (given === q.known || given === q.target) {
      return pack({
        code: "copied",
        help: given === q.target
          ? q.target + " ist das Ganze. Ins Kästchen gehört der Teil, der noch fehlt."
          : given + " hast du schon. Ins Kästchen gehört die Zahl, die bis " + q.target + " fehlt.",
        turn: "Diese Zahl steht schon da. Ins Kästchen gehört der fehlende Teil.",
        check: "Das ist eine Zahl, die schon in der Aufgabe steht.",
        hint: "Ergänze von " + q.known + " bis " + q.target + "."
      });
    }
    var near = nearMessages(q.answer, given, {
      help: "Zähl die Schritte von " + q.known + " bis " + q.target + ".",
      turn: "Zähl die Schritte von " + q.known + " bis " + q.target + ".",
      check: "Damit ergibt es nicht " + q.target + ".",
      hint: "Zähl von " + q.known + " weiter bis " + q.target + " und zähl die Schritte mit."
    });
    if (near.code === "off_by_one") {
      near.help = "Ergänze von " + q.known + " bis " + q.target + ". Du bist 1 Schritt daneben.";
      near.turn = "Du bist 1 Schritt daneben. Zähl noch einmal ab " + q.known + ".";
    }
    return near;
  }

  function diagnoseComplement(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    if (given === q.answer) return ok(q.reason || ("Damit ergibt es " + q.target + "."));
    var ones = q.known % 10;
    var nextTen = ceilTo(q.known, 10);
    var onlyOnes = nextTen === q.target;
    var tensOnly = q.target - (q.known - ones);
    if (q.target === 100 && ones !== 0 && given === tensOnly) {
      if (onlyOnes) {
        return pack({
          code: "complement_tens_only",
          column: "ones",
          help: "Von " + q.known + " bis " + q.target + " fehlen nur noch Einer.",
          turn: "Von " + q.known + " bis " + q.target + " fehlen nur noch Einer.",
          check: "Damit kommst du über " + q.target + " hinaus.",
          hint: "Zähl von " + q.known + " in Einerschritten bis " + q.target + "."
        });
      }
      return pack({
        code: "complement_tens_only",
        column: "ones",
        help: "Ergänze in zwei Schritten: zuerst von " + q.known + " bis " + nextTen + ", dann von " + nextTen + " bis " + q.target + ".",
        turn: "Die Einer fehlen noch. Ergänze zuerst bis " + nextTen + ".",
        check: "Beim Ergänzen wurden die Einer vergessen.",
        hint: "Von " + q.known + " bis " + nextTen + " sind es " + (nextTen - q.known) + ". Jetzt ergänze von " + nextTen + " bis " + q.target + "."
      });
    }
    var onesPartner = (10 - ones) % 10;
    if (q.target === 100 && ones !== 0 && given === onesPartner && onesPartner !== q.answer) {
      return pack({
        code: "complement_ones_only",
        column: "tens",
        help: "Damit kommst du bis " + nextTen + ". Bis " + q.target + " fehlen noch Zehner.",
        turn: "Das reicht nur bis zum nächsten Zehner. Die Zehner bis " + q.target + " fehlen.",
        check: "Beim Ergänzen fehlen die Zehner.",
        hint: "Ergänze jetzt von " + nextTen + " bis " + q.target + "."
      });
    }
    if (q.known >= 10 && q.known < 100) {
      var reversed = (q.known % 10) * 10 + Math.floor(q.known / 10);
      if (given === reversed && reversed !== q.answer) {
        return pack({
          code: "digit_reversal",
          help: "Die Ziffern von " + q.known + " umdrehen ergibt nicht die Ergänzung bis " + q.target + ". Ergänze zuerst bis " + nextTen + ".",
          turn: "Umgedrehte Ziffern sind nicht die Ergänzung.",
          check: "Umgedrehte Ziffern sind nicht die Ergänzung.",
          hint: "Ergänze zuerst von " + q.known + " bis " + nextTen + "."
        });
      }
    }
    return nearMessages(q.answer, given, {
      help: "Ergänze von " + q.known + " bis " + q.target + ".",
      turn: "Ergänze von " + q.known + " bis " + q.target + ".",
      check: "Damit kommst du nicht genau auf " + q.target + ".",
      hint: "Ergänze zuerst bis zum nächsten glatten Zehner, dann bis " + q.target + "."
    });
  }

  function diagnoseMissingAdd(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    if (given === q.answer) return ok(q.reason);
    var nextTen = ceilTo(q.known, 10);
    var hint = nextTen < q.target
      ? "Ergänze zuerst von " + q.known + " bis " + nextTen + ", dann bis " + q.target + "."
      : "Ergänze von " + q.known + " bis " + q.target + ".";
    if (given === q.known + q.target) {
      return pack({
        code: "added_the_numbers",
        help: q.known + " und " + q.target + " stehen schon da. Ins Kästchen gehört, was von " + q.known + " bis " + q.target + " fehlt.",
        turn: "Du hast die beiden Zahlen addiert. Gesucht ist, was dazwischen fehlt.",
        check: "Die beiden Zahlen wurden addiert. Gesucht ist, was von der einen bis zur anderen fehlt.",
        hint: hint
      });
    }
    if (given === q.known || given === q.target) {
      return pack({
        code: "copied",
        help: "Diese Zahl steht schon da. Ins Kästchen gehört, was von " + q.known + " bis " + q.target + " fehlt.",
        turn: "Diese Zahl steht schon da. Ins Kästchen gehört der fehlende Teil.",
        check: "Das ist eine Zahl, die schon in der Aufgabe steht.",
        hint: hint
      });
    }
    return nearMessages(q.answer, given, {
      help: "Ergänze von " + q.known + " bis " + q.target + ".",
      turn: "Ergänze von " + q.known + " bis " + q.target + ".",
      check: "Das ist nicht der fehlende Teil.",
      hint: hint
    });
  }

  function diagnoseMissingSub(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    if (given === q.answer) return ok(q.reason);
    var hint = "Ergänze von " + q.result + " bis " + q.start + ".";
    if (given === q.result) {
      return pack({
        code: "copied",
        help: q.result + " bleibt übrig. Ins Kästchen gehört die Zahl, die du wegnimmst.",
        turn: "Das ist der Rest. Gesucht ist die Zahl, die weggenommen wird.",
        check: "Das ist die Zahl, die übrig bleibt, nicht die fehlende.",
        hint: hint
      });
    }
    if (given === q.start) {
      return pack({
        code: "copied",
        help: q.start + " ist die Zahl am Anfang. Ins Kästchen gehört, was du wegnimmst.",
        turn: "Das ist die Zahl am Anfang. Gesucht ist, was weggenommen wird.",
        check: "Das ist eine Zahl, die schon in der Aufgabe steht.",
        hint: hint
      });
    }
    if (given === q.start + q.result) {
      return pack({
        code: "wrong_operation",
        help: "Die beiden Zahlen wurden addiert. Ins Kästchen gehört der Teil, der weggenommen wird.",
        turn: "Hier wird weggenommen. Gesucht ist der Teil, der weggenommen wird.",
        check: "Hier wird weggenommen, und die beiden Zahlen wurden addiert.",
        hint: hint
      });
    }
    return nearMessages(q.answer, given, {
      help: "Ins Kästchen gehört, was du von " + q.start + " wegnimmst, damit " + q.result + " übrig bleibt.",
      turn: "Ins Kästchen gehört, was du von " + q.start + " wegnimmst, damit " + q.result + " übrig bleibt.",
      check: "Das ist nicht die Zahl, die weggenommen wird.",
      hint: hint
    });
  }

  function stepPrefix(result, label) {
    return pack({
      correct: result.correct,
      code: result.code,
      column: result.column,
      reason: result.reason,
      help: label + " " + result.help,
      turn: label + " " + result.turn,
      check: label + " " + result.check,
      hint: result.hint
    });
  }

  function diagnoseTwoStep(q, given) {
    var first = parseDigits(given && typeof given === "object" ? given.first : "");
    var second = parseDigits(given && typeof given === "object" ? given.second : "");
    var nextStep = q.op2 === "sub"
      ? "Zieh " + q.c + " vom ersten Ergebnis ab."
      : "Rechne " + q.c + " zum ersten Ergebnis dazu.";
    if (first.empty && second.empty) return emptyResult();
    if (first.bad || second.bad) return badResult();
    if (first.empty) {
      return pack({
        code: "unfinished",
        help: "Rechne zuerst den ersten Schritt.",
        turn: "Der erste Schritt ist noch leer.",
        check: "Die Aufgabe ist noch nicht fertig.",
        hint: "Rechne zuerst " + q.a + (q.op1 === "add" ? " + " : " − ") + q.b + "."
      });
    }
    if (first.n !== q.mid) {
      return stepPrefix(diagnoseCompute({
        kind: "compute", a: q.a, b: q.b, op: q.op1, answer: q.mid, reason: q.reason
      }, first.n), "Erster Schritt:");
    }
    if (second.empty) {
      return pack({
        code: "unfinished",
        help: "Der erste Schritt ist fertig. Es gibt noch einen zweiten.",
        turn: "Der erste Schritt ist fertig. Es gibt noch einen zweiten.",
        check: "Die Aufgabe ist noch nicht fertig. Es gibt noch einen zweiten Schritt.",
        hint: nextStep
      });
    }
    if (second.n === q.answer) return ok(q.reason);
    if (second.n === q.mid) {
      return pack({
        code: "unfinished",
        help: "Das ist noch einmal der erste Schritt. Die " + q.c + " hast du noch nicht verwendet.",
        turn: "Das wiederholt den ersten Schritt. Die zweite Zahl fehlt noch.",
        check: "Der zweite Schritt fehlt noch.",
        hint: nextStep
      });
    }
    return stepPrefix(diagnoseCompute({
      kind: "compute", a: q.mid, b: q.c, op: q.op2, answer: q.answer, reason: q.reason
    }, second.n), "Zweiter Schritt:");
  }

  function roundTo(n, unit) {
    return Math.round(n / unit) * unit;
  }

  function estimateFrom(q, unit) {
    var ra = roundTo(q.a, unit);
    var rb = roundTo(q.b, unit);
    return { ra: ra, rb: rb, value: q.op === "sub" ? ra - rb : ra + rb };
  }

  function diagnoseEstimate(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    var unit = q.roundTo;
    var unitWord = unit === 100 ? "Hunderter" : "Zehner";
    var opWord = q.op === "sub" ? "minus" : "plus";
    var sign = q.op === "sub" ? " − " : " + ";
    var main = estimateFrom(q, unit);
    var ra = main.ra;
    var rb = main.rb;
    if (given === main.value) return ok(q.reason || ("Mit gerundeten Zahlen: " + ra + sign + rb + "."));
    if (q.exact != null && given === q.exact && q.exact !== main.value) {
      return pack({
        code: "gave_exact",
        help: "Das ist das genaue Ergebnis. Für den Überschlag rundest du zuerst: " + q.a + " ist nah an " + ra + ", " + q.b + " ist nah an " + rb + ".",
        turn: "Das ist das genaue Ergebnis. Runde zuerst, dann rechne.",
        check: "Das ist das genaue Ergebnis, kein Überschlag.",
        hint: "Rechne mit " + ra + " und " + rb + "."
      });
    }
    if (unit === 100) {
      var finer = estimateFrom(q, 10);
      if (given === finer.value && finer.value !== q.exact) {
        return ok("Das ist ein sinnvoller Überschlag: " + finer.ra + sign + finer.rb + ". Mit Hundertern gerundet: " + ra + sign + rb + ".");
      }
    }
    var scale = Math.max(Math.abs(main.value), 1);
    if (given === 0 || given * 5 < scale || given > scale * 5) {
      return pack({
        code: "estimate_magnitude",
        column: "hundreds",
        help: q.a + " ist ungefähr " + ra + ". Der Überschlag muss ungefähr so groß sein.",
        turn: "Der Überschlag hat nicht die richtige Größe. Runde zuerst auf " + unitWord + ".",
        check: "Dieser Überschlag hat nicht die richtige Größe.",
        hint: q.a + " ist nah an " + ra + ". " + q.b + " ist nah an " + rb + "."
      });
    }
    var floorA = Math.floor(q.a / unit) * unit;
    var otherA = ra === floorA ? Math.ceil(q.a / unit) * unit : floorA;
    var floorB = Math.floor(q.b / unit) * unit;
    var otherB = rb === floorB ? Math.ceil(q.b / unit) * unit : floorB;
    if (otherA !== ra && given === (q.op === "sub" ? otherA - rb : otherA + rb)) {
      return pack({
        code: "estimate_near",
        help: q.a + " liegt näher an " + ra + " als an " + otherA + ".",
        turn: "Prüfe, welchem " + unitWord + " " + q.a + " näher liegt.",
        check: "Eine Zahl wurde in die falsche Richtung gerundet.",
        hint: q.a + " ist nah an " + ra + "."
      });
    }
    if (otherB !== rb && given === (q.op === "sub" ? ra - otherB : ra + otherB)) {
      return pack({
        code: "estimate_near",
        help: q.b + " liegt näher an " + rb + " als an " + otherB + ".",
        turn: "Prüfe, welchem " + unitWord + " " + q.b + " näher liegt.",
        check: "Eine Zahl wurde in die falsche Richtung gerundet.",
        hint: q.b + " ist nah an " + rb + "."
      });
    }
    return pack({
      code: "estimate_near",
      help: "Runde " + q.a + " und " + q.b + " auf " + unitWord + ". Dann rechne " + opWord + ".",
      turn: "Runde beide Zahlen auf " + unitWord + ", bevor du rechnest.",
      check: "Mit den gerundeten Zahlen kommt dieser Überschlag nicht heraus.",
      hint: q.a + " ist nah an " + ra + ". " + q.b + " ist nah an " + rb + "."
    });
  }

  function diagnoseInverse(q, givenRaw) {
    var parsed = parseDigits(givenRaw);
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var given = parsed.n;
    if (given === q.answer) return ok(q.reason || "Die Umkehraufgabe führt zur Zahl am Anfang zurück.");
    var back = q.checkOp === "sub"
      ? "Zieh einen Teil vom Ganzen ab. Dann muss der andere Teil herauskommen."
      : "Rechne dein Ergebnis plus die Zahl, die du abgezogen hast. Dann musst du wieder bei der Zahl am Anfang ankommen.";
    var check = q.checkOp === "sub"
      ? "Die Umkehraufgabe führt nicht zum anderen Teil zurück."
      : "Die Umkehraufgabe führt nicht zur Zahl am Anfang zurück.";
    if (given === q.result || given === q.other) {
      return pack({
        code: "inverse_mismatch",
        help: "Das ist einer der Teile. " + back,
        turn: "Das ist einer der Teile. Die Umkehraufgabe rechnet mit beiden.",
        check: check,
        hint: "Rechne die Umkehraufgabe in Schritten, zuerst die Zehner, dann die Einer."
      });
    }
    var step = diagnoseCompute({ kind: "compute", a: q.result, b: q.other, op: q.checkOp, answer: q.answer }, given);
    return pack({
      code: "inverse_mismatch",
      column: step.column,
      help: back + (step.column ? " Schau dir die " + PLACE[step.column] + " an." : ""),
      turn: check,
      check: check,
      hint: "Rechne die Umkehraufgabe in Schritten, zuerst die Zehner, dann die Einer."
    });
  }

  function storyHint(op) {
    return op === "add"
      ? "Die beiden Teile kommen zusammen. Das ist eine Plusaufgabe."
      : "Vom Ganzen wird ein Teil weggenommen. Das ist eine Minusaufgabe.";
  }

  function diagnoseDecide(q, given) {
    if (q.choose === false) {
      return diagnoseCompute({ kind: "compute", a: q.a, b: q.b, op: q.op, answer: q.answer, reason: q.reason }, given);
    }
    var choice = given && typeof given === "object" ? given.op : null;
    var parsed = parseDigits(given && typeof given === "object" ? given.value : given);
    if (!choice) {
      return pack({
        code: "empty",
        help: "Wähle zuerst „Add“ oder „Take away“.",
        turn: "Wähle zuerst „Add“ oder „Take away“.",
        check: "Du hast noch nicht gewählt: „Add“ oder „Take away“.",
        hint: storyHint(q.op)
      });
    }
    if (parsed.empty) return emptyResult();
    if (parsed.bad) return badResult();
    var n = parsed.n;
    if (n === q.answer && choice === q.op) return ok(q.reason);
    if (n === q.answer) {
      return pack({
        code: "decision",
        help: "Die Zahl stimmt. Lies die Geschichte noch einmal: Kommen Teile zusammen, oder wird etwas weggenommen?",
        turn: "Die Zahl stimmt. Kommen Teile zusammen, oder wird etwas weggenommen?",
        check: "Prüfe noch einmal: Kommen Teile zusammen, oder wird etwas weggenommen?",
        hint: storyHint(q.op)
      });
    }
    if (q.op === "sub" && n === q.a + q.b) {
      return pack({
        code: "wrong_operation",
        help: "In der Geschichte wird etwas weggenommen. Das Ergebnis muss kleiner als " + q.a + " sein.",
        turn: "Hier wird etwas weggenommen. Das ist eine Minusaufgabe.",
        check: "Das ist eine Minusgeschichte, und die beiden Zahlen wurden addiert.",
        hint: "Fang beim Ganzen an und nimm den Teil weg."
      });
    }
    if (q.op === "add" && n === q.a - q.b) {
      return pack({
        code: "wrong_operation",
        help: "Die beiden Teile kommen zusammen. Das Ergebnis muss größer sein als jeder Teil.",
        turn: "Die beiden Teile kommen zusammen. Das ist eine Plusaufgabe.",
        check: "In dieser Geschichte kommen zwei Teile zusammen, und das Ergebnis ist kleiner geworden.",
        hint: "Leg die beiden Teile zusammen."
      });
    }
    if (choice === q.op) {
      return diagnoseCompute({ kind: "compute", a: q.a, b: q.b, op: q.op, answer: q.answer, reason: q.reason }, n);
    }
    return pack({
      code: "wrong_operation",
      help: storyHint(q.op),
      turn: storyHint(q.op),
      check: q.op === "sub" ? "In dieser Geschichte wird etwas weggenommen." : "In dieser Geschichte kommen zwei Teile zusammen.",
      hint: q.op === "sub" ? "Fang beim Ganzen an und nimm den Teil weg." : "Leg die beiden Teile zusammen."
    });
  }

  function diagnoseExchange(q, givenYes) {
    var said = givenYes === true || givenYes === "yes" || givenYes === "Yes";
    var needed = needsExchange(q.a, q.b, q.op);
    var verb = q.op === "add" ? "bündeln" : "entbündeln";
    var passive = q.op === "add" ? "gebündelt" : "entbündelt";
    if (said === needed) {
      if (needed) {
        return ok(q.op === "add"
          ? "Ja. An einer Stelle kommen 10 oder mehr zusammen. Du musst bündeln."
          : "Ja. An einer Stelle ist oben zu wenig da. Du musst entbündeln.");
      }
      return ok(q.op === "add"
        ? "Nein. An keiner Stelle kommen 10 oder mehr zusammen."
        : "Nein. An jeder Stelle ist oben genug da.");
    }
    var cols = exchangeColumns(q.a, q.b, q.op);
    var aO = q.a % 10;
    var bO = q.b % 10;
    var aT = Math.floor(q.a / 10) % 10;
    var bT = Math.floor(q.b / 10) % 10;
    if (needed && !said) {
      var help = "An einer Stelle reicht es nicht. Ja, du musst " + verb + ".";
      var hint = "Schau dir zuerst die Einer an.";
      var column = "ones";
      if (q.op === "sub" && cols.ones) {
        help = "Von " + aO + " " + dat(aO, "Einer") + " kannst du nicht " + bO + " Einer abziehen. Ja, du musst entbündeln.";
        hint = "Entbündele 1 Zehner in 10 Einer.";
      } else if (q.op === "add" && cols.ones) {
        help = aO + " Einer + " + bO + " Einer sind mehr als 9 Einer. Ja, du musst bündeln.";
        hint = "Bündele 10 Einer zu 1 Zehner.";
      } else if (q.op === "sub" && cols.tens) {
        help = "Von " + aT + " " + dat(aT, "Zehner") + " kannst du nicht " + bT + " Zehner abziehen. Ja, du musst entbündeln.";
        hint = "Entbündele 1 Hunderter in 10 Zehner.";
        column = "tens";
      } else if (q.op === "add" && cols.tens) {
        help = "Die Zehner sind zusammen mehr als 9 Zehner. Ja, du musst bündeln.";
        hint = "Bündele 10 Zehner zu 1 Hunderter.";
        column = "tens";
      }
      return pack({
        code: "exchange_choice",
        column: column,
        help: help,
        turn: "Hier musst du " + verb + ".",
        check: "Hier muss " + passive + " werden.",
        hint: hint
      });
    }
    return pack({
      code: "exchange_choice",
      column: "ones",
      help: q.op === "add"
        ? "An keiner Stelle kommen 10 oder mehr zusammen. Du musst nicht bündeln."
        : "An jeder Stelle ist oben genug da. Du musst nicht entbündeln.",
      turn: "Hier musst du nicht " + verb + ".",
      check: "Hier muss nicht " + passive + " werden.",
      hint: "Vergleiche Stelle für Stelle, bei den Einern beginnend."
    });
  }

  function diagnosePlacement(spec) {
    var key = { H: "hundreds", T: "tens", O: "ones" };
    var right = key[spec.correct];
    var chosen = key[spec.chosen];
    var d = Number(spec.digit);
    if (spec.chosen === spec.correct) {
      return ok("Die " + spec.digit + " in " + spec.number + " " + (d === 1 ? "ist" : "sind") + " " + d + " " + NAME[right] + ".", right);
    }
    return pack({
      code: "wrong_column",
      column: right,
      help: "Die " + spec.digit + " in " + spec.number + " bedeutet " + d + " " + NAME[right] + ". Sie gehört zu den " + dat(2, NAME[right]) + ", in die Spalte " + spec.correct + ".",
      turn: "Die " + spec.digit + " in " + spec.number + " gehört nicht zu den " + dat(2, NAME[chosen]) + ".",
      check: "Die " + spec.digit + " in " + spec.number + " gehört nicht zu den " + dat(2, NAME[chosen]) + ".",
      hint: "Sie gehört in die Spalte " + spec.correct + "."
    });
  }

  function diagnose(q, given) {
    switch (q.kind) {
      case "bond": return diagnoseBond(q, given);
      case "complement": return diagnoseComplement(q, given);
      case "missingAdd": return diagnoseMissingAdd(q, given);
      case "missingSub": return diagnoseMissingSub(q, given);
      case "twoStep": return diagnoseTwoStep(q, given);
      case "estimate": return diagnoseEstimate(q, given);
      case "inverse": return diagnoseInverse(q, given);
      case "decide": return diagnoseDecide(q, given);
      case "exchange": return diagnoseExchange(q, given);
      default: return diagnoseCompute(q, given);
    }
  }

  return {
    diagnose: diagnose,
    diagnosePlacement: diagnosePlacement,
    diagnoseExchange: diagnoseExchange,
    needsExchange: needsExchange,
    exchangeColumns: exchangeColumns,
    PARENT: PARENT
  };
});
