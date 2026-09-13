// 학생 필기/이해도 데이터를 저장하고 불러오는 인터페이스.
// 지금은 localStorage로 구현하지만, 나중에 Firestore 등으로 바꿀 때
// 이 파일 안의 구현만 교체하면 되도록 함수 시그니처(모두 Promise 반환)를 고정해둔다.
var DataStore = (function () {
  var STUDENT_KEY = "symmetry_student_v1";
  var RECORDS_KEY = "symmetry_records_v1";

  function readRecords() {
    try {
      var raw = localStorage.getItem(RECORDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeRecords(list) {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(list));
    } catch (e) {
      /* 저장 공간 부족 등은 무시하고 진행 */
    }
  }

  function getCurrentStudent() {
    return Promise.resolve().then(function () {
      try {
        var raw = localStorage.getItem(STUDENT_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    });
  }

  function setCurrentStudent(name, no) {
    return Promise.resolve().then(function () {
      var student = {
        studentId: (no || "?") + "-" + name,
        studentName: name,
        studentNo: no || "",
      };
      localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
      return student;
    });
  }

  function saveRecord(record) {
    return getCurrentStudent().then(function (student) {
      var full = {
        studentId: student ? student.studentId : "unknown",
        studentName: student ? student.studentName : "익명",
        activityId: record.activityId,
        type: record.type,
        payload: record.payload,
        timestamp: Date.now(),
      };
      var list = readRecords();
      list.push(full);
      writeRecords(list);
      return full;
    });
  }

  function getRecords(filter) {
    return Promise.resolve().then(function () {
      var list = readRecords();
      if (!filter) return list;
      return list.filter(function (r) {
        return Object.keys(filter).every(function (k) {
          return r[k] === filter[k];
        });
      });
    });
  }

  return {
    getCurrentStudent: getCurrentStudent,
    setCurrentStudent: setCurrentStudent,
    saveRecord: saveRecord,
    getRecords: getRecords,
  };
})();
