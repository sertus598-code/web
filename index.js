import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import dotenv from 'dotenv';
import fs from 'fs';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- SESSION SETUP ----
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// ---- DISCORD STRATEGY ----
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// ---- STATIC FILES ----
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());

// ---- ROUTES ----
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/test.html');
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// ---- QUESTIONS ----
app.get('/questions', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const data = fs.readFileSync('./server/questions.json');
  res.json(JSON.parse(data));
});

// ---- SUBMIT SCORE ----
app.post('/submit', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { score } = req.body;
  const responsesPath = './server/responses.json';

  const existing = fs.existsSync(responsesPath)
    ? JSON.parse(fs.readFileSync(responsesPath))
    : [];

  existing.push({
    user: req.user.username,
    id: req.user.id,
    score,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(responsesPath, JSON.stringify(existing, null, 2));
  res.json({ status: 'saved' });
});

// ---- SERVER START ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server live at http://localhost:${PORT}`));
