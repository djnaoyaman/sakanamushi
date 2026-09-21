// ---- Kanji data ----------------------------------------------------------
const KANJI_DATA = {
  fish: [
    { kanji: "鮪", reading: "まぐろ", meaning: "マグロ" },
    { kanji: "鰯", reading: "いわし", meaning: "イワシ" },
    { kanji: "鯉", reading: "こい", meaning: "コイ" },
    { kanji: "鮭", reading: "さけ", meaning: "サケ" },
    { kanji: "鯖", reading: "さば", meaning: "サバ" },
    { kanji: "鰹", reading: "かつお", meaning: "カツオ" },
    { kanji: "鱒", reading: "ます", meaning: "マス" },
    { kanji: "鮎", reading: "あゆ", meaning: "アユ" },
    { kanji: "鰤", reading: "ぶり", meaning: "ブリ" },
    { kanji: "鱈", reading: "たら", meaning: "タラ" },
    { kanji: "鰻", reading: "うなぎ", meaning: "ウナギ" },
    { kanji: "鮫", reading: "さめ", meaning: "サメ" },
    { kanji: "鯛", reading: "たい", meaning: "タイ" },
    { kanji: "鰈", reading: "かれい", meaning: "カレイ" },
    { kanji: "鯵", reading: "あじ", meaning: "アジ" },
    { kanji: "鰊", reading: "にしん", meaning: "ニシン" },
    { kanji: "鮃", reading: "ひらめ", meaning: "ヒラメ" },
    { kanji: "鱚", reading: "きす", meaning: "キス" },
  ],
  mushi: [
    { kanji: "蝶", reading: "ちょう", meaning: "チョウ" },
    { kanji: "蟹", reading: "かに", meaning: "カニ" },
    { kanji: "蛸", reading: "たこ", meaning: "タコ" },
    { kanji: "蝉", reading: "せみ", meaning: "セミ" },
    { kanji: "蟻", reading: "あり", meaning: "アリ" },
    { kanji: "蜂", reading: "はち", meaning: "ハチ" },
    { kanji: "蛍", reading: "ほたる", meaning: "ホタル" },
    { kanji: "蚊", reading: "か", meaning: "カ（吸血する虫）" },
    { kanji: "蛙", reading: "かえる", meaning: "カエル" },
    { kanji: "虹", reading: "にじ", meaning: "ニジ" },
    { kanji: "蝦", reading: "えび", meaning: "エビ" },
    { kanji: "蛤", reading: "はまぐり", meaning: "ハマグリ" },
    { kanji: "蜘", reading: "くも", meaning: "クモ（蜘蛛の一字）" },
    { kanji: "蟬", reading: "せみ", meaning: "セミ（旧字体）" },
    { kanji: "蛾", reading: "が", meaning: "ガ" },
  ],
};

const QUIZ_LENGTH = 10;

// ---- State ----------------------------------------------------------
let quizQueue = [];
let currentIndex = 0;
let correctCount = 0;
let currentCategory = "all";

// ---- Helpers ----------------------------------------------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolFor(category) {
  if (category === "fish") return KANJI_DATA.fish;
  if (category === "mushi") return KANJI_DATA.mushi;
  return [...KANJI_DATA.fish, ...KANJI_DATA.mushi];
}

function buildChoices(correctItem, pool) {
  const others = shuffle(pool.filter((p) => p.kanji !== correctItem.kanji)).slice(0, 3);
  return shuffle([correctItem, ...others]);
}

// ---- Zukan (encyclopedia) rendering ----------------------------------
function renderZukan() {
  const fishBody = document.querySelector("#fish-table tbody");
  const mushiBody = document.querySelector("#mushi-table tbody");
  KANJI_DATA.fish.forEach((item) => {
    fishBody.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${item.kanji}</td><td>${item.reading}</td><td>${item.meaning}</td></tr>`
    );
  });
  KANJI_DATA.mushi.forEach((item) => {
    mushiBody.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${item.kanji}</td><td>${item.reading}</td><td>${item.meaning}</td></tr>`
    );
  });
}

// ---- Quiz flow ----------------------------------------------------------
const quizStart = document.getElementById("quiz-start");
const quizPlay = document.getElementById("quiz-play");
const quizResult = document.getElementById("quiz-result");
const totalCountLabel = document.getElementById("total-count");

function updateTotalCount() {
  totalCountLabel.textContent = poolFor(currentCategory === "all" ? "all" : currentCategory).length;
}

document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentCategory = btn.dataset.cat;
    startQuiz(currentCategory);
  });
});

function startQuiz(category) {
  const pool = poolFor(category);
  const length = Math.min(QUIZ_LENGTH, pool.length);
  quizQueue = shuffle(pool).slice(0, length);
  currentIndex = 0;
  correctCount = 0;

  quizStart.classList.add("hidden");
  quizResult.classList.add("hidden");
  quizPlay.classList.remove("hidden");

  renderQuestion();
}

function renderQuestion() {
  const item = quizQueue[currentIndex];
  const pool = poolFor(currentCategory);

  document.getElementById("progress-label").textContent = `問題 ${currentIndex + 1} / ${quizQueue.length}`;
  document.getElementById("score-label").textContent = `正解 ${correctCount}`;
  document.getElementById("progress-fill").style.width = `${(currentIndex / quizQueue.length) * 100}%`;
  document.getElementById("question-kanji").textContent = item.kanji;
  document.getElementById("feedback").textContent = "";
  document.getElementById("next-btn").classList.add("hidden");

  const choicesBox = document.getElementById("choices");
  choicesBox.innerHTML = "";
  const choices = buildChoices(item, pool);

  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.reading;
    btn.addEventListener("click", () => selectAnswer(btn, choice, item));
    choicesBox.appendChild(btn);
  });
}

function selectAnswer(btn, choice, correctItem) {
  const allButtons = document.querySelectorAll(".choice-btn");
  allButtons.forEach((b) => (b.disabled = true));

  const feedback = document.getElementById("feedback");
  if (choice.kanji === correctItem.kanji) {
    btn.classList.add("correct");
    feedback.textContent = `正解！「${correctItem.kanji}」は「${correctItem.reading}」（${correctItem.meaning}）`;
    correctCount++;
  } else {
    btn.classList.add("wrong");
    allButtons.forEach((b) => {
      if (b.textContent === correctItem.reading) b.classList.add("correct");
    });
    feedback.textContent = `残念！正解は「${correctItem.reading}」（${correctItem.meaning}）`;
  }

  document.getElementById("score-label").textContent = `正解 ${correctCount}`;
  document.getElementById("next-btn").classList.remove("hidden");
}

document.getElementById("next-btn").addEventListener("click", () => {
  currentIndex++;
  if (currentIndex >= quizQueue.length) {
    showResult();
  } else {
    renderQuestion();
  }
});

function showResult() {
  quizPlay.classList.add("hidden");
  quizResult.classList.remove("hidden");
  document.getElementById("progress-fill").style.width = "100%";

  const total = quizQueue.length;
  document.getElementById("result-score").textContent = `${total}問中 ${correctCount}問 正解！`;

  let comment;
  const rate = correctCount / total;
  if (rate === 1) comment = "満点！魚へん・虫へんマスターです🎉";
  else if (rate >= 0.7) comment = "なかなかの漢字力！その調子👏";
  else if (rate >= 0.4) comment = "図鑑を見て、もう一度挑戦してみよう！";
  else comment = "まずは図鑑で読み方をチェックしてみよう📖";
  document.getElementById("result-comment").textContent = comment;

  const shareText = `「さかなむし」で魚へん・虫へん漢字クイズに挑戦！${total}問中${correctCount}問正解でした🐟🐛`;
  const shareUrl = "https://djnaoyaman.github.io/sakanamushi/";
  document.getElementById("share-btn").href =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
}

document.getElementById("retry-btn").addEventListener("click", () => {
  quizResult.classList.add("hidden");
  quizStart.classList.remove("hidden");
});

// ---- Mode nav (quiz / zukan) ----------------------------------------
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.dataset.mode;
    document.getElementById("quiz-section").classList.toggle("active", mode === "quiz");
    document.getElementById("zukan-section").classList.toggle("active", mode === "zukan");
  });
});

// ---- Init ----------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();
updateTotalCount();
renderZukan();
