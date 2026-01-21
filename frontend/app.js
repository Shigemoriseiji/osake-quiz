const API = "/api";
function qs(id){ return document.getElementById(id); }

function getState(){
  return JSON.parse(sessionStorage.getItem("osake_quiz_state") || "null");
}
function setState(st){
  sessionStorage.setItem("osake_quiz_state", JSON.stringify(st));
}

/* ===== 新規ゲーム開始 ===== */
async function startNewGame(){
  const res = await fetch(`${API}/questions?count=10`);
  const data = await res.json();

  const st = {
    idx: 0,
    total: data.questions.length,
    correct: 0,
    questions: data.questions,
    items: [],          // {questionId, selected, isCorrect}
    savedResultId: null // 自動保存の二重実行防止
  };
  setState(st);
  renderQuiz();
}

function renderQuiz(){
  const st = getState();
  if (!st || st.idx >= st.total) {
    location.href = "./end.html";
    return;
  }

  const q = st.questions[st.idx];

  const badge = qs("badge");
  badge.className = "badge";
  badge.textContent = "読";

  qs("counter").textContent = `第 ${st.idx + 1} 問 / ${st.total} 問`;
  qs("bar").style.width = `${Math.round((st.idx / st.total) * 100)}%`;

  const prompt = qs("prompt");
  prompt.textContent = q.prompt;
  qs("category").textContent = `カテゴリ：${q.category}`;

  ["A","B","C","D"].forEach(k => {
    const b = qs(k);
    b.className = "btn";
    b.disabled = false;
  });

  qs("A").textContent = `A：${q.option_a}`;
  qs("B").textContent = `B：${q.option_b}`;
  qs("C").textContent = `C：${q.option_c}`;
  qs("D").textContent = `D：${q.option_d}`;

  qs("feedback").textContent = "";
}

function lockButtons(){
  ["A","B","C","D"].forEach(k => qs(k).disabled = true);
}

function answer(selected){
  const st = getState();
  const q = st.questions[st.idx];
  const isCorrect = selected === q.answer;

  lockButtons();

  qs(q.answer).classList.add("correct");
  if (!isCorrect) qs(selected).classList.add("wrong");

  const badge = qs("badge");
  badge.className = "badge " + (isCorrect ? "ok" : "ng");
  badge.textContent = isCorrect ? "正" : "誤";

  const prompt = qs("prompt");
  prompt.classList.add("ink-bloom");
  setTimeout(() => prompt.classList.remove("ink-bloom"), 220);

  qs("feedback").textContent = `${q.explanation}`;

  st.items.push({ questionId: q.id, selected, isCorrect });
  if (isCorrect) st.correct += 1;

  setState(st);
  setTimeout(next, 1000);
}

function next(){
  const st = getState();
  st.idx += 1;
  setState(st);

  if (st.idx >= st.total) {
    location.href = "./end.html";
    return;
  }
  renderQuiz();
}

/* ===== 結果をDBへ保存（自動保存用） ===== */
async function autoSaveIfNeeded(){
  const st = getState();
  const savedEl = qs("saved");
  if (!st) return;

  // 二重保存防止：既に保存済みなら何もしない
  if (st.savedResultId) {
    if (savedEl) savedEl.textContent = `自動保存済み（結果ID: ${st.savedResultId}）`;
    return;
  }

  // items が空なら保存しない（異常遷移など）
  if (!Array.isArray(st.items) || st.items.length === 0) {
    if (savedEl) savedEl.textContent = "（未保存：回答データがありません）";
    return;
  }

  if (savedEl) savedEl.textContent = "自動保存中…";

  try {
    const body = { total: st.total, correct: st.correct, items: st.items };
    const res = await fetch(`${API}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      if (savedEl) savedEl.textContent = "自動保存に失敗しました。";
      return;
    }

    const data = await res.json();
    st.savedResultId = data.resultId || null;
    setState(st);

    if (savedEl) savedEl.textContent = `自動保存しました（結果ID: ${st.savedResultId}）`;
  } catch (_e) {
    if (savedEl) savedEl.textContent = "自動保存に失敗しました。";
  }
}

/* ===== 終了画面（点数＋自動保存） ===== */
function renderEnd(){
  const st = getState();
  if (!st) {
    location.href = "./index.html";
    return;
  }

  const scoreEl = qs("score");
  if (scoreEl) scoreEl.textContent = `${st.correct} / ${st.total}`;

  const msg = qs("msg");
  if (msg) {
    const rate = st.total ? Math.round((st.correct / st.total) * 100) : 0;
    msg.textContent = `正答率：${rate}%`;
  }

  autoSaveIfNeeded();
}

/* ===== 詳細結果（回答一覧） ===== */
function renderResult(){
  const st = getState();
  if (!st) return;

  qs("score").textContent = `${st.correct} / ${st.total}`;

  const ul = qs("list");
  ul.innerHTML = "";
  st.questions.forEach((q, i) => {
    const li = document.createElement("li");
    const your = st.items[i]?.selected || "-";
    const correct = q.answer;
    const correctText = q[`option_${correct.toLowerCase()}`];
    li.textContent = `第${i+1}問：正解 ${correct}：${correctText}（あなた：${your}）`;
    ul.appendChild(li);
  });
}

/* ★ 追加：もう一度ボタンを機能させる */
function restart(){
  // 状態を消して、新規ゲームへ
  sessionStorage.removeItem("osake_quiz_state");
  location.href = "./quiz.html";
}

/* ===== ページ初期化 ===== */
(async function(){
  const path = location.pathname.split("/").pop();

  if (path === "quiz.html") {
    await startNewGame();
  }

  if (path === "end.html") {
    renderEnd();
  }

  if (path === "result.html") {
    renderResult();
  }
})();
