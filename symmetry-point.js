// 위젯 A: 점의 대칭이동 탐구 + 원리 설명(y=x 대칭 재구성)에서 재사용하는 코드.

var SYM_COLORS = {
  xaxis: "#e8590c",
  yaxis: "#2f9e44",
  origin: "#9c36b5",
  yeqx: "#1c7ed6",
};
var SYM_LABELS = {
  xaxis: "x축 대칭",
  yaxis: "y축 대칭",
  origin: "원점 대칭",
  yeqx: "y=x 대칭",
};

function reflectPointBy(key, pt) {
  switch (key) {
    case "xaxis":
      return { x: pt.x, y: -pt.y };
    case "yaxis":
      return { x: -pt.x, y: pt.y };
    case "origin":
      return { x: -pt.x, y: -pt.y };
    case "yeqx":
      return { x: pt.y, y: pt.x };
  }
}

// 정수 격자 근처(GRID_SNAP_RADIUS 이내)에 오면 정수 좌표로 스냅.
var GRID_SNAP_RADIUS = 0.35;
function snapToGrid(coord) {
  var nx = Math.round(coord.x),
    ny = Math.round(coord.y);
  var dx = coord.x - nx,
    dy = coord.y - ny;
  if (Math.sqrt(dx * dx + dy * dy) < GRID_SNAP_RADIUS) {
    return { x: nx, y: ny };
  }
  return coord;
}

function initSymmetryPointWidget(container) {
  container.innerHTML =
    '<div class="widget-row">' +
    '<div class="widget-canvas-pane"><canvas class="sym-canvas"></canvas></div>' +
    '<div class="widget-controls">' +
    '<div class="toggle-group">' +
    '<button type="button" class="toggle-btn" data-key="xaxis" style="--c:' + SYM_COLORS.xaxis + '">x축 대칭</button>' +
    '<button type="button" class="toggle-btn" data-key="yaxis" style="--c:' + SYM_COLORS.yaxis + '">y축 대칭</button>' +
    '<button type="button" class="toggle-btn" data-key="origin" style="--c:' + SYM_COLORS.origin + '">원점 대칭</button>' +
    '<button type="button" class="toggle-btn" data-key="yeqx" style="--c:' + SYM_COLORS.yeqx + '">y=x 대칭</button>' +
    "</div>" +
    '<button type="button" class="secondary-btn" id="compare4-btn" disabled>4점 한번에 비교</button>' +
    '<div class="coord-readout" id="point-coord-readout"></div>' +
    '<div id="challenge-panel" class="predict-panel" hidden>' +
    '<p class="widget-hint" id="challenge-hint">좌표평면을 클릭해서 P\'이 있을 것 같은 자리를 먼저 찍어보세요.</p>' +
    '<button type="button" class="secondary-btn" id="predict-confirm-btn">정답 확인</button>' +
    '<div id="predict-result" class="predict-result"></div>' +
    "</div>" +
    "</div>" +
    "</div>";

  var canvas = container.querySelector(".sym-canvas");
  var plane = createCoordinatePlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

  var state = {
    P: { x: 3, y: 4 },
    challengeKey: null, // 예측 중인 대칭 기준
    compareAll: false, // "4점 한번에 비교" 모드 (정답 바로 표시)
    guess: null,
    revealed: false,
    completed: { xaxis: false, yaxis: false, origin: false, yeqx: false }, // 4가지 예측을 각각 정답 확인까지 마쳤는지
  };

  var challengePanel = container.querySelector("#challenge-panel");
  var predictResult = container.querySelector("#predict-result");
  var compare4Btn = container.querySelector("#compare4-btn");

  function updateCompare4BtnState() {
    var allDone = Object.keys(state.completed).every(function (k) {
      return state.completed[k];
    });
    compare4Btn.disabled = !allDone;
  }

  function setToggleHighlight() {
    container.querySelectorAll(".toggle-btn").forEach(function (btn) {
      btn.classList.toggle("active", !state.compareAll && btn.getAttribute("data-key") === state.challengeKey);
    });
  }

  function render() {
    plane.resize();
    plane.clear();
    plane.drawGrid();
    cpDrawSegment(plane, plane.xMin, plane.xMin, plane.xMax, plane.xMax, "#c9cfd9", true);
    plane.drawAxes();

    if (state.compareAll) {
      ["xaxis", "yaxis", "origin", "yeqx"].forEach(function (key) {
        var rp = reflectPointBy(key, state.P);
        cpDrawSegment(plane, state.P.x, state.P.y, rp.x, rp.y, SYM_COLORS[key], true);
        cpDrawPoint(plane, rp.x, rp.y, SYM_COLORS[key]);
        cpDrawLabel(plane, rp.x, rp.y, "P'(" + cpFmt(rp.x) + ", " + cpFmt(rp.y) + ")", SYM_COLORS[key]);
      });
    } else if (state.challengeKey && state.revealed) {
      var rp2 = reflectPointBy(state.challengeKey, state.P);
      cpDrawSegment(plane, state.P.x, state.P.y, rp2.x, rp2.y, SYM_COLORS[state.challengeKey], true);
      cpDrawPoint(plane, rp2.x, rp2.y, SYM_COLORS[state.challengeKey]);
      cpDrawLabel(plane, rp2.x, rp2.y, "P'(" + cpFmt(rp2.x) + ", " + cpFmt(rp2.y) + ")", SYM_COLORS[state.challengeKey]);
    }

    // 학생이 찍은 예측 위치는 정답 공개 여부와 상관없이 항상 남아있음
    if (state.guess) {
      cpDrawPoint(plane, state.guess.x, state.guess.y, "rgba(32,36,43,0.4)", 7);
      cpDrawLabel(plane, state.guess.x, state.guess.y, "내 예측", "rgba(32,36,43,0.7)", 8, 14);
    }

    // 원래 점 P는 어떤 상태에서도 항상 표시
    cpDrawPoint(plane, state.P.x, state.P.y, "#20242b", 7);
    cpDrawLabel(plane, state.P.x, state.P.y, "P(" + cpFmt(state.P.x) + ", " + cpFmt(state.P.y) + ")", "#20242b");

    updateReadout();
  }

  function updateReadout() {
    var lines = ["P(" + cpFmt(state.P.x) + ", " + cpFmt(state.P.y) + ")"];
    if (state.compareAll) {
      ["xaxis", "yaxis", "origin", "yeqx"].forEach(function (key) {
        var rp = reflectPointBy(key, state.P);
        lines.push('<span style="color:' + SYM_COLORS[key] + '">' + SYM_LABELS[key] + ": P'(" + cpFmt(rp.x) + ", " + cpFmt(rp.y) + ")</span>");
      });
    } else if (state.challengeKey && state.revealed) {
      var rp2 = reflectPointBy(state.challengeKey, state.P);
      lines.push(
        '<span style="color:' + SYM_COLORS[state.challengeKey] + '">' + SYM_LABELS[state.challengeKey] + ": P'(" + cpFmt(rp2.x) + ", " + cpFmt(rp2.y) + ")</span>"
      );
    }
    container.querySelector("#point-coord-readout").innerHTML = lines.join("<br/>");
  }

  function startChallenge(key) {
    state.compareAll = false;
    state.challengeKey = key;
    state.guess = null;
    state.revealed = false;
    setToggleHighlight();
    challengePanel.hidden = false;
    container.querySelector("#challenge-hint").textContent = SYM_LABELS[key] + " - 좌표평면을 클릭해서 P'이 있을 것 같은 자리를 먼저 찍어보세요.";
    predictResult.textContent = "";
    render();
  }

  // 대칭 기준 버튼: 누르면 바로 정답을 보여주지 않고 예측 과제를 시작
  container.querySelectorAll(".toggle-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      startChallenge(btn.getAttribute("data-key"));
    });
  });

  container.querySelector("#compare4-btn").addEventListener("click", function () {
    state.compareAll = !state.compareAll;
    if (state.compareAll) {
      state.challengeKey = null;
      challengePanel.hidden = true;
    }
    setToggleHighlight();
    render();
  });

  // 점 드래그 (마우스/터치/펜 공용)
  var dragging = false;
  canvas.style.touchAction = "none";

  function nearP(coord) {
    var dx = coord.x - state.P.x,
      dy = coord.y - state.P.y;
    return Math.sqrt(dx * dx + dy * dy) < 1.2;
  }

  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    var coord = plane.toCoord(e.clientX - r.left, e.clientY - r.top);

    if (nearP(coord)) {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    if (state.challengeKey && !state.compareAll) {
      state.guess = { x: Math.round(coord.x * 2) / 2, y: Math.round(coord.y * 2) / 2 };
      predictResult.textContent = "";
      render();
    }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var r = canvas.getBoundingClientRect();
    var coord = plane.toCoord(e.clientX - r.left, e.clientY - r.top);
    coord.x = Math.max(plane.xMin, Math.min(plane.xMax, coord.x));
    coord.y = Math.max(plane.yMin, Math.min(plane.yMax, coord.y));
    state.P = snapToGrid(coord);
    state.guess = null;
    state.revealed = false;
    predictResult.textContent = "";
    render();
  });
  function stopDrag() {
    dragging = false;
  }
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointerleave", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  container.querySelector("#predict-confirm-btn").addEventListener("click", function () {
    if (!state.guess) {
      predictResult.textContent = "먼저 좌표평면에서 예상 위치를 찍어주세요.";
      return;
    }
    state.revealed = true;
    state.completed[state.challengeKey] = true;
    updateCompare4BtnState();
    var actual = reflectPointBy(state.challengeKey, state.P);
    var dx = state.guess.x - actual.x,
      dy = state.guess.y - actual.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var msg =
      dist < 0.6
        ? "정확해요! 실제 대칭점 P'(" + cpFmt(actual.x) + ", " + cpFmt(actual.y) + ")과 거의 일치합니다."
        : "실제 대칭점은 P'(" + cpFmt(actual.x) + ", " + cpFmt(actual.y) + ") 이에요. 내 예측과 차이가 있네요. 왜 그런지 다시 생각해볼까요?";
    predictResult.textContent = msg;
    render();
  });

  render();
  window.addEventListener("resize", render);
}

// 원리 설명 섹션: y=x 대칭의 "중점이 직선 위 + 수직" 아이디어를 단계별로 재구성.
function initPrincipleExplainer(container) {
  container.innerHTML =
    '<div class="widget-row">' +
    '<div class="widget-canvas-pane"><canvas class="sym-canvas"></canvas></div>' +
    '<div class="widget-controls">' +
    '<p class="widget-hint">점 P를 드래그해보고, 아래 단계를 순서대로 눌러보세요.</p>' +
    '<div class="step-buttons">' +
    '<button type="button" class="secondary-btn" id="step1-btn">1. P와 대칭점 P\' 보기</button>' +
    '<button type="button" class="secondary-btn" id="step2-btn">2. 중점 M 표시</button>' +
    '<button type="button" class="secondary-btn" id="step3-btn">3. PP\'과 y=x, 수직일까?</button>' +
    "</div>" +
    '<div class="coord-readout" id="principle-readout"></div>' +
    "</div>" +
    "</div>";

  var canvas = container.querySelector(".sym-canvas");
  var plane = createCoordinatePlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

  var state = { P: { x: 5, y: 2 }, step: 0 };

  // M을 기준으로 두 방향(towardX,towardY 쪽 / y=x 방향)으로 작은 직각 표시를 그린다.
  function drawRightAngleMark(mx, my, towardX, towardY) {
    var ctx = plane.ctx;
    var Mpx = plane.toPixel(mx, my);
    var Tpx = plane.toPixel(towardX, towardY);
    var Lpx = plane.toPixel(mx + 1, my + 1);

    function unit(from, to) {
      var dx = to.x - from.x,
        dy = to.y - from.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: dx / len, y: dy / len };
    }
    var size = 12;
    var u1 = unit(Mpx, Tpx);
    var u2 = unit(Mpx, Lpx);
    var a = { x: Mpx.x + u1.x * size, y: Mpx.y + u1.y * size };
    var b = { x: Mpx.x + u2.x * size, y: Mpx.y + u2.y * size };
    var c = { x: a.x + u2.x * size, y: a.y + u2.y * size };

    ctx.save();
    ctx.strokeStyle = "#e8590c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    plane.resize();
    plane.clear();
    plane.drawGrid();
    cpDrawSegment(plane, plane.xMin, plane.xMin, plane.xMax, plane.xMax, "#1c7ed6", true);
    plane.drawAxes();

    var Pp = reflectPointBy("yeqx", state.P);
    var mx = (state.P.x + Pp.x) / 2,
      my = (state.P.y + Pp.y) / 2;
    var readoutLines = ["P(" + cpFmt(state.P.x) + ", " + cpFmt(state.P.y) + ")  →  P'(" + cpFmt(Pp.x) + ", " + cpFmt(Pp.y) + ")"];

    if (state.step >= 1) {
      cpDrawSegment(plane, state.P.x, state.P.y, Pp.x, Pp.y, "#20242b");
      cpDrawPoint(plane, Pp.x, Pp.y, "#1c7ed6");
      cpDrawLabel(plane, Pp.x, Pp.y, "P'(" + cpFmt(Pp.x) + ", " + cpFmt(Pp.y) + ")", "#1c7ed6");
    }

    if (state.step >= 2) {
      cpDrawPoint(plane, mx, my, "#e8590c", 5);
      cpDrawLabel(plane, mx, my, "M(" + cpFmt(mx) + ", " + cpFmt(my) + ")", "#e8590c", 8, 16);
      readoutLines.push("중점 M(" + cpFmt(mx) + ", " + cpFmt(my) + ") → 두 좌표가 같으니 y=x 위에 있어요.");
    }

    if (state.step >= 3) {
      if (Math.abs(state.P.x - state.P.y) < 1e-9) {
        readoutLines.push("지금 P가 y=x 위에 있어서 P'=P예요. P를 y=x 밖으로 옮겨보세요.");
      } else {
        drawRightAngleMark(mx, my, state.P.x, state.P.y);
        var slope = (Pp.y - state.P.y) / (Pp.x - state.P.x);
        readoutLines.push("PP'의 기울기 = " + cpFmt(slope) + " , y=x의 기울기 = 1 → 곱하면 " + cpFmt(slope * 1) + " (수직조건: -1) → 직각!");
      }
    }

    // 원래 점 P는 항상 캔버스에 표시
    cpDrawPoint(plane, state.P.x, state.P.y, "#20242b", 7);
    cpDrawLabel(plane, state.P.x, state.P.y, "P(" + cpFmt(state.P.x) + ", " + cpFmt(state.P.y) + ")", "#20242b");

    container.querySelector("#principle-readout").innerHTML = readoutLines.join("<br/>");
  }

  var dragging = false;
  canvas.style.touchAction = "none";
  function nearP(coord) {
    var dx = coord.x - state.P.x,
      dy = coord.y - state.P.y;
    return Math.sqrt(dx * dx + dy * dy) < 1.2;
  }
  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    var coord = plane.toCoord(e.clientX - r.left, e.clientY - r.top);
    if (nearP(coord)) {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var r = canvas.getBoundingClientRect();
    var coord = plane.toCoord(e.clientX - r.left, e.clientY - r.top);
    coord.x = Math.max(plane.xMin, Math.min(plane.xMax, coord.x));
    coord.y = Math.max(plane.yMin, Math.min(plane.yMax, coord.y));
    state.P = coord;
    render();
  });
  function stopDrag() {
    dragging = false;
  }
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointerleave", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  container.querySelector("#step1-btn").addEventListener("click", function () {
    state.step = 1;
    render();
  });
  container.querySelector("#step2-btn").addEventListener("click", function () {
    state.step = 2;
    render();
  });
  container.querySelector("#step3-btn").addEventListener("click", function () {
    state.step = 3;
    render();
  });

  render();
  window.addEventListener("resize", render);
}
