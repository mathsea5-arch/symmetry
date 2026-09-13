// "이해함 / 헷갈림 / 모르겠음" 3단계 이해도 체크 컴포넌트.

function createUnderstandingCheck(container, opts) {
  opts = opts || {};
  var wrap = document.createElement("div");
  wrap.className = "understanding-check";
  wrap.innerHTML =
    '<span class="understanding-label">이 활동, 어땠나요?</span>' +
    '<div class="understanding-btns">' +
    '<button type="button" data-value="understood">🙂 이해함</button>' +
    '<button type="button" data-value="confused">😕 헷갈림</button>' +
    '<button type="button" data-value="unknown">🤔 모르겠음</button>' +
    "</div>";
  container.appendChild(wrap);

  var btns = wrap.querySelectorAll("button");
  btns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      btns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      var value = btn.getAttribute("data-value");
      DataStore.saveRecord({
        activityId: opts.activityId || "unknown-activity",
        type: "understanding",
        payload: value,
      });
      if (opts.onSelect) opts.onSelect(value);
    });
  });

  return wrap;
}
