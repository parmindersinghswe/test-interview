// Simple admin authentication system
const adminSessions = new Map();

function createAdminSession(username) {
  const token = Buffer.from(`${username}-${Date.now()}`).toString('base64');
  adminSessions.set(token, {
    username,
    isAdmin: true,
    created: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  return token;
}

function validateAdminSession(token) {
  const session = adminSessions.get(token);
  if (session && session.expires > Date.now()) {
    return session;
  }
  if (session) {
    adminSessions.delete(token);
  }
  return null;
}

function clearAdminSession(token) {
  adminSessions.delete(token);
}

module.exports = {
  createAdminSession,
  validateAdminSession,
  clearAdminSession
};