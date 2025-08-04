require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require('cors');

const app = express();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.1402058435977150494,
  clientSecret: process.env.1402058435977150494
  callbackURL: process.env.https://discord.com/oauth2/authorize?client_id=1402058435977150494
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Nu ești autentificat' });
}

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:8080');
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('http://localhost:8080'));
});

app.get('/api/user', ensureAuth, (req, res) => {
  res.json({ username: req.user.username, id: req.user.id });
});

const tests = {
  RADIO: [
    {
      question: 'Care este formula chimică a apei?',
      options: ['H2O', 'CO2', 'O2'],
      correct: 'H2O'
    }
  ]
};

app.get('/api/tests/:testName', ensureAuth, (req, res) => {
  const test = tests[req.params.testName];
  if (!test) return res.status(404).json({ error: 'Test inexistent' });
  res.json(test);
});

app.listen(3000, () => console.log('Server pornit pe http://localhost:3000'));
