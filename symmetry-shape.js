// 위젯 B: 도형(직선/원/포물선)의 대칭이동 + 자유곡선 대칭 놀이.

function reflectPointsBy(key, pts) {
  return pts.map(function (p) {
    return reflectPointBy(key, p);
  });
}

function distBetween(p, q) {
  var dx = p.x - q.x,
    dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 무한직선(a,b를 지나는 직선)과 점 p 사이의 거리.
function pointToLineDist(p, a, b) {
  var dx = b.x - a.x,
    dy = b.y - a.y;
  var len2 = dx * dx + dy * dy || 1e-9;
  var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  var projX = a.x + t * dx,
    projY = a.y + t * dy;
  return distBetween(p, { x: projX, y: projY });
}

function shapePoints(type, params, xMin, xMax) {
  var pts = [];
  if (type === "line") {
    pts.push({ x: xMin, y: params.m * xMin + params.n });
    pts.push({ x: xMax, y: params.m * xMax + params.n });
  } else if (type === "circle") {
    for (var t = 0; t <= 72; t++) {
      var th = (t / 72) * Math.PI * 2;
      pts.push({ x: params.a + params.r * Math.cos(th), y: params.b + params.r * Math.sin(th) });
    }
  } else if (type === "parabola") {
    for (var i = 0; i <= 80; i++) {
      var x = xMin + ((xMax - xMin) * i) / 80;
      pts.push({ x: x, y: params.a * (x - params.h) * (x - params.h) + params.k });
    }
  }
  return pts;
}

// 원래 도형에서 학생이 눈으로 짚을 수 있는 대표점 P (원: 중심, 직선: 화면 중앙의 한 점, 포물선: 꼭짓점).
function shapeReferencePoint(type, params, plane) {
  if (type === "line") {
    var xm = (plane.xMin + plane.xMax) / 2;
    return { x: xm, y: params.m * xm + params.n };
  } else if (type === "circle") {
    return { x: params.a, y: params.b };
  } else if (type === "parabola") {
    return { x: params.h, y: params.k };
  }
}

// 대칭이동 후 도형의 "방향/폭" 관련 값(직선의 기울기, 포물선의 a)은 위치와 무관하게 결정되므로 미리 계산해둔다.
// 학생은 이 값을 바탕으로 만들어진 회색 도형을 올바른 위치로 "옮기는" 조작만 하면 된다.
function guessSecondaryParams(type, params, key) {
  if (type === "circle") {
    return { r: params.r };
  }
  if (type === "line") {
    if (key === "yeqx" && params.m === 0) {
      return { vertical: true };
    }
    var m2;
    if (key === "xaxis") m2 = -params.m;
    else if (key === "yaxis") m2 = -params.m;
    else if (key === "origin") m2 = params.m;
    else m2 = 1 / params.m; // yeqx
    return { vertical: false, m: m2 };
  }
  if (type === "parabola") {
    var a2;
    if (key === "xaxis") a2 = -params.a;
    else if (key === "yaxis") a2 = params.a;
    else if (key === "origin") a2 = -params.a;
    else a2 = params.a; // yeqx: 옆으로 눕는 포물선이라 이 모델로는 정확히 표현할 수 없어 원래 폭을 유지
    return { a: a2 };
  }
}

// anchor(학생이 옮긴 대표점)와 secondary(고정된 방향/폭 값)로 회색 도형의 좌표점들을 만든다.
// angleDeg: 포물선을 y=x 대칭(옆으로 누운 모양)에 맞추기 위해 학생이 돌리는 회전각(도).
function guessShapePoints(type, anchor, secondary, plane, angleDeg) {
  if (type === "circle") {
    var pts = [];
    for (var t = 0; t <= 72; t++) {
      var th = (t / 72) * Math.PI * 2;
      pts.push({ x: anchor.x + secondary.r * Math.cos(th), y: anchor.y + secondary.r * Math.sin(th) });
    }
    return pts;
  }
  if (type === "line") {
    if (secondary.vertical) {
      return [
        { x: anchor.x, y: plane.yMin },
        { x: anchor.x, y: plane.yMax },
      ];
    }
    return [
      { x: plane.xMin, y: secondary.m * (plane.xMin - anchor.x) + anchor.y },
      { x: plane.xMax, y: secondary.m * (plane.xMax - anchor.x) + anchor.y },
    ];
  }
  if (type === "parabola") {
    // 좌표평면 전체 폭보다 넓게 샘플링해서, anchor가 어디로 옮겨지거나 회전해도
    // 곡선이 좌표평면 가장자리에서 끊기지 않도록 한다.
    var halfWidth = plane.xMax - plane.xMin;
    var theta = ((angleDeg || 0) * Math.PI) / 180;
    var cos = Math.cos(theta),
      sin = Math.sin(theta);
    var out = [];
    for (var i = 0; i <= 160; i++) {
      var u = -halfWidth + (2 * halfWidth * i) / 160;
      var lx = u,
        ly = secondary.a * u * u;
      var rx = lx * cos - ly * sin,
        ry = lx * sin + ly * cos;
      out.push({ x: anchor.x + rx, y: anchor.y + ry });
    }
    return out;
  }
}

function shapeEquationText(type, params, key) {
  var m = params.m, n = params.n, a = params.a, b = params.b, r = params.r, h = params.h, k = params.k;
  var orig, sub;

  if (type === "line") {
    orig = "y = " + cpFmt(m) + "x + " + cpFmt(n);
    if (key === "xaxis") sub = "-y = " + cpFmt(m) + "x + " + cpFmt(n) + "  →  y = " + cpFmt(-m) + "x + " + cpFmt(-n);
    else if (key === "yaxis") sub = "y = " + cpFmt(m) + "(-x) + " + cpFmt(n) + "  →  y = " + cpFmt(-m) + "x + " + cpFmt(n);
    else if (key === "origin") sub = "-y = " + cpFmt(m) + "(-x) + " + cpFmt(n) + "  →  y = " + cpFmt(m) + "x + " + cpFmt(-n);
    else if (key === "yeqx") {
      if (m === 0) sub = "x = " + cpFmt(n) + "  (함수가 아닌 세로선)";
      else sub = "x = " + cpFmt(m) + "y + " + cpFmt(n) + "  →  y = " + cpFmt(1 / m) + "x + " + cpFmt(-n / m);
    }
  } else if (type === "circle") {
    orig = "(x-" + cpFmt(a) + ")² + (y-" + cpFmt(b) + ")² = " + cpFmt(r) + "²  (중심 (" + cpFmt(a) + ", " + cpFmt(b) + "))";
    if (key === "xaxis") sub = "중심 (" + cpFmt(a) + ", " + cpFmt(-b) + ")로 이동";
    else if (key === "yaxis") sub = "중심 (" + cpFmt(-a) + ", " + cpFmt(b) + ")로 이동";
    else if (key === "origin") sub = "중심 (" + cpFmt(-a) + ", " + cpFmt(-b) + ")로 이동";
    else if (key === "yeqx") sub = "중심 (" + cpFmt(b) + ", " + cpFmt(a) + ")로 이동 (x,y 좌표를 통째로 교환)";
  } else if (type === "parabola") {
    orig = "y = " + cpFmt(a) + "(x-" + cpFmt(h) + ")² + " + cpFmt(k);
    if (key === "xaxis") sub = "-y = " + cpFmt(a) + "(x-" + cpFmt(h) + ")² + " + cpFmt(k) + "  →  y = " + cpFmt(-a) + "(x-" + cpFmt(h) + ")² + " + cpFmt(-k);
    else if (key === "yaxis") sub = "y = " + cpFmt(a) + "(-x-" + cpFmt(h) + ")² + " + cpFmt(k) + "  →  y = " + cpFmt(a) + "(x+" + cpFmt(h) + ")² + " + cpFmt(k);
    else if (key === "origin") sub = "-y = " + cpFmt(a) + "(-x-" + cpFmt(h) + ")² + " + cpFmt(k) + "  →  y = " + cpFmt(-a) + "(x+" + cpFmt(h) + ")² + " + cpFmt(-k);
    else if (key === "yeqx") sub = "x = " + cpFmt(a) + "(y-" + cpFmt(h) + ")² + " + cpFmt(k) + "  (옆으로 누운 포물선, x가 y의 함수)";
  }
  return { orig: orig, sub: sub };
}

function initSymmetryShapeWidget(container) {
  container.innerHTML =
    '<div class="widget-row">' +
    '<div class="widget-canvas-pane"><canvas class="sym-canvas"></canvas></div>' +
    '<div class="widget-controls">' +
    '<div class="mode-tabs">' +
    '<button type="button" class="mode-tab-btn active" data-mode="shape">도형 대입</button>' +
    '<button type="button" class="mode-tab-btn" data-mode="free">자유곡선 그리기</button>' +
    "</div>" +

    '<div id="shape-mode-panel">' +
    '<label>도형 종류: <select id="shape-type-select">' +
    '<option value="line">직선 y=mx+n</option>' +
    '<option value="circle">원 (x-a)²+(y-b)²=r²</option>' +
    '<option value="parabola">포물선 y=a(x-h)²+k</option>' +
    "</select></label>" +
    '<div id="shape-sliders"></div>' +
    "</div>" +

    '<div id="free-mode-panel" hidden>' +
    '<p class="widget-hint">좌표평면에 손이나 펜으로 자유롭게 곡선을 그려보세요. 대칭상이 실시간으로 같이 그려집니다.</p>' +
    '<button type="button" class="secondary-btn" id="free-clear-btn">그림 지우기</button>' +
    "</div>" +

    '<hr/>' +
    '<label>대칭 기준: <select id="shape-symmetry-select">' +
    '<option value="xaxis">x축 대칭</option>' +
    '<option value="yaxis">y축 대칭</option>' +
    '<option value="origin">원점 대칭</option>' +
    '<option value="yeqx">y=x 대칭</option>' +
    "</select></label>" +
    '<div id="shape-challenge-panel" class="predict-panel">' +
    '<p class="widget-hint">회색 도형을 통째로 드래그해서, 파란 도형(F)이 선택한 대칭이동을 하면 어디로 갈지 옮겨보세요.</p>' +
    '<div id="shape-rotate-row" class="slider-row" hidden>' +
    '<label>회색 포물선 회전: <span class="slider-val" id="shape-rotate-val">0°</span></label>' +
    '<input type="range" id="shape-rotate-input" min="-180" max="180" step="5" value="0"/>' +
    "</div>" +
    '<button type="button" class="secondary-btn" id="shape-confirm-btn" disabled>정답 확인</button>' +
    '<div id="shape-predict-result" class="predict-result"></div>' +
    "</div>" +
    '<div class="equation-box" id="equation-box"></div>' +
    "</div>" +
    "</div>";

  var canvas = container.querySelector(".sym-canvas");
  var plane = createCoordinatePlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

  var state = {
    mode: "shape",
    shapeType: "line",
    params: {
      line: { m: 1, n: 0 },
      circle: { a: 0, b: 0, r: 3 },
      parabola: { a: 0.5, h: 0, k: -2 },
    },
    symmetry: "xaxis",
    guessAnchor: { x: 0, y: 0 }, // 학생이 드래그로 옮기는 회색 도형의 대표점
    guessAngle: 0, // 포물선 + y=x 대칭에서만 사용하는 회전각(도)
    hasMoved: false,
    revealed: false,
    freePoints: [],
  };

  var shapeResult = container.querySelector("#shape-predict-result");
  var shapeConfirmBtn = container.querySelector("#shape-confirm-btn");
  var rotateRow = container.querySelector("#shape-rotate-row");
  var rotateInput = container.querySelector("#shape-rotate-input");
  var rotateVal = container.querySelector("#shape-rotate-val");

  function needsRotation() {
    return state.shapeType === "parabola" && state.symmetry === "yeqx";
  }

  function startChallenge() {
    var params = state.params[state.shapeType];
    var ref = shapeReferencePoint(state.shapeType, params, plane);
    // 처음엔 원래 도형과 겹치지 않도록 살짝 옮겨서 배치 (학생이 옮겨야 함을 분명히 보여줌)
    state.guessAnchor = { x: ref.x + 1.5, y: ref.y + 1.5 };
    state.guessAngle = 0;
    state.hasMoved = false;
    state.revealed = false;
    shapeConfirmBtn.disabled = true;
    shapeResult.textContent = "";
    rotateRow.hidden = !needsRotation();
    rotateInput.value = 0;
    rotateVal.textContent = "0°";
  }

  var sliderConfig = {
    line: [
      { key: "m", label: "기울기 m", min: -3, max: 3, step: 0.1 },
      { key: "n", label: "절편 n", min: -6, max: 6, step: 0.5 },
    ],
    circle: [
      { key: "a", label: "중심 x = a", min: -5, max: 5, step: 0.5 },
      { key: "b", label: "중심 y = b", min: -5, max: 5, step: 0.5 },
      { key: "r", label: "반지름 r", min: 0.5, max: 6, step: 0.5 },
    ],
    parabola: [
      { key: "a", label: "폭/방향 a", min: -1.5, max: 1.5, step: 0.1 },
      { key: "h", label: "꼭짓점 x = h", min: -5, max: 5, step: 0.5 },
      { key: "k", label: "꼭짓점 y = k", min: -5, max: 5, step: 0.5 },
    ],
  };

  function buildSliders() {
    var wrap = container.querySelector("#shape-sliders");
    var cfg = sliderConfig[state.shapeType];
    var params = state.params[state.shapeType];
    wrap.innerHTML = cfg
      .map(function (c) {
        return (
          '<div class="slider-row">' +
          "<label>" + c.label + ': <span class="slider-val" data-key="' + c.key + '">' + cpFmt(params[c.key]) + "</span></label>" +
          '<input type="range" data-key="' + c.key + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + params[c.key] + '"/>' +
          "</div>"
        );
      })
      .join("");
    wrap.querySelectorAll("input[type=range]").forEach(function (input) {
      input.addEventListener("input", function () {
        var key = input.getAttribute("data-key");
        params[key] = parseFloat(input.value);
        wrap.querySelector('.slider-val[data-key="' + key + '"]').textContent = cpFmt(params[key]);
        startChallenge();
        render();
      });
    });
  }

  function render() {
    plane.resize();
    plane.clear();
    plane.drawGrid();
    if (state.symmetry === "yeqx") {
      cpDrawSegment(plane, plane.xMin, plane.xMin, plane.xMax, plane.xMax, "#c9cfd9", true);
    }
    plane.drawAxes();

    if (state.mode === "shape") {
      var params = state.params[state.shapeType];
      var pts = shapePoints(state.shapeType, params, plane.xMin, plane.xMax);
      var ref = shapeReferencePoint(state.shapeType, params, plane);
      cpDrawPolyline(plane, pts, "#1c7ed6", 2.5);
      cpDrawPoint(plane, ref.x, ref.y, "#1c7ed6", 5);
      cpDrawLabel(plane, ref.x, ref.y, "P", "#1c7ed6");

      var secondary = guessSecondaryParams(state.shapeType, params, state.symmetry);
      var guessPts = guessShapePoints(state.shapeType, state.guessAnchor, secondary, plane, state.guessAngle);
      cpDrawPolyline(plane, guessPts, "rgba(32,36,43,0.55)", 2.5);
      cpDrawPoint(plane, state.guessAnchor.x, state.guessAnchor.y, "rgba(32,36,43,0.55)", 6);

      if (state.revealed) {
        var rpts = reflectPointsBy(state.symmetry, pts);
        cpDrawPolyline(plane, rpts, "#e8590c", 2.5);
        var refP = reflectPointBy(state.symmetry, ref);
        cpDrawPoint(plane, refP.x, refP.y, "#e8590c", 5);
        cpDrawLabel(plane, refP.x, refP.y, "P'", "#e8590c");
        var eq = shapeEquationText(state.shapeType, params, state.symmetry);
        container.querySelector("#equation-box").innerHTML =
          '<div><span style="color:#1c7ed6">원래 도형 F</span>: ' + eq.orig + "</div>" +
          '<div><span style="color:#e8590c">F\' (' + SYM_LABELS[state.symmetry] + ")</span>: " + eq.sub + "</div>";
      } else {
        container.querySelector("#equation-box").innerHTML =
          '<div style="color:#8a94a6">정답 확인을 누르면 대칭이동된 도형과 방정식이 나타나요.</div>';
      }
    } else {
      state.freePoints.forEach(function (stroke) {
        cpDrawPolyline(plane, stroke, "#1c7ed6", 3);
        cpDrawPolyline(plane, reflectPointsBy(state.symmetry, stroke), "#e8590c", 3);
      });
      container.querySelector("#equation-box").innerHTML =
        '<div>지금 그린 곡선을 <span style="color:#e8590c">' + SYM_LABELS[state.symmetry] + "</span>으로 옮긴 모습이 주황색이에요. 어떤 곡선이든 대칭이동이 항상 성립해요.</div>";
    }
  }

  container.querySelectorAll(".mode-tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.mode = btn.getAttribute("data-mode");
      container.querySelectorAll(".mode-tab-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      container.querySelector("#shape-mode-panel").hidden = state.mode !== "shape";
      container.querySelector("#free-mode-panel").hidden = state.mode !== "free";
      container.querySelector("#shape-challenge-panel").hidden = state.mode !== "shape";
      render();
    });
  });

  container.querySelector("#shape-type-select").addEventListener("change", function (e) {
    state.shapeType = e.target.value;
    buildSliders();
    startChallenge();
    render();
  });

  container.querySelector("#shape-symmetry-select").addEventListener("change", function (e) {
    state.symmetry = e.target.value;
    startChallenge();
    render();
  });

  container.querySelector("#shape-confirm-btn").addEventListener("click", function () {
    if (!state.hasMoved) return;
    state.revealed = true;
    var params = state.params[state.shapeType];
    var ok;
    if (state.shapeType === "circle") {
      var actualCenter = reflectPointBy(state.symmetry, { x: params.a, y: params.b });
      ok = distBetween(state.guessAnchor, actualCenter) < 0.6;
    } else if (state.shapeType === "line") {
      var p1 = { x: plane.xMin, y: params.m * plane.xMin + params.n };
      var p2 = { x: plane.xMax, y: params.m * plane.xMax + params.n };
      var a1 = reflectPointBy(state.symmetry, p1),
        a2 = reflectPointBy(state.symmetry, p2);
      ok = pointToLineDist(state.guessAnchor, a1, a2) < 0.5;
    } else {
      var actualVertex = reflectPointBy(state.symmetry, { x: params.h, y: params.k });
      var posOk = distBetween(state.guessAnchor, actualVertex) < 0.6;
      if (needsRotation()) {
        var diff = (((state.guessAngle - -90) % 360) + 540) % 360 - 180;
        ok = posOk && Math.abs(diff) < 15;
      } else {
        ok = posOk;
      }
    }
    shapeResult.textContent = ok
      ? "정확해요! 회색 도형을 대칭이동 결과와 거의 같은 자리(와 방향)로 옮겼어요."
      : needsRotation()
      ? "아직 위치나 회전이 달라요. y=x 대칭이면 포물선이 옆으로 눕는다는 점을 생각하며 위치와 회전각을 함께 맞춰보세요."
      : "아직 자리가 달라요. 파란 도형(F)과 주황 도형(F')을 비교하며 어느 방향으로 더 옮겨야 할지 생각해볼까요?";
    render();
  });

  rotateInput.addEventListener("input", function () {
    state.guessAngle = parseFloat(rotateInput.value);
    rotateVal.textContent = state.guessAngle + "°";
    state.hasMoved = true;
    shapeConfirmBtn.disabled = false;
    render();
  });

  container.querySelector("#free-clear-btn").addEventListener("click", function () {
    state.freePoints = [];
    render();
  });

  // 자유곡선 그리기 (좌표평면 위 pointer 이벤트)
  var drawingFree = false;
  canvas.style.touchAction = "none";

  // 회색 도형 통째로 드래그하기: 도형 위 어디를 잡아도 대표점(anchor)이 그 오프셋만큼 따라 움직인다.
  var draggingShape = false;
  var dragOffset = null;

  function hitTestGuessShape(coord) {
    var params = state.params[state.shapeType];
    var secondary = guessSecondaryParams(state.shapeType, params, state.symmetry);
    if (state.shapeType === "circle") {
      return distBetween(coord, state.guessAnchor) <= secondary.r + 0.35;
    }
    var pts = guessShapePoints(state.shapeType, state.guessAnchor, secondary, plane, state.guessAngle);
    if (state.shapeType === "line") {
      return pointToLineDist(coord, pts[0], pts[1]) < 0.4;
    }
    var minD = Infinity;
    pts.forEach(function (p) {
      minD = Math.min(minD, distBetween(coord, p));
    });
    return minD < 0.4;
  }

  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    var coord = plane.toCoord(e.clientX - r.left, e.clientY - r.top);

    if (state.mode === "shape") {
      if (hitTestGuessShape(coord)) {
        draggingShape = true;
        dragOffset = { dx: state.guessAnchor.x - coord.x, dy: state.guessAnchor.y - coord.y };
        canvas.setPointerCapture(e.pointerId);
      }
      return;
    }

    if (state.mode !== "free") return;
    drawingFree = true;
    canvas.setPointerCapture(e.pointerId);
    state.freePoints.push([coord]); // 새 획(stroke) 시작
    render();
  });
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    var coord = plane.toCoord(e.clientX - r.left, e.clientY - r.top);

    if (state.mode === "shape") {
      if (!draggingShape) return;
      var nx = coord.x + dragOffset.dx,
        ny = coord.y + dragOffset.dy;
      state.guessAnchor = {
        x: Math.max(plane.xMin, Math.min(plane.xMax, nx)),
        y: Math.max(plane.yMin, Math.min(plane.yMax, ny)),
      };
      state.hasMoved = true;
      shapeConfirmBtn.disabled = false;
      render();
      return;
    }

    if (!drawingFree) return;
    state.freePoints[state.freePoints.length - 1].push(coord);
    render();
  });
  function stopFree() {
    drawingFree = false;
    draggingShape = false;
    dragOffset = null;
  }
  canvas.addEventListener("pointerup", stopFree);
  canvas.addEventListener("pointerleave", stopFree);
  canvas.addEventListener("pointercancel", stopFree);

  buildSliders();
  startChallenge();
  render();
  window.addEventListener("resize", render);
}
