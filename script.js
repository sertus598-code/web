let currentQuestion = 0;
let score = 0;
let questions = [];
let timeLeft = 300; // 5 minute

// Cronometru
const timerEl = document.getElementById("timer");
const interval = setInterval(() => {
  if (timeLeft <= 0) {
    clearInterval(interval);
    alert("Timpul a expirat!");
    window.location.reload();
  }
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerEl.textContent = `Timp rămas: ${minutes}m ${seconds}s`;
  timeLeft--;
}, 1000);

async function loadQuestions() {
  const res = await fetch("http://localhost:3000/questions");
  questions = await res.json();
  showQuestion();
}

function showQuestion() {
  const q = questions[currentQuestion];
  document.getElementById("question-title").textContent = q.question;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(idx);
    answersDiv.appendChild(btn);
  });
}

function selectAnswer(index) {
  const correct = questions[currentQuestion].correct;
  if (index === correct) score++;
  nextQuestion();
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    clearInterval(interval);
    alert(`Test terminat! Scor: ${score}/${questions.length}`);
    // Trimite scorul către server
    fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({score})
    });
  }
}

loadQuestions();
