(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AvaLessons = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function sign(op) {
    return op === "add" ? "+" : "−";
  }

  function compute(id, op, a, b, answer, extra) {
    return Object.assign({
      id: id,
      type: "fill",
      kind: "compute",
      op: op,
      a: a,
      b: b,
      answer: answer,
      label: a + " " + sign(op) + " " + b,
      prompt: a + " " + sign(op) + " " + b + " = □"
    }, extra || {});
  }

  function column(id, op, a, b, answer, extra) {
    var item = compute(id, op, a, b, answer, extra);
    item.type = "column";
    return item;
  }

  var LESSONS = [
    {
      id: "bonds",
      number: 1,
      title: "Bonds",
      blurb: "Partners to 10, and complements to 100.",
      stations: [
        {
          id: "see",
          title: "See the rule",
          fade: "see",
          items: [
            {
              id: "bonds-see-1",
              type: "fill",
              kind: "bond",
              known: 4,
              target: 10,
              answer: 6,
              label: "4 + □ = 10",
              prompt: "4 + □ = 10",
              reason: "4 und 6 ergeben 10.",
              worked: {
                lines: [
                  "Im Zehnerfeld liegen 4. Bis 10 sind noch Felder frei.",
                  "Ins Kästchen gehört, was von 4 bis 10 fehlt."
                ],
                frame: 4
              }
            },
            compute("bonds-see-2", "add", 30, 20, 50, {
              changes: "tens",
              reason: "3 + 2 = 5, also 3 Zehner + 2 Zehner = 5 Zehner.",
              worked: {
                lines: [
                  "3 + 2 = 5.",
                  "30 sind 3 Zehner. 20 sind 2 Zehner.",
                  "Die kleine Aufgabe hilft bei der großen: Du rechnest mit Zehnern wie mit Einern."
                ]
              }
            }),
            {
              id: "bonds-see-3",
              type: "fill",
              kind: "complement",
              known: 64,
              target: 100,
              answer: 36,
              label: "64 + □ = 100",
              prompt: "64 + □ = 100",
              reason: "Von 64 bis 70 sind es 6, von 70 bis 100 sind es 3 Zehner.",
              worked: {
                lines: [
                  "Ergänze zuerst bis zum nächsten glatten Zehner: von 64 bis 70 sind es 6.",
                  "Dann ergänze von 70 bis 100. Das sind 3 Zehner.",
                  "Zusammen: 3 Zehner und 6 Einer."
                ]
              }
            }
          ]
        },
        {
          id: "help",
          title: "With help",
          fade: "help",
          items: [
            {
              id: "bonds-help-1",
              type: "fill",
              kind: "bond",
              known: 9,
              target: 10,
              answer: 1,
              label: "9 + □ = 10",
              prompt: "9 + □ = 10",
              reason: "9 und 1 ergeben 10."
            },
            {
              id: "bonds-help-2",
              type: "fill",
              kind: "missingSub",
              start: 10,
              result: 3,
              answer: 7,
              label: "10 − □ = 3",
              prompt: "10 − □ = 3",
              reason: "Von 10 nimmst du 7 weg. Dann bleiben 3."
            },
            compute("bonds-help-3", "add", 60, 40, 100, {
              changes: "tens",
              reason: "6 + 4 = 10, also 6 Zehner + 4 Zehner = 10 Zehner."
            }),
            {
              id: "bonds-help-4",
              type: "fill",
              kind: "complement",
              known: 97,
              target: 100,
              answer: 3,
              label: "97 + □ = 100",
              prompt: "97 + □ = 100",
              reason: "Von 97 bis 100 fehlen nur noch 3 Einer."
            }
          ]
        },
        {
          id: "turn",
          title: "Your turn",
          fade: "turn",
          items: [
            {
              id: "bonds-turn-1",
              type: "fill",
              kind: "missingAdd",
              known: 8,
              target: 15,
              answer: 7,
              label: "8 + □ = 15",
              prompt: "8 + □ = 15",
              reason: "Von 8 bis 10 sind es 2, von 10 bis 15 sind es 5."
            },
            {
              id: "bonds-turn-2",
              type: "fill",
              kind: "complement",
              known: 53,
              target: 100,
              answer: 47,
              label: "53 + □ = 100",
              prompt: "53 + □ = 100",
              reason: "Von 53 bis 60 sind es 7, von 60 bis 100 sind es 4 Zehner."
            },
            compute("bonds-turn-3", "add", 40, 50, 90, {
              changes: "tens",
              reason: "4 + 5 = 9, also 4 Zehner + 5 Zehner = 9 Zehner."
            })
          ]
        },
        {
          id: "check",
          title: "Check only",
          fade: "check",
          items: [
            {
              id: "bonds-check-1",
              type: "fill",
              kind: "bond",
              known: 7,
              target: 10,
              answer: 3,
              label: "7 + □ = 10",
              prompt: "7 + □ = 10",
              reason: "7 und 3 ergeben 10."
            },
            {
              id: "bonds-check-2",
              type: "fill",
              kind: "complement",
              known: 78,
              target: 100,
              answer: 22,
              label: "78 + □ = 100",
              prompt: "78 + □ = 100",
              reason: "Von 78 bis 80 sind es 2, von 80 bis 100 sind es 2 Zehner."
            },
            {
              id: "bonds-check-3",
              type: "fill",
              kind: "missingSub",
              start: 123,
              result: 100,
              answer: 23,
              label: "123 − □ = 100",
              prompt: "123 − □ = 100",
              reason: "Von 123 nimmst du 23 weg. Dann bleiben 100."
            }
          ]
        }
      ]
    },
    {
      id: "digits",
      number: 2,
      title: "Only one digit changes",
      blurb: "Add or subtract 1, 10, or 100. Only one digit moves.",
      stations: [
        {
          id: "see",
          title: "See the rule",
          fade: "see",
          items: [
            compute("digits-see-1", "add", 46, 10, 56, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert. 4 Zehner + 1 Zehner = 5 Zehner.",
              worked: {
                lines: [
                  "10 ist 1 Zehner.",
                  "Welche Stelle verändert sich? Die Zehnerstelle. Die Einer bleiben 6.",
                  "4 Zehner + 1 Zehner = 5 Zehner."
                ],
                blocks: { h: 0, t: 4, o: 6 },
                blocksAdd: { h: 0, t: 1, o: 0 },
                blocksLabel: "46",
                blocksAddLabel: "10"
              }
            })
          ]
        },
        {
          id: "help",
          title: "With help",
          fade: "help",
          items: [
            compute("digits-help-1", "sub", 73, 20, 53, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert. 7 Zehner − 2 Zehner = 5 Zehner."
            }),
            compute("digits-help-2", "add", 356, 100, 456, {
              changes: "hundreds",
              reason: "Nur die Hunderterstelle hat sich verändert. 3 Hunderter + 1 Hunderter = 4 Hunderter."
            }),
            compute("digits-help-3", "add", 48, 1, 49, {
              changes: "ones",
              reason: "Nur die Einerstelle hat sich verändert. 8 Einer + 1 Einer = 9 Einer."
            }),
            compute("digits-help-4", "add", 234, 30, 264, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert. 3 Zehner + 3 Zehner = 6 Zehner."
            })
          ]
        },
        {
          id: "turn",
          title: "Your turn",
          fade: "turn",
          items: [
            compute("digits-turn-1", "sub", 82, 10, 72, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert."
            }),
            compute("digits-turn-2", "add", 415, 100, 515, {
              changes: "hundreds",
              reason: "Nur die Hunderterstelle hat sich verändert."
            }),
            compute("digits-turn-3", "add", 64, 30, 94, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert. 6 Zehner + 3 Zehner = 9 Zehner."
            })
          ]
        },
        {
          id: "check",
          title: "Check only",
          fade: "check",
          items: [
            compute("digits-check-1", "add", 36, 20, 56, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert."
            }),
            compute("digits-check-2", "sub", 428, 10, 418, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert."
            }),
            compute("digits-check-3", "add", 250, 100, 350, {
              changes: "hundreds",
              reason: "Nur die Hunderterstelle hat sich verändert."
            })
          ]
        }
      ]
    },
    {
      id: "crossing",
      number: 3,
      title: "Crossing",
      blurb: "Cross a ten, or cross a hundred.",
      stations: [
        {
          id: "see",
          title: "See the rule",
          fade: "see",
          items: [
            compute("cross-see-1", "add", 48, 5, 53, {
              reason: "Erst bis 50, dann noch 3 weiter.",
              worked: {
                lines: [
                  "8 + 5 geht über den Zehner.",
                  "Rechne zuerst bis zum glatten Zehner: von 48 bis 50 sind es 2.",
                  "Von den 5 bleiben noch 3."
                ],
                line: { start: 48, mid: 50, jump1: "+2", jump2: "+3" }
              }
            })
          ]
        },
        {
          id: "help",
          title: "With help",
          fade: "help",
          items: [
            compute("cross-help-1", "add", 37, 6, 43, {
              reason: "Erst bis 40, dann noch 3 weiter. Die Zehnerstelle ist 1 größer geworden."
            }),
            compute("cross-help-2", "sub", 52, 5, 47, {
              reason: "Erst zurück bis 50, dann noch 3 zurück. Die Zehnerstelle ist 1 kleiner geworden."
            }),
            compute("cross-help-3", "add", 180, 40, 220, {
              reason: "Erst bis 200, dann noch 20 weiter. 8 Zehner + 4 Zehner = 12 Zehner, also 1 Hunderter und 2 Zehner."
            }),
            compute("cross-help-4", "sub", 230, 50, 180, {
              reason: "Erst zurück bis 200, dann noch 20 zurück."
            })
          ]
        },
        {
          id: "turn",
          title: "Your turn",
          fade: "turn",
          items: [
            compute("cross-turn-1", "add", 65, 7, 72, {
              reason: "Erst bis 70, dann noch 2 weiter."
            }),
            compute("cross-turn-2", "sub", 91, 4, 87, {
              reason: "Erst zurück bis 90, dann noch 3 zurück."
            }),
            compute("cross-turn-3", "add", 340, 70, 410, {
              reason: "Erst bis 400, dann noch 10 weiter. Die Hunderterstelle ist 1 größer geworden."
            })
          ]
        },
        {
          id: "check",
          title: "Check only",
          fade: "check",
          items: [
            compute("cross-check-1", "add", 48, 42, 90, {
              reason: "8 + 2 ergibt einen vollen Zehner. Die Zehnerstelle ist 1 größer geworden."
            }),
            compute("cross-check-2", "sub", 126, 8, 118, {
              reason: "Erst zurück bis 120, dann noch 2 zurück."
            }),
            compute("cross-check-3", "sub", 250, 60, 190, {
              reason: "Erst zurück bis 200, dann noch 10 zurück."
            })
          ]
        }
      ]
    },
    {
      id: "columns",
      number: 4,
      title: "Columns",
      blurb: "Line up hundreds, tens and ones. No exchange yet.",
      stations: [
        {
          id: "see",
          title: "See the rule",
          fade: "see",
          items: [
            column("col-see-1", "add", 34, 25, 59, {
              showGrid: true,
              reason: "4 + 5 = 9 und 3 + 2 = 5. An keiner Stelle kamen 10 zusammen.",
              worked: {
                lines: [
                  "Einer stehen unter Einern, Zehner unter Zehnern.",
                  "Ich beginne bei den Einern: 4 Einer + 5 Einer = 9 Einer. Das sind weniger als 10.",
                  "Dann die Zehner: 3 Zehner + 2 Zehner = 5 Zehner."
                ]
              }
            })
          ]
        },
        {
          id: "help",
          title: "With help",
          fade: "help",
          items: [
            column("col-help-1", "add", 342, 125, 467, {
              place: true,
              askExchange: true,
              reason: "An keiner Stelle kamen 10 zusammen. Nichts zu bündeln."
            }),
            column("col-help-2", "sub", 586, 234, 352, {
              place: true,
              askExchange: true,
              reason: "An jeder Stelle war oben genug da. Nichts zu entbündeln."
            }),
            column("col-help-3", "add", 56, 23, 79, {
              place: true,
              askExchange: true,
              reason: "6 + 3 = 9 und 5 + 2 = 7. Nichts zu bündeln."
            })
          ]
        },
        {
          id: "turn",
          title: "Your turn",
          fade: "turn",
          items: [
            column("col-turn-1", "add", 431, 256, 687, {
              place: true,
              askExchange: true,
              reason: "Einer, Zehner und Hunderter blieben jeweils unter 10."
            }),
            column("col-turn-2", "sub", 78, 35, 43, {
              place: true,
              askExchange: true,
              reason: "An jeder Stelle war oben genug da."
            }),
            column("col-turn-3", "add", 415, 362, 777, {
              place: true,
              askExchange: true,
              reason: "5 + 2, 1 + 6 und 4 + 3 bleiben alle unter 10."
            })
          ]
        },
        {
          id: "check",
          title: "Check only",
          fade: "check",
          items: [
            column("col-check-1", "add", 63, 24, 87, {
              paper: true,
              reason: "Die Stellen stehen untereinander, und keine erreicht 10."
            }),
            column("col-check-2", "sub", 489, 256, 233, {
              paper: true,
              reason: "An jeder Stelle war oben genug da."
            }),
            column("col-check-3", "add", 321, 145, 466, {
              paper: true,
              reason: "Die Stellen stehen untereinander. Nichts zu bündeln."
            })
          ]
        }
      ]
    },
    {
      id: "exchange",
      number: 5,
      title: "Exchange",
      blurb: "Exchange when a column does not have enough.",
      stations: [
        {
          id: "see",
          title: "See the rule",
          fade: "see",
          items: [
            column("ex-see-1", "sub", 175, 128, 47, {
              showGrid: true,
              method: "sub-exchange",
              reason: "Du hast 1 Zehner entbündelt. 15 − 8 = 7, dann 6 − 2 = 4.",
              worked: {
                lines: [
                  "Hunderter, Zehner und Einer stehen genau untereinander.",
                  "Ich beginne bei den Einern. Von 5 Einern kann ich nicht 8 Einer abziehen.",
                  "Daher entbündele ich 1 Zehner in 10 Einer. Aus 7 Zehnern werden 6 Zehner, aus 5 Einern werden 15 Einer.",
                  "15 Einer − 8 Einer = 7 Einer.",
                  "Zehner: 6 − 2 = 4. Hunderter: 1 − 1 = 0."
                ]
              }
            })
          ]
        },
        {
          id: "help",
          title: "With help",
          fade: "help",
          items: [
            column("ex-help-1", "add", 46, 27, 73, {
              place: true,
              askExchange: true,
              reason: "6 + 7 = 13 Einer. Du schreibst 3 Einer und merkst dir 1 an der Zehnerstelle."
            }),
            column("ex-help-2", "sub", 150, 70, 80, {
              place: true,
              askExchange: true,
              reason: "70 hat 0 Einer, also bleibt die Einerstelle 0. Du hast 1 Hunderter entbündelt: 15 Zehner − 7 Zehner = 8 Zehner."
            }),
            column("ex-help-3", "sub", 240, 70, 170, {
              place: true,
              askExchange: true,
              reason: "Von 4 Zehnern kannst du nicht 7 Zehner abziehen. Du hast 1 Hunderter entbündelt."
            })
          ]
        },
        {
          id: "turn",
          title: "Your turn",
          fade: "turn",
          items: [
            column("ex-turn-1", "sub", 123, 60, 63, {
              place: true,
              askExchange: true,
              reason: "Bei Minus wird das Ergebnis kleiner. Du hast 1 Hunderter entbündelt, die Einer bleiben 3."
            }),
            column("ex-turn-2", "add", 256, 173, 429, {
              place: true,
              askExchange: true,
              reason: "5 Zehner + 7 Zehner = 12 Zehner. Du hast dir 1 an der Hunderterstelle gemerkt."
            }),
            column("ex-turn-3", "sub", 452, 128, 324, {
              place: true,
              askExchange: true,
              reason: "Von 2 Einern kannst du nicht 8 Einer abziehen. Du hast 1 Zehner entbündelt."
            })
          ]
        },
        {
          id: "check",
          title: "Check only",
          fade: "check",
          items: [
            column("ex-check-1", "sub", 345, 177, 168, {
              paper: true,
              reason: "Zweimal entbündelt: zuerst für die Einer, dann für die Zehner."
            }),
            column("ex-check-2", "add", 68, 47, 115, {
              paper: true,
              reason: "Bei den Einern entsteht ein Zehner, bei den Zehnern ein Hunderter."
            }),
            column("ex-check-3", "sub", 630, 280, 350, {
              paper: true,
              reason: "Die Einerstelle bleibt 0. Für die Zehner hast du 1 Hunderter entbündelt."
            })
          ]
        }
      ]
    },
    {
      id: "decide",
      number: 6,
      title: "Decide, estimate, check",
      blurb: "Choose the operation, estimate, and check.",
      stations: [
        {
          id: "see",
          title: "See the rule",
          fade: "see",
          items: [
            {
              id: "dec-see-1",
              type: "decide",
              kind: "decide",
              choose: false,
              op: "add",
              a: 32,
              b: 21,
              answer: 53,
              story: "Ava has 32 red beads and 21 blue beads. How many beads is that?",
              label: "32 + 21 beads",
              prompt: "32 + 21",
              reason: "Die beiden Teile kommen zusammen, also rechnest du plus.",
              bars: { kind: "join", a: 32, b: 21 },
              worked: {
                lines: [
                  "Zwei Teile kommen zu einem Ganzen zusammen.",
                  "Zusammenkommen ist eine Plusaufgabe."
                ]
              }
            },
            {
              id: "dec-see-2",
              type: "fill",
              kind: "estimate",
              op: "sub",
              a: 175,
              b: 128,
              roundTo: 10,
              exact: 47,
              answer: 50,
              label: "Estimate 175 − 128",
              prompt: "Estimate 175 − 128",
              reason: "180 − 130 = 50. Das genaue Ergebnis, 47, liegt nah daran.",
              lead: "Round each number to the nearest 10, then subtract.",
              worked: {
                lines: [
                  "175 liegt näher an 180 als an 170.",
                  "128 liegt näher an 130 als an 120.",
                  "Für den Überschlag rechnest du mit den gerundeten Zahlen.",
                  "Das genaue Ergebnis prüfst du danach mit der Umkehraufgabe."
                ]
              }
            }
          ]
        },
        {
          id: "help",
          title: "With help",
          fade: "help",
          items: [
            {
              id: "dec-help-1",
              type: "decide",
              kind: "decide",
              choose: true,
              op: "sub",
              a: 58,
              b: 22,
              answer: 36,
              story: "There are 58 apples. 22 are sold. How many apples are left?",
              label: "58 − 22 apples",
              prompt: "58 − 22",
              reason: "Ein Teil ist vom Ganzen weggegangen. Das ist eine Minusaufgabe.",
              bars: { kind: "take", whole: 58, part: 22 }
            },
            {
              id: "dec-help-2",
              type: "fill",
              kind: "estimate",
              op: "add",
              a: 356,
              b: 128,
              roundTo: 100,
              exact: 484,
              answer: 500,
              label: "Estimate 356 + 128",
              prompt: "Estimate 356 + 128",
              reason: "356 ist nah an 400, 128 ist nah an 100. 400 + 100 = 500.",
              lead: "Round each number to the nearest 100, then add."
            },
            {
              id: "dec-help-3",
              type: "fill",
              kind: "inverse",
              checkOp: "add",
              result: 54,
              other: 36,
              answer: 90,
              label: "Check 90 − 36",
              prompt: "54 + 36 = □",
              lead: "90 − 36 = 54. Check by adding.",
              reason: "Die Umkehraufgabe führt zur Zahl am Anfang zurück. 90 − 36 = 54 stimmt."
            },
            {
              id: "dec-help-4",
              type: "decide",
              kind: "decide",
              choose: true,
              op: "add",
              a: 23,
              b: 14,
              answer: 37,
              story: "23 children are in the room. 14 more come in. How many children are there now?",
              label: "23 + 14 children",
              prompt: "23 + 14",
              reason: "Die beiden Gruppen kommen zusammen. Das ist eine Plusaufgabe.",
              bars: { kind: "join", a: 23, b: 14 }
            }
          ]
        },
        {
          id: "turn",
          title: "Your turn",
          fade: "turn",
          items: [
            {
              id: "dec-turn-1",
              type: "decide",
              kind: "decide",
              choose: true,
              op: "sub",
              a: 120,
              b: 40,
              answer: 80,
              story: "A shop has 120 bottles. It sells 40. How many bottles are left?",
              label: "120 − 40 bottles",
              prompt: "120 − 40",
              reason: "Verkaufen nimmt einen Teil weg. Das ist eine Minusaufgabe."
            },
            {
              id: "dec-turn-2",
              type: "fill",
              kind: "estimate",
              op: "sub",
              a: 412,
              b: 187,
              roundTo: 100,
              exact: 225,
              answer: 200,
              label: "Estimate 412 − 187",
              prompt: "Estimate 412 − 187",
              reason: "412 ist nah an 400, 187 ist nah an 200. 400 − 200 = 200.",
              lead: "Round each number to the nearest 100, then subtract."
            },
            {
              id: "dec-turn-3",
              type: "fill",
              kind: "inverse",
              checkOp: "sub",
              result: 73,
              other: 27,
              answer: 46,
              label: "Check 46 + 27",
              prompt: "73 − 27 = □",
              lead: "46 + 27 = 73. Check by subtracting.",
              reason: "Ziehst du einen Teil vom Ganzen ab, kommt der andere Teil heraus. 46 + 27 = 73 stimmt."
            }
          ]
        },
        {
          id: "check",
          title: "Check only",
          fade: "check",
          items: [
            {
              id: "dec-check-1",
              type: "twostep",
              kind: "twoStep",
              op1: "add",
              op2: "sub",
              a: 52,
              b: 30,
              c: 10,
              mid: 82,
              answer: 72,
              label: "52 + 30 − 10",
              prompt: "52 + 30 − 10",
              reason: "52 + 30 = 82, und 82 − 10 = 72."
            },
            compute("dec-check-2", "add", 43, 20, 63, {
              changes: "tens",
              reason: "Nur die Zehnerstelle hat sich verändert."
            }),
            {
              id: "dec-check-3",
              type: "fill",
              kind: "complement",
              known: 64,
              target: 100,
              answer: 36,
              label: "64 + □ = 100",
              prompt: "64 + □ = 100",
              reason: "Von 64 bis 70 sind es 6, von 70 bis 100 sind es 3 Zehner."
            },
            column("dec-check-4", "sub", 263, 147, 116, {
              paper: true,
              reason: "Für die Einer hast du 1 Zehner entbündelt. Dann waren genug Zehner da."
            }),
            {
              id: "dec-check-5",
              type: "decide",
              kind: "decide",
              choose: true,
              op: "sub",
              a: 70,
              b: 20,
              answer: 50,
              story: "Lina has 70 stamps. She gives 20 to her brother. How many stamps does she have left?",
              label: "70 − 20 stamps",
              prompt: "70 − 20",
              reason: "Verschenken nimmt einen Teil weg. 70 − 20 = 50."
            },
            {
              id: "dec-check-6",
              type: "fill",
              kind: "estimate",
              op: "add",
              a: 278,
              b: 190,
              roundTo: 100,
              exact: 468,
              answer: 500,
              label: "Estimate 278 + 190",
              prompt: "Estimate 278 + 190",
              reason: "278 ist nah an 300, 190 ist nah an 200. 300 + 200 = 500.",
              lead: "Round each number to the nearest 100, then add."
            },
            {
              id: "dec-check-7",
              type: "fill",
              kind: "inverse",
              checkOp: "add",
              result: 56,
              other: 27,
              answer: 83,
              label: "Check 83 − 27",
              prompt: "56 + 27 = □",
              lead: "83 − 27 = 56. Check by adding.",
              reason: "Die Umkehraufgabe führt zur Zahl am Anfang zurück. 83 − 27 = 56 stimmt."
            }
          ]
        }
      ]
    }
  ];

  var TONIGHT = [
    column("night-1", "sub", 154, 28, 126, {
      fade: "turn",
      place: true,
      askExchange: true,
      reason: "Von 4 Einern kannst du nicht 8 Einer abziehen. Du hast 1 Zehner entbündelt."
    }),
    column("night-2", "add", 68, 45, 113, {
      fade: "turn",
      place: true,
      askExchange: true,
      reason: "Bei den Einern entsteht ein Zehner, bei den Zehnern ein Hunderter."
    }),
    column("night-3", "sub", 320, 60, 260, {
      fade: "turn",
      place: true,
      askExchange: true,
      reason: "Die Einerstelle bleibt 0. Für die Zehner hast du 1 Hunderter entbündelt."
    }),
    compute("night-4", "add", 356, 100, 456, {
      fade: "check",
      changes: "hundreds",
      reason: "Nur die Hunderterstelle hat sich verändert."
    }),
    {
      id: "night-5",
      type: "fill",
      kind: "complement",
      known: 97,
      target: 100,
      answer: 3,
      fade: "check",
      label: "97 + □ = 100",
      prompt: "97 + □ = 100",
      reason: "Von 97 bis 100 fehlen nur noch 3 Einer."
    },
    {
      id: "night-6",
      type: "twostep",
      kind: "twoStep",
      op1: "add",
      op2: "sub",
      a: 224,
      b: 16,
      c: 240,
      mid: 240,
      answer: 0,
      fade: "check",
      label: "224 + 16 − 240",
      prompt: "224 + 16 − 240",
      reason: "224 + 16 = 240, und 240 − 240 = 0."
    },
    {
      id: "night-7",
      type: "decide",
      kind: "decide",
      choose: true,
      op: "sub",
      a: 90,
      b: 40,
      answer: 50,
      fade: "check",
      story: "A box holds 90 crayons. 40 are taken out. How many crayons are still in the box?",
      label: "90 − 40 crayons",
      prompt: "90 − 40",
      reason: "Herausnehmen ist Wegnehmen. 90 − 40 = 50."
    },
    {
      id: "night-8",
      type: "fill",
      kind: "estimate",
      op: "add",
      a: 299,
      b: 148,
      roundTo: 100,
      exact: 447,
      answer: 400,
      fade: "check",
      label: "Estimate 299 + 148",
      prompt: "Estimate 299 + 148",
      reason: "299 ist nah an 300, 148 ist nah an 100. 300 + 100 = 400.",
      lead: "Round each number to the nearest 100, then add."
    }
  ];

  return { LESSONS: LESSONS, TONIGHT: TONIGHT };
});
