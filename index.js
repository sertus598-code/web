require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require('cors');

const app = express();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  CALLBACK_URL,
  SESSION_SECRET
} = process.env;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Middleware pentru protejarea rutelor
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// Rute
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:3001'); // redirect frontend după login
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.get('/api/user', ensureAuth, (req, res) => {
  res.json({ username: req.user.username, id: req.user.id });
});

// Exemplu întrebări test
const tests = {
  RADIO: [
    {
      question: 'Care este formula chimică a apei?',
      options: ['H2O', 'CO2', 'O2'],
      correct: 'H2O'
    }
  ],
  BLS: [
    {
      question: 'Ce înseamnă BLS?',
      options: ['Basic Life Support', 'Blood Level Screening', 'Brain Lung Sync'],
      correct: 'Basic Life Support'
    }
  ]
};

app.get('/api/tests/:testName', ensureAuth, (req, res) => {
  const test = tests[req.params.testName];
  if (!test) return res.status(404).json({ error: 'Test not found' });
  res.json(test);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server backend pornit pe http://localhost:${PORT}`));
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <title>Teste medicale</title>
</head>
<body>
  <h1>Teste medicale</h1>
  <button id="login-btn">Login cu Discord</button>
  <button id="logout-btn" style="display:none;">Logout</button>
  <div id="welcome"></div>
  <div id="test-area" style="display:none;"></div>

  <script>
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const welcome = document.getElementById('welcome');
    const testArea = document.getElementById('test-area');

    loginBtn.onclick = () => {
      window.location.href = 'http://localhost:3000/auth/discord';
    };

    logoutBtn.onclick = () => {
      fetch('http://localhost:3000/logout', { credentials: 'include' })
        .then(() => window.location.reload());
    };

    // Verifică dacă ești logat și afișează testele
    fetch('http://localhost:3000/api/user', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(user => {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline';
        welcome.textContent = `Bun venit, ${user.username}!`;
        showTests();
      })
      .catch(() => {
        loginBtn.style.display = 'inline';
        logoutBtn.style.display = 'none';
      });

    function showTests() {
      testArea.style.display = 'block';
      testArea.innerHTML = '<h2>Teste disponibile:</h2><ul>' +
        '<li><button onclick="loadTest(\'RADIO\')">RADIO</button></li>' +
        '<li><button onclick="loadTest(\'BLS\')">BLS</button></li>' +
        '</ul><div id="questions"></div>';
    }

    function loadTest(testName) {
      fetch(`http://localhost:3000/api/tests/${testName}`, { credentials: 'include' })
        .then(res => res.json())
        .then(questions => {
          const qDiv = document.getElementById('questions');
          qDiv.innerHTML = '';
          questions.forEach((q, i) => {
            const qElem = document.createElement('div');
            qElem.innerHTML = `<p>${i+1}. ${q.question}</p>`;
            q.options.forEach(opt => {
              const id = `q${i}_${opt}`;
              qElem.innerHTML += `
                <input type="radio" id="${id}" name="q${i}" value="${opt}" required>
                <label for="${id}">${opt}</label><br>
              `;
            });
            qDiv.appendChild(qElem);
          });

          const submitBtn = document.createElement('button');
          submitBtn.textContent = 'Trimite răspunsurile';
          submitBtn.onclick = () => checkAnswers(questions);
          qDiv.appendChild(submitBtn);
        });
    }

    function checkAnswers(questions) {
      let allCorrect = true;
      for(let i = 0; i < questions.length; i++) {
        const options = document.getElementsByName(`q${i}`);
        let selected = null;
        for (const opt of options) {
          if(opt.checked) selected = opt.value;
        }
        if(selected !== questions[i].correct) allCorrect = false;
      }
      alert(allCorrect ? 'Felicitări, toate răspunsurile sunt corecte!' : 'Unele răspunsuri sunt greșite. Mai încearcă!');
    }
  </script>
</body>
</html>
