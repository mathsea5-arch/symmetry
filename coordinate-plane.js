// 좌표평면 렌더링 공용 유틸. 모든 위젯이 이 함수들로 캔버스에 격자/축/점/도형을 그린다.

function createCoordinatePlane(canvas, opts) {
  opts = opts || {};
  var xMin = opts.xMin !== undefined ? opts.xMin : -8;
  var xMax = opts.xMax !== undefined ? opts.xMax : 8;
  var yMin = opts.yMin !== undefined ? opts.yMin : -8;
  var yMax = opts.yMax !== undefined ? opts.yMax : 8;
  var ctx = canvas.getContext("2d");

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
  }

  function toPixel(x, y) {
    var w = width(),
      h = height();
    return {
      x: ((x - xMin) / (xMax - xMin)) * w,
      y: h - ((y - yMin) / (yMax - yMin)) * h,
    };
  }

  function toCoord(px, py) {
    var w = width(),
      h = height();
    return {
      x: xMin + (px / w) * (xMax - xMin),
      y: yMin + ((h - py) / h) * (yMax - yMin),
    };
  }

  function clear() {
    ctx.clearRect(0, 0, width(), height());
  }

  function drawGrid() {
    var w = width(),
      h = height();
    ctx.save();
    ctx.strokeStyle = "#e4e8ee";
    ctx.lineWidth = 1;
    for (var gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      var p = toPixel(gx, 0);
      ctx.beginPath();
      ctx.moveTo(p.x + 0.5, 0);
      ctx.lineTo(p.x + 0.5, h);
      ctx.stroke();
    }
    for (var gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      var p2 = toPixel(0, gy);
      ctx.beginPath();
      ctx.moveTo(0, p2.y + 0.5);
      ctx.lineTo(w, p2.y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAxes() {
    var w = width(),
      h = height();
    var origin = toPixel(0, 0);
    ctx.save();
    ctx.strokeStyle = "#8a94a6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.stroke();
    ctx.fillStyle = "#5b6472";
    ctx.font = "12px sans-serif";
    ctx.fillText("x", w - 14, origin.y - 6);
    ctx.fillText("y", origin.x + 6, 12);
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
