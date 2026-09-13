// 페이지 조립: 탭 전환, 학생 식별 모달, 각 섹션의 필기/이해도 컴포넌트 배치.

var DISCOVERY_QUESTIONS = [
  {
    id: "q1",
    text: "Q1. x축에 대해 대칭이동을 두 번 하면 원래 도형으로 돌아올까요? 왜 그럴까요?",
    answer:
      "네, 돌아옵니다. 점 (x, y)를 x축에 대해 대칭이동하면 (x, -y)가 되고, 이 점을 다시 x축에 대해 대칭이동하면 (x, -(-y)) = (x, y)로 처음 점과 같아집니다. 즉 같은 대칭이동을 두 번 연속 적용하면 항등변환이 됩니다.",
  },
  {
    id: "q2",
    text: "Q2. x축 대칭을 한 뒤 y축 대칭을 하면, 원점 대칭과 같은 결과가 나올까요?",
    answer:
      "네, 같습니다. 점 (x, y)를 x축에 대해 대칭이동하면 (x, -y), 이 점을 다시 y축에 대해 대칭이동하면 (-x, -y)가 되는데, 이는 원점에 대한 대칭이동 결과 (-x, -y)와 정확히 일치합니다. 즉 x축 대칭 → y축 대칭의 합성은 원점 대칭과 같습니다.",
  },
  {
    id: "q3",
    text: "Q3. 원의 중심이 원점이면, 어떤 대칭이동을 해도 도형이 그대로일까요? 중심이 원점이 아니면 어떻게 달라질까요?",
    answer:
      "중심이 원점 (0,0)인 원 x²+y²=r²은 x축, y축, 원점, y=x 중 어떤 대칭이동을 해도 방정식이 그대로 유지되어 도형이 변하지 않습니다. 하지만 중심이 원점이 아닌 원(예: (x-a)²+(y-b)²=r², a 또는 b가 0이 아님)은 대칭이동 후 중심의 위치가 바뀌므로(예: x축 대칭이면 중심이 (a, -b)로 이동) 도형의 위치 자체가 달라집니다. 다만 중심이 y=x 위에 있으면(a=b) y=x 대칭에서는 자기 자신으로 남습니다.",
  },
  {
    id: "q4",
    text: "Q4. 중심이 직선 y=x 위에 있는 원은, y=x 대칭이동을 해도 모양이 그대로일까요?",
    answer:
      "네, 그대로입니다. 중심이 y=x 위에 있다는 것은 중심의 좌표가 (a, a) 꼴이라는 뜻이고, y=x에 대한 대칭이동은 (a, a) → (a, a)로 중심을 그대로 보냅니다. 반지름도 변하지 않으므로 원 전체가 자기 자신으로 대칭이동됩니다.",
  },
  {
    id: "q5",
    text: "Q5. (심화) 점 (2, 5)를 점 (1, 1)에 대하여 대칭이동하면 어디로 갈지, 지금까지 배운 방법으로 추측할 수 있을까요?",
    answer:
      "점 (a, b)에 대한 대칭이동은 그 점이 원래 점과 옮겨진 점의 정중앙(중점)이 되도록 하는 것입니다. (1,1)이 (2,5)와 구하는 점 (x,y)의 중점이 되어야 하므로 (2+x)/2=1, (5+y)/2=1 을 풀면 x=0, y=-3이 되어, 대칭이동된 점은 (0,-3)입니다. (원점 대칭이 '원점을 중점으로 하는 대칭'이었던 원리를 임의의 점 (1,1)로 확장한 것입니다.)",
  },
];

function buildDiscoverySection() {
  var wrap = document.getElementById("discovery-questions");
  DISCOVERY_QUESTIONS.forEach(function (q) {
    var block = document.createElement("div");
    block.className = "discovery-q";
    block.innerHTML =
      '<p class="discovery-q-text">' + q.text + "</p>" +
      '<div class="discovery-note"></div>' +
      '<div class="discovery-actions">' +
      '<button type="button" class="secondary-btn discovery-submit-btn">제출</button>' +
      '<button type="button" class="secondary-btn discovery-reveal-btn" disabled>정답/힌트 보기</button>' +
      "</div>" +
      '<div class="discovery-answer" hidden>' + q.answer + "</div>";
    wrap.appendChild(block);

    var noteWidget = createNoteCanvas(block.querySelector(".discovery-note"), { title: q.id.toUpperCase() + " - 내 생각 적기" });
    var submitBtn = block.querySelector(".discovery-submit-btn");
    var revealBtn = block.querySelector(".discovery-reveal-btn");
    var answerBox = block.querySelector(".discovery-answer");

    submitBtn.addEventListener("click", function () {
      DataStore.saveRecord({ activityId: "discovery-" + q.id, type: "note", payload: noteWidget.getDataURL() });
      submitBtn.disabled = true;
      submitBtn.textContent = "제출 완료";
      revealBtn.disabled = false;
    });
    revealBtn.addEventListener("click", function () {
      answerBox.hidden = false;
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var tabs = document.querySelectorAll(".tab-btn");
  var sections = document.querySelectorAll(".page-section");
  var initialized = {};

  function activate(id) {
    tabs.forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === id);
    });
    sections.forEach(function (s) {
      s.classList.toggle("active", s.id === id);
    });
    if (!initialized[id]) {
      initialized[id] = true;
      initSection(id);
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      activate(t.dataset.tab);
    });
  });

  function initSection(id) {
    if (id === "point") {
      initSymmetryPointWidget(document.getElementById("point-widget"));
    } else if (id === "shape") {
      initSymmetryShapeWidget(document.getElementById("shape-widget"));
    } else if (id === "principle") {
      initPrincipleExplainer(document.getElementById("principle-widget"));
    } else if (id === "discovery") {
      buildDiscoverySection();
      createUnderstandingCheck(document.getElementById("discovery-check"), { activityId: "discovery" });
    }
  }

  activate("point");

  // 학생 식별 (최초 1회)
  var modal = document.getElementById("student-modal");
  var nameDisplay = document.getElementById("student-name-display");

  DataStore.getCurrentStudent().then(function (student) {
    if (student) {
      nameDisplay.textContent = student.studentName + " 님";
    } else {
      modal.classList.add("active");
    }
  });

  document.getElementById("student-modal-confirm").addEventListener("click", function () {
    var name = document.getElementById("student-name-input").value.trim();
    var no = document.getElementById("student-no-input").value.trim();
    if (!name) {
      alert("이름을 입력해주세요.");
      return;
    }
    DataStore.setCurrentStudent(name, no).then(function (student) {
      nameDisplay.textContent = student.studentName + " 님";
      modal.classList.remove("active");
    });
  });
});
