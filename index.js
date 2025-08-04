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
