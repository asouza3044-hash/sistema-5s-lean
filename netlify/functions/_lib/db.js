const { neon } = require('@neondatabase/serverless');

let sqlClient = null;

function getSql() {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não configurada (defina como variável de ambiente no Netlify / .env local).');
    }
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

module.exports = { getSql };
