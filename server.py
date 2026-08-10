import http.server
import socketserver
import json
import os

PORT = 8085
DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')

if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            "activity_logs": [],
            "factory_board": {},
            "audit_scores": {},
            "users": {}
        }, f)

class SyncHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/sync':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            except Exception as e:
                self.wfile.write(b'{}')
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/sync':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                incoming_data = json.loads(post_data.decode('utf-8'))
                
                # Ler dados existentes e fazer merge dos logs e board
                existing_data = {}
                if os.path.exists(DB_FILE):
                    try:
                        with open(DB_FILE, 'r', encoding='utf-8') as f:
                            existing_data = json.load(f)
                    except Exception:
                        existing_data = {}

                # Merge logs (evitar duplicações pelo id)
                merged_logs = incoming_data.get('activity_logs', [])
                existing_logs = existing_data.get('activity_logs', [])
                
                existing_ids = {l['id'] for l in existing_logs if 'id' in l}
                for log in merged_logs:
                    if log.get('id') not in existing_ids:
                        existing_logs.unshift(log) if hasattr(existing_logs, 'unshift') else existing_logs.insert(0, log)
                        existing_ids.add(log.get('id'))
                
                existing_logs = existing_logs[:60] # Limitar a 60 últimos

                # Merge factory board
                merged_board = {**existing_data.get('factory_board', {}), **incoming_data.get('factory_board', {})}
                
                # Merge users
                merged_users = {**existing_data.get('users', {}), **incoming_data.get('users', {})}

                full_data = {
                    "activity_logs": existing_logs,
                    "factory_board": merged_board,
                    "audit_scores": {**existing_data.get('audit_scores', {}), **incoming_data.get('audit_scores', {})},
                    "users": merged_users
                }

                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    json.dump(full_data, f, ensure_ascii=False, indent=2)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(full_data, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    print(f"Iniciando Servidor 5S Impaktto com API Sync na porta {PORT}...")
    with socketserver.TCPServer(("", PORT), SyncHandler) as httpd:
        httpd.serve_forever()
