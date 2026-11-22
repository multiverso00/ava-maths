(function () {
  "use strict";

  var KEY = "ava-maths-v1";
  var SITTING_MS = 12 * 60 * 1000;
  var AWAY_MS = 20 * 60 * 1000;
  var DEMO_MS = 1700;

  var STATION_NAMES = {
    see: "See how it works",
    help: "Try it with help",
    turn: "On your own",
    check: "Test time"
  };

  var INTROS = {
    see: "Watch how it works. Then you write the last answer.",
    help: "Have a go. If something goes wrong, I’ll show you where to look.",
    turn: "Now you do it. I’ll tell you what went wrong, and you fix it.",
    check: "Like the real test. I only say right or not yet."
  };

  var state = loadState();
  var ui = state.buddy ? "home" : "picker";
  var session = null;
  var demoTimer = null;
  var pendingFx = null;

  function loadState() {
    var raw = {
      correct: {},
      finished: {},
      mistakes: {},
      examples: {},
      visited: {},
      buddy: null,
      lastSeen: 0,
      sittingStarted: null
    };
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && typeof saved === "object") {
        raw.correct = saved.correct || {};
        raw.finished = saved.finished || {};
        raw.mistakes = saved.mistakes || {};
        raw.examples = saved.examples || {};
        raw.visited = saved.visited || {};
        raw.buddy = saved.buddy || null;
        raw.lastSeen = saved.lastSeen || 0;
        raw.sittingStarted = saved.sittingStarted || null;
      }
    } catch (error) {
      raw.finished = {};
    }
    var now = Date.now();
    var gap = raw.lastSeen ? now - raw.lastSeen : 0;
    raw.away = !!(raw.lastSeen && gap > AWAY_MS);
    if (!raw.lastSeen || gap > AWAY_MS) raw.sittingStarted = null;
    raw.lastSeen = now;
    return raw;
  }

  function saveState() {
    state.lastSeen = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify({
        correct: state.correct,
        finished: state.finished,
        mistakes: state.mistakes,
        examples: state.examples,
        visited: state.visited,
        buddy: state.buddy,
        lastSeen: state.lastSeen,
        sittingStarted: state.sittingStarted
      }));
    } catch (error) {
      return;
    }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function sign(op) {
    return op === "add" ? "+" : "−";
  }

  function findLesson(id) {
    var lessons = AvaLessons.LESSONS;
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === id) return lessons[i];
    }
    return null;
  }

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  // ---------- stars and stickers ----------

  function stationKey(lessonId, index) {
    return lessonId + ":" + index;
  }

  function stationFinished(lesson, index) {
    if (state.finished[stationKey(lesson.id, index)]) return true;
    return lesson.stations[index].items.every(function (item) { return !!state.correct[item.id]; });
  }

  function tonightFinished() {
    return !!state.finished.tonight ||
      AvaLessons.TONIGHT.every(function (item) { return !!state.correct[item.id]; });
  }

  function lessonComplete(lesson) {
    return lesson.stations.every(function (_, index) { return stationFinished(lesson, index); });
  }

  function starCount() {
    var n = tonightFinished() ? 1 : 0;
    AvaLessons.LESSONS.forEach(function (lesson) {
      lesson.stations.forEach(function (_, index) {
        if (stationFinished(lesson, index)) n += 1;
      });
    });
    return n;
  }

  function stickerCount() {
    return AvaLessons.LESSONS.filter(lessonComplete).length;
  }

  // ---------- practice logic ----------

  function recordMistake(code, item) {
    if (!code || code === "correct" || code === "empty" || code === "not_a_number") return;
    state.mistakes[code] = (state.mistakes[code] || 0) + 1;
    var list = state.examples[code] ? state.examples[code].slice() : [];
    var label = item.label || item.prompt || item.id;
    if (list.indexOf(label) === -1 && list.length < 3) list.push(label);
    state.examples[code] = list;
  }

  function takeRetrieval(currentId) {
    if (!state.away) return [];
    state.away = false;
    var pool = [];
    AvaLessons.LESSONS.forEach(function (lesson) {
      if (lesson.id === currentId || !state.visited[lesson.id]) return;
      lesson.stations.forEach(function (station) {
        if (station.fade === "see") return;
        station.items.forEach(function (item) {
          if (item.type === "column" || !state.correct[item.id]) return;
          pool.push(Object.assign({}, item, { fade: "turn", retrieval: true }));
        });
      });
    });
    return shuffle(pool).slice(0, 3);
  }

  function ensureSitting() {
    if (!state.sittingStarted) state.sittingStarted = Date.now();
  }

  function timeFraction() {
    if (!state.sittingStarted) return 0;
    return Math.min(1, (Date.now() - state.sittingStarted) / SITTING_MS);
  }

  function current() {
    return session.items[session.index];
  }

  function fadeOf(item) {
    return item.fade || "turn";
  }

  function messageFor(result, fade, misses) {
    if (result.correct) return result.reason;
    if (fade === "check") return result.check;
    if (fade === "turn") return result.turn;
    if (misses >= 3 && result.hint) return result.hint;
    return result.help;
  }

  function openingPhase(item) {
    if (item.type === "column" && item.place) return "place";
    if (item.type === "column" && item.askExchange) return "exchange";
    return "answer";
  }

  function placementSteps(item) {
    var steps = [];
    function add(number, which) {
      var text = String(number);
      var cols = ["H", "T", "O"].slice(3 - text.length);
      var slot = { H: 0, T: 1, O: 2 };
      for (var i = 0; i < text.length; i++) {
        steps.push({ which: which, number: number, digit: text.charAt(i), at: i, correct: cols[i], slot: slot[cols[i]] });
      }
    }
    add(item.a, "a");
    add(item.b, "b");
    return steps;
  }

  function stopDemo() {
    if (demoTimer) clearInterval(demoTimer);
    demoTimer = null;
  }

  function startDemo() {
    stopDemo();
    if (!session || !session.demo) return;
    session.demo.at = 0;
    session.demo.playing = true;
    paintMat();
    demoTimer = setInterval(function () {
      if (!session || !session.demo) return stopDemo();
      if (session.demo.at < session.demo.steps.length - 1) {
        session.demo.at += 1;
        paintMat();
      } else {
        session.demo.playing = false;
        stopDemo();
        paintMat();
      }
    }, DEMO_MS);
  }

  function armItem() {
    var item = current();
    var fade = fadeOf(item);
    stopDemo();
    session.misses = 0;
    session.draft = "";
    session.draft2 = "";
    session.focus = "first";
    session.opChoice = null;
    session.feedback = null;
    session.locked = false;
    session.justRight = false;
    session.phase = openingPhase(item);
    session.steps = item.type === "column" && item.place ? placementSteps(item) : [];
    session.placeAt = 0;
    session.grid = { a: ["", "", ""], b: ["", "", ""] };
    session.answerCols = ["", "", ""];
    session.mat = fade === "check" ? null : AvaBlocks.modelFor(item);
    session.matOpen = fade === "help" || fade === "see";
    session.demo = session.mat && fade === "see" ? { steps: AvaBlocks.demoSteps(item), at: 0, playing: true } : null;
  }

  function writingColumns() {
    if (!session || session.phase !== "answer") return false;
    var item = current();
    return item.type === "column" && !!item.place;
  }

  function syncAnswerDraft() {
    session.draft = session.answerCols.join("");
  }

  function nextAnswerIndex() {
    var cols = session.answerCols || ["", "", ""];
    if (cols[2] === "") return 2;
    if (cols[1] === "") return 1;
    if (cols[0] === "") return 0;
    return -1;
  }

  function startRun(items, meta) {
    ensureSitting();
    ui = "practice";
    session = {
      title: meta.title,
      lessonId: meta.lessonId,
      stationName: meta.stationName,
      stationIndex: meta.stationIndex,
      key: meta.key,
      wasFinished: meta.wasFinished,
      hadSticker: meta.hadSticker,
      items: items,
      index: 0,
      done: false
    };
    armItem();
    saveState();
    render();
    if (session.demo) startDemo();
  }

  function startStation(lesson, stationIndex) {
    state.visited[lesson.id] = true;
    var station = lesson.stations[stationIndex];
    var retrieval = takeRetrieval(lesson.id);
    var items = retrieval.concat(station.items.map(function (item) {
      return Object.assign({}, item, { fade: station.fade });
    }));
    startRun(items, {
      title: lesson.title,
      lessonId: lesson.id,
      stationName: STATION_NAMES[station.fade],
      stationIndex: stationIndex,
      key: stationKey(lesson.id, stationIndex),
      wasFinished: stationFinished(lesson, stationIndex),
      hadSticker: lessonComplete(lesson)
    });
  }

  function startTonight() {
    state.visited.tonight = true;
    var retrieval = takeRetrieval("tonight");
    var items = retrieval.concat(AvaLessons.TONIGHT.map(function (item) { return Object.assign({}, item); }));
    startRun(items, {
      title: "Test practice",
      lessonId: "tonight",
      stationName: "15 minutes",
      stationIndex: 0,
      key: "tonight",
      wasFinished: tonightFinished(),
      hadSticker: false
    });
  }

  function gather(item) {
    if (item.kind === "twoStep") return { first: session.draft, second: session.draft2 };
    if (item.kind === "decide" && item.choose !== false) return { op: session.opChoice, value: session.draft };
    return session.draft;
  }

  function submit() {
    if (!session || session.done || session.phase !== "answer") return;
    if (session.locked) {
      next();
      return;
    }
    var item = current();
    var result = AvaDiagnose.diagnose(item, gather(item));
    if (result.correct) {
      if (!item.retrieval) state.correct[item.id] = true;
      session.locked = true;
      session.justRight = true;
      session.feedback = { tone: "good", column: result.column, text: result.reason };
    } else {
      session.misses += 1;
      recordMistake(result.code, item);
      session.feedback = { tone: "retry", column: result.column, text: messageFor(result, fadeOf(item), session.misses) };
    }
    saveState();
    render();
  }

  function finishRun() {
    stopDemo();
    session.done = true;
    session.newStar = !session.wasFinished;
    state.finished[session.key] = true;
    var lesson = findLesson(session.lessonId);
    session.newSticker = !!(lesson && !session.hadSticker && lessonComplete(lesson));
    pendingFx = { star: session.newStar, sticker: session.newSticker };
    saveState();
    render();
  }

  function next() {
    if (!session) return;
    session.index += 1;
    if (session.index >= session.items.length) {
      finishRun();
      return;
    }
    armItem();
    render();
    if (session.demo) startDemo();
  }

  function skip() {
    if (!session || session.locked || session.done) return;
    next();
  }

  function typeDigit(digit) {
    if (!session || session.done || session.locked || session.phase !== "answer") return;
    var item = current();
    if (writingColumns()) {
      var at = nextAnswerIndex();
      if (at === -1) return;
      session.answerCols[at] = digit;
      syncAnswerDraft();
    } else if (item.kind === "twoStep" && session.focus === "second") {
      if (session.draft2.length >= 5) return;
      session.draft2 += digit;
    } else {
      if (session.draft.length >= 5) return;
      session.draft += digit;
    }
    session.feedback = null;
    render();
  }

  function backspace() {
    if (!session || session.done || session.locked || session.phase !== "answer") return;
    var item = current();
    if (writingColumns()) {
      var cols = session.answerCols;
      if (cols[0] !== "") cols[0] = "";
      else if (cols[1] !== "") cols[1] = "";
      else cols[2] = "";
      syncAnswerDraft();
    } else if (item.kind === "twoStep" && session.focus === "second") {
      session.draft2 = session.draft2.slice(0, -1);
    } else {
      session.draft = session.draft.slice(0, -1);
    }
    session.feedback = null;
    render();
  }

  function chooseColumn(col) {
    if (!session || session.phase !== "place" || session.locked) return;
    var item = current();
    var step = session.steps[session.placeAt];
    var result = AvaDiagnose.diagnosePlacement({ number: step.number, digit: step.digit, correct: step.correct, chosen: col });
    if (result.correct) {
      session.grid[step.which][step.slot] = step.digit;
      session.placeAt += 1;
      session.feedback = null;
      session.misses = 0;
      if (session.placeAt >= session.steps.length) session.phase = item.askExchange ? "exchange" : "answer";
    } else {
      session.misses += 1;
      recordMistake(result.code, item);
      session.feedback = { tone: "retry", column: result.column, text: messageFor(result, fadeOf(item), session.misses) };
    }
    saveState();
    render();
  }

  function chooseExchange(yes) {
    if (!session || session.phase !== "exchange" || session.locked) return;
    var item = current();
    var result = AvaDiagnose.diagnoseExchange({ a: item.a, b: item.b, op: item.op }, yes ? "yes" : "no");
    if (result.correct) {
      session.phase = "answer";
      session.misses = 0;
      session.feedback = { tone: "good", column: null, text: result.reason };
    } else {
      session.misses += 1;
      recordMistake(result.code, item);
      session.feedback = { tone: "retry", column: result.column, text: messageFor(result, fadeOf(item), session.misses) };
    }
    saveState();
    render();
  }

  function chooseOp(op) {
    if (!session || session.locked || session.phase !== "answer") return;
    session.opChoice = op;
    session.feedback = null;
    render();
  }

  function canSkip() {
    if (!session.feedback || session.feedback.tone === "good" || session.locked) return false;
    var fade = fadeOf(current());
    if (fade === "check") return session.misses >= 2;
    if (fade === "turn") return session.misses >= 3;
    return session.misses >= 4;
  }

  // ---------- question pieces ----------

  function blank(which) {
    var field = which || "first";
    var value = field === "second" ? session.draft2 : session.draft;
    var active = current().kind === "twoStep" && (session.focus || "first") === field ? " active" : "";
    var good = session.locked ? " good" : "";
    var shown = value === "" ? '<span class="ghost-digit">?</span>' : esc(value);
    return '<button type="button" class="blank' + active + good + '" data-act="focus" data-focus="' +
      field + '" aria-label="Your answer">' + shown + "</button>";
  }

  function lineHTML(worked) {
    if (!worked || !worked.line) return "";
    return '<div class="nline"><span class="pt">' + worked.line.start + '</span><span class="jump">' +
      esc(worked.line.jump1) + '</span><span class="pt">' + worked.line.mid + '</span><span class="jump">' +
      esc(worked.line.jump2) + '</span><span class="pt">?</span></div>';
  }

  function stepsHTML(item, fade) {
    if (!item.worked || fade !== "see" || !item.worked.lines) return "";
    var html = '<ol class="steps" lang="de">';
    item.worked.lines.forEach(function (line) { html += "<li>" + esc(line) + "</li>"; });
    return html + "</ol>";
  }

  function barsHTML(bars) {
    if (bars.kind === "join") {
      return '<div class="bars"><div class="bar"><span class="a" style="flex:' + bars.a + '">' + bars.a +
        '</span><span class="b" style="flex:' + bars.b + '">' + bars.b +
        '</span></div><div class="bar whole"><span>?</span></div></div>';
    }
    return '<div class="bars"><div class="bar whole"><span>' + bars.whole +
      '</span></div><div class="bar"><span class="a" style="flex:' + bars.part + '">' + bars.part +
      '</span><span class="miss" style="flex:1">?</span></div></div>';
  }

  function digitsAligned(number) {
    var text = String(number);
    var slots = ["", "", ""];
    var cols = ["H", "T", "O"].slice(3 - text.length);
    var index = { H: 0, T: 1, O: 2 };
    for (var i = 0; i < text.length; i++) slots[index[cols[i]]] = text.charAt(i);
    return slots;
  }

  function methodTop(number) {
    var slots = digitsAligned(number);
    var tens = Number(slots[1] || "0");
    var ones = Number(slots[2] || "0");
    slots[1] = '<span class="crossed">' + tens + '</span><sup>' + (tens - 1) + "</sup>";
    slots[2] = '<span class="exchanged">' + (10 + ones) + "</span>";
    return slots;
  }

  function sheetRow(gutter, slots, hot, isAnswer, nextIndex) {
    var names = ["h", "t", "o"];
    var html = '<span class="gutter">' + gutter + "</span>";
    for (var i = 0; i < 3; i++) {
      var mark = isAnswer && hot === names[i] ? " hot" : "";
      if (isAnswer && nextIndex === i) mark += " next";
      html += '<span class="cell ' + names[i] + mark + '">' + (slots[i] || "") + "</span>";
    }
    return html;
  }

  function gridHTML(item) {
    var column = session.feedback && session.feedback.tone === "retry" ? session.feedback.column : null;
    var hot = { hundreds: "h", tens: "t", ones: "o" }[column] || "";
    var top = item.method === "sub-exchange" ? methodTop(item.a) : (item.place ? session.grid.a : digitsAligned(item.a));
    var bottom = item.place && item.method !== "sub-exchange" ? session.grid.b : digitsAligned(item.b);
    var names = ["h", "t", "o"];
    var letters = ["H", "T", "O"];
    var html = '<div class="sheet">';
    html += "<span></span>";
    for (var i = 0; i < 3; i++) {
      html += '<span class="head ' + names[i] + (hot === names[i] ? " hot" : "") + '">' + letters[i] + "</span>";
    }
    html += sheetRow("", top, hot, false);
    html += sheetRow(sign(item.op), bottom, hot, false);
    if (session.phase === "answer" && item.place) {
      html += '<span class="rule"></span>';
      html += sheetRow("", session.answerCols || ["", "", ""], hot, true, nextAnswerIndex());
    }
    return html + "</div>";
  }

  function equationHTML(item) {
    if (item.kind === "bond" || item.kind === "complement" || item.kind === "missingAdd") {
      return '<p class="equation">' + item.known + " + " + blank("first") + " = " + item.target + "</p>";
    }
    if (item.kind === "missingSub") {
      return '<p class="equation">' + item.start + " − " + blank("first") + " = " + item.result + "</p>";
    }
    if (item.kind === "inverse") {
      return '<p class="equation">' + item.result + " " + sign(item.checkOp) + " " + item.other + " = " + blank("first") + "</p>";
    }
    return '<p class="equation">' + item.a + " " + sign(item.op) + " " + item.b + " = " + blank("first") + "</p>";
  }

  function twoStepHTML(item) {
    return '<p class="equation">' + item.a + " " + sign(item.op1) + " " + item.b + " = " + blank("first") + "</p>" +
      '<p class="equation small">then ' + sign(item.op2) + " " + item.c + " = " + blank("second") + "</p>";
  }

  function keypadHTML() {
    var html = '<div class="keys">';
    for (var n = 1; n <= 9; n++) html += '<button type="button" data-act="digit" data-digit="' + n + '">' + n + "</button>";
    html += '<button type="button" class="minor" data-act="backspace" aria-label="Delete">⌫</button>';
    html += '<button type="button" class="wide" data-act="digit" data-digit="0">0</button>';
    html += "</div>";
    html += session.locked
      ? '<button type="button" class="go next-btn" data-act="next">Next →</button>'
      : '<button type="button" class="go" data-act="submit">Check</button>';
    return html;
  }

  function matHTML(item, fade) {
    if (!session.mat) return "";
    if (fade === "turn" && !session.matOpen) {
      return '<div class="mat-toggle"><button type="button" class="soft" data-act="mat-open">Use blocks</button></div>';
    }
    var html = '<div class="mat-card"><div id="mat-slot"></div>';
    if (session.demo) {
      html += '<div class="mat-actions">' +
        '<button type="button" class="soft" data-act="demo-replay">Play again</button>' +
        '<button type="button" class="soft" data-act="demo-try">Try it yourself</button></div>';
    } else if (fade === "turn") {
      html += '<div class="mat-actions"><button type="button" class="soft" data-act="mat-close">Hide blocks</button>' +
        '<button type="button" class="soft" data-act="mat-reset">Start again</button></div>';
    } else {
      html += '<div class="mat-actions"><button type="button" class="soft" data-act="mat-reset">Start again</button></div>';
    }
    return html + "</div>";
  }

  function paintMat() {
    var slot = document.getElementById("mat-slot");
    if (!slot || !session || !session.mat) return;
    var fade = fadeOf(current());
    if (session.demo && (session.demo.playing || !session.demo.trying)) {
      var step = session.demo.steps[session.demo.at];
      AvaBlocks.mount(slot, step.model, { interactive: false, counts: true, caption: step.say });
      return;
    }
    AvaBlocks.mount(slot, session.mat, {
      interactive: true,
      counts: fade !== "turn",
      hints: fade === "help" || fade === "see",
      onChange: function (model) { session.mat = model; }
    });
  }

  function buddyHTML(mood, look, text, tone, lang) {
    var bubbleClass = "bubble" + (tone ? " " + tone : "");
    return '<div class="buddy-row"><div class="buddy mood-' + mood + (look ? " look-" + look : "") + '">' +
      AvaBuddy.svg(state.buddy) + '</div><div class="' + bubbleClass + '" role="status"' + (lang ? ' lang="' + lang + '"' : "") +
      "><p>" + esc(text) + "</p></div></div>";
  }

  function practiceBuddy(item, fade) {
    if (session.feedback) {
      var good = session.feedback.tone === "good";
      return buddyHTML(good ? "happy" : "think", good ? "" : session.feedback.column, session.feedback.text, good ? "good" : "retry", "de");
    }
    var intro = item.retrieval ? "Three quick ones from last time first." : INTROS[fade];
    return buddyHTML("idle", "", intro, "", "en");
  }

  function renderQuestion(item, fade) {
    var html = '<section class="qcard">';
    html += stepsHTML(item, fade);
    if (fade === "see") html += lineHTML(item.worked);
    if (item.story) html += '<p class="story">' + esc(item.story) + "</p>";
    if (item.bars && (fade === "see" || fade === "help")) html += barsHTML(item.bars);
    if (item.lead) html += '<p class="lead">' + esc(item.lead) + "</p>";

    var columnScreen = item.type === "column" && !item.paper;
    if (columnScreen) {
      html += '<p class="legend"><span class="h">H hundreds</span><span class="t">T tens</span><span class="o">O ones</span></p>';
      if (session.phase === "place" || session.phase === "exchange") {
        html += '<p class="quiet-sum">' + item.a + " " + sign(item.op) + " " + item.b + "</p>";
      }
      html += gridHTML(item);
      if (session.phase === "answer" && item.place && !session.locked) {
        var writeLine = ["Jetzt die Hunderter.", "Jetzt die Zehner.", "Du beginnst bei den Einern."][nextAnswerIndex()];
        if (writeLine) html += '<p class="ask" lang="de">' + writeLine + "</p>";
      }
    }

    if (session.phase === "place") {
      var step = session.steps[session.placeAt];
      var text = String(step.number);
      var shown = "";
      for (var i = 0; i < text.length; i++) {
        shown += i === step.at ? '<span class="mark">' + text.charAt(i) + "</span>" : text.charAt(i);
      }
      html += '<p class="ask">Where does the underlined digit go?</p><p class="ask-num">' + shown + "</p>";
      html += "</section>" + matHTML(item, fade) + practiceBuddy(item, fade);
      html += '<div class="cols3">' +
        '<button type="button" class="h" data-act="col" data-col="H">H</button>' +
        '<button type="button" class="t" data-act="col" data-col="T">T</button>' +
        '<button type="button" class="o" data-act="col" data-col="O">O</button></div>';
      return html;
    }
    if (session.phase === "exchange") {
      html += '<p class="ask">Do you need an exchange?</p>';
      html += "</section>" + matHTML(item, fade) + practiceBuddy(item, fade);
      html += '<div class="choice">' +
        '<button type="button" data-act="exchange" data-yes="yes">Yes</button>' +
        '<button type="button" data-act="exchange" data-yes="no">No</button></div>';
      return html;
    }

    if (item.paper) html += '<p class="paper-note">Work it out in your notebook, then type the answer.</p>';

    if (item.kind === "decide" && item.choose !== false) {
      html += '<div class="choice">' +
        '<button type="button"' + (session.opChoice === "add" ? ' class="picked"' : "") + ' data-act="op" data-op="add">Add</button>' +
        '<button type="button"' + (session.opChoice === "sub" ? ' class="picked"' : "") + ' data-act="op" data-op="sub">Take away</button></div>';
      html += '<p class="howmany">How many? ' + blank("first") + "</p>";
    } else if (item.kind === "twoStep") {
      html += twoStepHTML(item);
    } else if (item.kind === "estimate") {
      html += '<p class="equation">' + item.a + " " + sign(item.op) + " " + item.b + "</p>";
      html += '<p class="howmany">Estimate: ' + blank("first") + "</p>";
    } else if (!(columnScreen && item.place)) {
      html += equationHTML(item);
    }
    html += "</section>";
    html += matHTML(item, fade);
    html += practiceBuddy(item, fade);
    html += keypadHTML();
    return html;
  }

  function dotsHTML() {
    if (session.items.length < 2) return "";
    var html = '<p class="dots" aria-label="Question ' + (session.index + 1) + " of " + session.items.length + '">';
    for (var i = 0; i < session.items.length; i++) {
      html += '<i class="' + (i === session.index ? "on" : (i < session.index ? "done" : "")) + '"></i>';
    }
    return html + "</p>";
  }

  function timeHTML() {
    var fraction = timeFraction();
    return '<div class="time"><div class="track"><span id="time-fill" style="width:' + (fraction * 100) +
      '%"></span></div><p class="note" id="time-note">' + (fraction >= 1 ? "Good time for a break." : "") + "</p></div>";
  }

  function topBar(eyebrow, title, count) {
    return '<header class="topbar"><button type="button" class="back" data-act="home">← Trail</button>' +
      '<div class="topbar-title"><p class="eyebrow">' + esc(eyebrow) + "</p><h1>" + esc(title) + "</h1></div>" +
      '<span class="star-pill" id="star-count">★ ' + count + "</span></header>";
  }

  // ---------- screens ----------

  var STONE_ICONS = ["1", "2", "3", "4"];

  function trailSVG(count) {
    var h = count * 100;
    var d = "M 30 40";
    for (var i = 1; i < count; i++) {
      var x = i % 2 === 0 ? 30 : 70;
      var px = (i - 1) % 2 === 0 ? 30 : 70;
      var y = 40 + i * 100;
      d += " C " + px + " " + (y - 55) + ", " + x + " " + (y - 45) + ", " + x + " " + y;
    }
    return '<svg class="trail-line" viewBox="0 0 100 ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="#c9b99a" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  function renderHome() {
    var buddy = AvaBuddy.find(state.buddy);
    var html = '<div class="wrap home">';
    html += '<header class="home-top"><div><p class="eyebrow">Hi Ava</p><h1>Ava’s Maths Trail</h1>' +
      '<p class="lede">Adding and taking away, one step at a time.</p></div>' +
      '<button type="button" class="star-pill big" data-act="stickers">★ ' + starCount() + '<small>Stickers ' + stickerCount() + "/6</small></button></header>";
    html += buddyHTML("idle", "", "Pick a step on the trail. Every step you finish gives you a star.", "", "en");
    html += '<p class="buddy-change"><button type="button" class="linkish" data-act="change-buddy">Change buddy (' + esc(buddy.name) + ")</button></p>";
    html += '<section class="tonight"><div><p class="kicker">Before the test</p><h2>Test practice, 15 minutes</h2>' +
      "<p>Mixed questions, like the real test.</p></div>" +
      '<button type="button" class="go" data-act="start-tonight">' + (tonightFinished() ? "★ Play again" : "Start") + "</button></section>";
    html += '<ol class="trail">' + trailSVG(AvaLessons.LESSONS.length);
    AvaLessons.LESSONS.forEach(function (lesson, li) {
      var complete = lessonComplete(lesson);
      html += '<li class="stop ' + (li % 2 === 0 ? "left" : "right") + (complete ? " complete" : "") + '">';
      html += '<div class="stop-badge">' + (complete ? AvaBuddy.sticker(lesson.id) : "<span>" + lesson.number + "</span>") + "</div>";
      html += '<div class="stop-card"><h2>' + esc(lesson.title) + '</h2><p class="blurb">' + esc(lesson.blurb) + "</p>";
      html += '<div class="stones">';
      lesson.stations.forEach(function (station, index) {
        var done = stationFinished(lesson, index);
        html += '<button type="button" class="stone' + (done ? " done" : "") + '" data-act="start-lesson" data-lesson="' +
          lesson.id + '" data-station="' + index + '"><span class="stone-dot">' + (done ? "★" : STONE_ICONS[index]) +
          '</span><span class="stone-name">' + esc(STATION_NAMES[station.fade]) + "</span></button>";
      });
      html += "</div></div></li>";
    });
    html += "</ol>";
    html += '<p class="foot"><button type="button" class="linkish" data-act="parent">For grown-ups</button></p></div>';
    return html;
  }

  function renderPicker() {
    var html = '<div class="wrap picker"><p class="eyebrow">Hi Ava</p><h1>Pick a buddy</h1>' +
      '<p class="lede">Your buddy walks the trail with you and helps when something goes wrong.</p><div class="buddy-cards">';
    AvaBuddy.LIST.forEach(function (b) {
      html += '<button type="button" class="buddy-card' + (state.buddy === b.id ? " picked" : "") + '" data-act="pick-buddy" data-buddy="' + b.id + '">' +
        '<span class="buddy mood-idle">' + AvaBuddy.svg(b.id) + "</span><strong>" + esc(b.name) + "</strong></button>";
    });
    html += "</div>";
    if (state.buddy) html += '<p class="foot"><button type="button" class="linkish" data-act="home">Back to the trail</button></p>';
    return html + "</div>";
  }

  function renderStickers() {
    var html = '<div class="wrap stickers">' + topBar("Your stickers", "Sticker book", starCount());
    html += '<p class="lede">Finish all four steps of a stop to get its sticker.</p><div class="sticker-grid">';
    AvaLessons.LESSONS.forEach(function (lesson) {
      var got = lessonComplete(lesson);
      html += '<div class="sticker-slot' + (got ? " got" : "") + '">' +
        (got ? AvaBuddy.sticker(lesson.id) : '<span class="mystery">?</span>') +
        "<strong>" + esc(got ? AvaBuddy.STICKERS[lesson.id].name : lesson.title) + "</strong>" +
        (got ? "" : "<small>Finish this stop</small>") + "</div>";
    });
    return html + "</div></div>";
  }

  function renderParent() {
    var codes = Object.keys(state.mistakes).filter(function (code) {
      return state.mistakes[code] >= 2 && AvaDiagnose.PARENT[code];
    });
    codes.sort(function (a, b) { return state.mistakes[b] - state.mistakes[a]; });
    var html = '<div class="wrap parent"><button type="button" class="back" data-act="home">← Trail</button>';
    html += '<p class="eyebrow">For grown-ups</p><h1>Repeated slips</h1>';
    html += '<p class="lede">A kind of mistake is listed here once it has happened twice. It is a note, not a mark.</p>';
    if (!codes.length) html += '<p class="quiet">Nothing has repeated yet.</p>';
    codes.forEach(function (code) {
      var examples = (state.examples[code] || []).join(", ");
      html += '<article class="slip"><strong>' + esc(AvaDiagnose.PARENT[code]) + "</strong><span>" +
        state.mistakes[code] + " times" + (examples ? ". " + esc(examples) : "") + "</span></article>";
    });
    if (Object.keys(state.mistakes).length) {
      html += '<p class="foot"><button type="button" class="linkish" data-act="clear-log">Clear this list</button></p>';
    }
    html += '<p class="quiet">Stars: ' + starCount() + ". Stickers: " + stickerCount() + " of 6. Progress stays in this browser, on this computer.</p></div>";
    return html;
  }

  function renderPractice() {
    var item = current();
    var fade = fadeOf(item);
    var eyebrow = item.retrieval ? "Warm-up" : session.title;
    var title = item.retrieval ? "3 from last time" : session.stationName;
    var html = '<div class="wrap practice">' + topBar(eyebrow, title, starCount());
    html += dotsHTML();
    html += renderQuestion(item, fade);
    if (canSkip()) html += '<button type="button" class="leave" data-act="skip">Skip for now</button>';
    html += timeHTML();
    return html + "</div>";
  }

  function renderDone() {
    var lesson = findLesson(session.lessonId);
    var station = lesson ? lesson.stations[session.stationIndex] : null;
    var isTest = !lesson || (station && station.fade === "check");
    var shownStars = starCount() - (pendingFx && pendingFx.star ? 1 : 0);
    var html = '<div class="wrap done">' + topBar(session.title, session.stationName, shownStars);
    html += '<section class="done-card">';
    html += '<div class="buddy mood-dance">' + AvaBuddy.svg(state.buddy) + "</div>";
    html += "<h2>" + (isTest ? "Test time done." : "You finished this step.") + "</h2>";
    if (session.newStar) html += '<div class="big-star" id="big-star">★</div><p>You got a new star.</p>';
    else html += "<p>You already had the star for this one. Practice still counts.</p>";
    if (session.newSticker) {
      html += '<div class="new-sticker">' + AvaBuddy.sticker(lesson.id) + "<p>New sticker: <strong>" +
        esc(AvaBuddy.STICKERS[lesson.id].name) + '</strong></p><button type="button" class="soft" data-act="stickers">Open the sticker book</button></div>';
    }
    if (isTest) html += '<p class="quiet">Good time for a break.</p>';
    html += '<div class="end-actions">';
    if (lesson && session.stationIndex + 1 < lesson.stations.length) {
      var upcoming = lesson.stations[session.stationIndex + 1];
      html += '<button type="button" class="go" data-act="start-lesson" data-lesson="' + lesson.id +
        '" data-station="' + (session.stationIndex + 1) + '">Next: ' + esc(STATION_NAMES[upcoming.fade]) + "</button>";
    }
    html += '<button type="button" class="linkish" data-act="home">Back to the trail</button></div>';
    html += "</section>" + timeHTML() + "</div>";
    return html;
  }

  function runEffects() {
    if (session && session.justRight) {
      session.justRight = false;
      AvaCelebrate.burst(document.querySelector(".blank.good") || document.querySelector(".sheet") || document.querySelector(".bubble"));
    }
    if (pendingFx && ui === "practice" && session && session.done) {
      var fx = pendingFx;
      pendingFx = null;
      AvaCelebrate.confetti(1500);
      if (fx.star) {
        var counter = document.getElementById("star-count");
        AvaCelebrate.flyStar(document.getElementById("big-star"), counter, function () {
          if (counter) counter.textContent = "★ " + starCount();
        });
      }
    }
  }

  function render() {
    var app = document.getElementById("app");
    if (ui === "picker") app.innerHTML = renderPicker();
    else if (ui === "parent") app.innerHTML = renderParent();
    else if (ui === "stickers") app.innerHTML = renderStickers();
    else if (ui === "practice" && session) app.innerHTML = session.done ? renderDone() : renderPractice();
    else app.innerHTML = renderHome();
    if (ui === "practice" && session && !session.done) paintMat();
    runEffects();
  }

  function tickTime() {
    var fill = document.getElementById("time-fill");
    var note = document.getElementById("time-note");
    if (!fill) return;
    var fraction = timeFraction();
    fill.style.width = (fraction * 100) + "%";
    if (note) note.textContent = fraction >= 1 ? "Good time for a break." : "";
  }

  function goHome() {
    stopDemo();
    pendingFx = null;
    ui = "home";
    session = null;
    render();
    window.scrollTo(0, 0);
  }

  function onClick(event) {
    var button = event.target.closest ? event.target.closest("[data-act]") : null;
    if (!button) return;
    var act = button.getAttribute("data-act");
    if (act === "home") goHome();
    else if (act === "parent" || act === "stickers") {
      stopDemo();
      ui = act;
      session = null;
      render();
      window.scrollTo(0, 0);
    } else if (act === "change-buddy") {
      ui = "picker";
      render();
    } else if (act === "pick-buddy") {
      state.buddy = button.getAttribute("data-buddy");
      saveState();
      goHome();
    } else if (act === "start-tonight") {
      startTonight();
      window.scrollTo(0, 0);
    } else if (act === "start-lesson") {
      var lesson = findLesson(button.getAttribute("data-lesson"));
      if (lesson) {
        startStation(lesson, Number(button.getAttribute("data-station")));
        window.scrollTo(0, 0);
      }
    } else if (act === "digit") typeDigit(button.getAttribute("data-digit"));
    else if (act === "backspace") backspace();
    else if (act === "submit") submit();
    else if (act === "next") next();
    else if (act === "skip") skip();
    else if (act === "col") chooseColumn(button.getAttribute("data-col"));
    else if (act === "exchange") chooseExchange(button.getAttribute("data-yes") === "yes");
    else if (act === "op") chooseOp(button.getAttribute("data-op"));
    else if (act === "focus") {
      if (session && !session.locked && !session.done) {
        session.focus = button.getAttribute("data-focus") || "first";
        render();
      }
    } else if (act === "mat-open" || act === "mat-close") {
      session.matOpen = act === "mat-open";
      render();
    } else if (act === "mat-reset") {
      session.mat = AvaBlocks.modelFor(current());
      paintMat();
    } else if (act === "demo-replay") {
      session.demo.trying = false;
      startDemo();
    } else if (act === "demo-try") {
      stopDemo();
      session.demo.playing = false;
      session.demo.trying = true;
      session.mat = AvaBlocks.modelFor(current());
      paintMat();
    } else if (act === "clear-log") {
      state.mistakes = {};
      state.examples = {};
      saveState();
      render();
    }
  }

  function onKey(event) {
    if (ui !== "practice" || !session || session.done) return;
    if (event.key === "Enter") {
      var target = event.target;
      if (target && target.closest && target.closest("[data-act='submit'], [data-act='next']")) return;
      event.preventDefault();
      if (session.locked) next();
      else submit();
      return;
    }
    if (session.phase !== "answer") return;
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      typeDigit(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      backspace();
    }
  }

  document.getElementById("app").addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  setInterval(tickTime, 4000);
  render();
})();
