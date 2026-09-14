// 좌표평면 렌더링 공용 유틸. 모든 위젯이 이 함수들로 캔버스에 격자/축/점/도형을 그린다.

function createCoordinatePlane(canvas, opts) {
  opts = opts || {};
  var xMin = opts.xMin !== undefined ? opts.xMin : -8;
  var xMax = opts.xMax !== undefined ? opts.xMax : 8;
  var yMin = opts.yMin !== undefined ? opts.yMin : -8;
  var yMax = opts.yMax !== undefined ? opts.yMax : 8;
  var ctx = canvas.getContext("2d");

  // x/y 단위 눈금이 항상 같은 픽셀 크기를 갖도록(정사각형 좌표평면) 하는 스케일/오프셋.
  // resize()에서 캔버스 실제 크기를 기준으로 다시 계산해 캐시해둔다.
  var layout = { scale: 1, offX: 0, offY: 0, w: 0, h: 0 };

  function width() {
    return canvas.getBoundingClientRect().width;
  }
  function height() {
    return canvas.getBoundingClientRect().height;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var w = rect.width,
      h = rect.height;
    var xSpan = xMax - xMin,
      ySpan = yMax - yMin;
    var scale = Math.min(w / xSpan, h / ySpan);
    layout.scale = scale;
    layout.w = w;
    layout.h = h;
    layout.offX = (w - scale * xSpan) / 2;
    layout.offY = (h - scale * ySpan) / 2;
  }

  function toPixel(x, y) {
    return {
      x: layout.offX + (x - xMin) * layout.scale,
      y: layout.offY + (yMax - y) * layout.scale,
    };
  }

  function toCoord(px, py) {
    return {
      x: xMin + (px - layout.offX) / layout.scale,
      y: yMax - (py - layout.offY) / layout.scale,
    };
  }

  function clear() {
    ctx.clearRect(0, 0, width(), height());
  }

  function drawGrid() {
    var top = layout.offY,
      bottom = layout.offY + layout.scale * (yMax - yMin);
    var left = layout.offX,
      right = layout.offX + layout.scale * (xMax - xMin);
    ctx.save();
    ctx.strokeStyle = "#e4e8ee";
    ctx.lineWidth = 1;
    for (var gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      var p = toPixel(gx, 0);
      ctx.beginPath();
      ctx.moveTo(p.x + 0.5, top);
      ctx.lineTo(p.x + 0.5, bottom);
      ctx.stroke();
    }
    for (var gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      var p2 = toPixel(0, gy);
      ctx.beginPath();
      ctx.moveTo(left, p2.y + 0.5);
      ctx.lineTo(right, p2.y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAxes() {
    var top = layout.offY,
      bottom = layout.offY + layout.scale * (yMax - yMin);
    var left = layout.offX,
      right = layout.offX + layout.scale * (xMax - xMin);
    var origin = toPixel(0, 0);
    ctx.save();
    ctx.strokeStyle = "#8a94a6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left, origin.y);
    ctx.lineTo(right, origin.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(origin.x, top);
    ctx.lineTo(origin.x, bottom);
    ctx.stroke();
    ctx.fillStyle = "#5b6472";
    ctx.font = "12px sans-serif";
    ctx.fillText("x", right - 14, origin.y - 6);
    ctx.fillText("y", origin.x + 6, top + 12);
    ctx.restore();
  }

  return {
    ctx: ctx,
    canvas: canvas,
    xMin: xMin,
    xMax: xMax,
    yMin: yMin,
    yMax: yMax,
    resize: resize,
    width: width,
    height: height,
    toPixel: toPixel,
    toCoord: toCoord,
    clear: clear,
    drawGrid: drawGrid,
    drawAxes: drawAxes,
  };
}

function cpFmt(n) {
  var r = Math.round(n * 10) / 10;
  if (Object.is(r, -0)) r = 0;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

function cpDrawPoint(plane, x, y, color, radius) {
  var p = plane.toPixel(x, y);
  var ctx = plane.ctx;
  ctx.save();
  ctx.fillStyle = color || "#20242b";
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius || 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function cpDrawLabel(plane, x, y, text, color, dx, dy) {
  var p = plane.toPixel(x, y);
  var ctx = plane.ctx;
  ctx.save();
  ctx.fillStyle = color || "#20242b";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(text, p.x + (dx !== undefined ? dx : 8), p.y + (dy !== undefined ? dy : -8));
  ctx.restore();
}

function cpDrawPolyline(plane, points, color, lineWidth) {
  if (!points || points.length < 1) return;
  var ctx = plane.ctx;
  ctx.save();
  ctx.strokeStyle = color || "#20242b";
  ctx.lineWidth = lineWidth || 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach(function (pt, i) {
    var p = plane.toPixel(pt.x, pt.y);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.restore();
}

function cpDrawSegment(plane, x1, y1, x2, y2, color, dashed) {
  var ctx = plane.ctx;
  var p1 = plane.toPixel(x1, y1),
    p2 = plane.toPixel(x2, y2);
  ctx.save();
  ctx.strokeStyle = color || "#aaa";
  ctx.lineWidth = 1.5;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}
