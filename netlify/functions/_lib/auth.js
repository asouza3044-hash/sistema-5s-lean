const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurada (defina como variável de ambiente no Netlify / .env local).');
  }
  return secret;
}

function signSession(user) {
  return jwt.sign(
    { username: user.username, name: user.name, role: user.role, level: user.level },
    getSecret(),
    { expiresIn: '30d' }
  );
}

// Retorna o payload decodificado do token no header Authorization: Bearer <token>,
// ou null se ausente/inválido. Não lança — cada function decide o que fazer com null.
function getSessionFromEvent(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    return null;
  }
}

module.exports = { signSession, getSessionFromEvent };
