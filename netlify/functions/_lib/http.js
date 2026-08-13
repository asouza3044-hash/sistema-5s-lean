const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

function noContent() {
  return { statusCode: 204, headers: CORS_HEADERS, body: '' };
}

function isPreflight(event) {
  return event.httpMethod === 'OPTIONS';
}

module.exports = { json, noContent, isPreflight, CORS_HEADERS };
