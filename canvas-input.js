// 태블릿 펜 필기가 가능한 캔버스 입력 컴포넌트. 여러 섹션에서 재사용한다.

function createNoteCanvas(container, opts) {
  opts = opts || {};
  var wrap = document.createElement("div");
  wrap.className = "note-canvas-wrap";
  wrap.innerHTML =
    '<div class="note-canvas-toolbar">' +
    '<span class="note-canvas-title">' + (opts.title || "필기") + "</span>" +
    '<button type="button" class="note-clear-btn">지우기</button>' +
    "</div>" +
    '<canvas class="note-canvas"></canvas>';
  container.appendChild(wrap);

  var canvas = wrap.querySelector("canvas");
  canvas.style.touchAction = "none";

  var rect = canvas.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  var ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#20242b";
  ctx.lineWidth = 2.2;

  var drawing = false;
  var last = null;

  function posFromEvent(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", function (e) {
    drawing = true;
    last = posFromEvent(e);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!drawing) return;
    var cur = posFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    last = cur;
  });
  function stopDrawing() {
    drawing = false;
    last = null;
  }
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);

  wrap.querySelector(".note-clear-btn").addEventListener("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  return {
    getDataURL: function () {
      return canvas.toDataURL();
    },
    clear: function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
