"""StudyOS local server — zero third-party dependencies."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from copy import deepcopy
import json, os, tempfile, threading, webbrowser

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "studyos.json"
PUBLIC = ROOT / "public"
DATA_LOCK = threading.RLock()
MAX_BODY = 10 * 1024 * 1024

DEFAULT = {
    "settings": {"userName":"Estudante","profilePhoto":"","palette":"violet","achievementsNotifications":True,"cutoff":70,"annualGoal":10000,"exam":"ENEM","examTypes":["ENEM","Concurso","Vestibular"],"studyMinutes":50,"breakMinutes":10,"theme":"light"},
    "achievementsUnlocked": [],
    "knowledgeAreas": [
        {"id":"basicos","name":"Conhecimentos Básicos"},
        {"id":"especificos","name":"Conhecimentos Específicos"}
    ],
    "subjects": [
        {"id":"mat","areaId":"basicos","name":"Matemática","color":"#6c5ce7","topics":["Funções","Geometria","Probabilidade"]},
        {"id":"ling","areaId":"basicos","name":"Linguagens","color":"#00a896","topics":["Interpretação","Gramática","Literatura"]},
        {"id":"hum","areaId":"especificos","name":"Humanas","color":"#f4a261","topics":["História","Geografia","Filosofia"]},
        {"id":"nat","areaId":"especificos","name":"Natureza","color":"#e76f51","topics":["Física","Química","Biologia"]}
    ],
    "questionSessions": [
        {"id":1,"date":"2026-08-03","subject":"mat","topic":"Funções","total":30,"correct":21,"difficulty":"medio","guessed":3,"doubted":5,"skipped":1},
        {"id":2,"date":"2026-08-05","subject":"nat","topic":"Física","total":25,"correct":14,"difficulty":"dificil","guessed":4,"doubted":6,"skipped":2},
        {"id":3,"date":"2026-08-08","subject":"ling","topic":"Interpretação","total":35,"correct":29,"difficulty":"medio","guessed":2,"doubted":3,"skipped":0},
        {"id":4,"date":"2026-08-11","subject":"hum","topic":"Geografia","total":20,"correct":16,"difficulty":"facil","guessed":1,"doubted":2,"skipped":0}
    ],
    "lessons": [{"id":1,"date":"2026-08-12","subject":"nat","topic":"Química","title":"Estequiometria do zero","minutes":60,"status":"concluida"}],
    "exams": [
        {"id":1,"name":"ENEM 2024 — Dia 1","type":"ENEM","date":"2026-06-10","total":90,"correct":61,"guessed":8,"scores":{"ling":32,"hum":29}},
        {"id":2,"name":"Simulado ENEM 01","type":"ENEM","date":"2026-07-15","total":90,"correct":66,"guessed":6,"scores":{"ling":35,"hum":31}},
        {"id":3,"name":"Simulado ENEM 02","type":"ENEM","date":"2026-08-10","total":90,"correct":71,"guessed":5,"scores":{"ling":37,"hum":34}}
    ],
    "essays": [
        {"id":1,"date":"2026-06-15","theme":"Desinformação no Brasil","axis":"Tecnologia","score":720,"competencies":[160,140,140,140,140]},
        {"id":2,"date":"2026-07-20","theme":"Invisibilidade do trabalho de cuidado","axis":"Sociedade","score":800,"competencies":[160,160,160,140,180]},
        {"id":3,"date":"2026-08-09","theme":"Desafios da inclusão digital","axis":"Tecnologia","score":860,"competencies":[180,160,180,160,180]}
    ],
    "studySessions": [
        {"id":1,"date":"2026-08-03","subject":"mat","minutes":50},{"id":2,"date":"2026-08-05","subject":"nat","minutes":100},
        {"id":3,"date":"2026-08-08","subject":"ling","minutes":50},{"id":4,"date":"2026-08-11","subject":"hum","minutes":50},{"id":5,"date":"2026-08-12","subject":"nat","minutes":60}
    ]
}

def load_data():
    with DATA_LOCK:
        if not DATA.exists():
            DATA.parent.mkdir(parents=True, exist_ok=True)
            save_data(deepcopy(DEFAULT))
        try:
            payload = json.loads(DATA.read_text(encoding="utf-8"))
            return payload if isinstance(payload, dict) else deepcopy(DEFAULT)
        except (json.JSONDecodeError, OSError) as exc:
            print(f"[StudyOS] Não foi possível ler os dados: {exc}")
            return deepcopy(DEFAULT)

def save_data(payload):
    if not isinstance(payload, dict):
        raise ValueError("A raiz dos dados deve ser um objeto JSON.")
    with DATA_LOCK:
        DATA.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=DATA.parent, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as file:
                json.dump(payload, file, ensure_ascii=False, indent=2)
                file.flush()
                os.fsync(file.fileno())
            os.replace(tmp, DATA)
        finally:
            if os.path.exists(tmp): os.unlink(tmp)

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store" if urlparse(self.path).path.startswith("/api/") else "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()
    def is_local_origin(self):
        origin=self.headers.get("Origin")
        if not origin: return True
        try: return urlparse(origin).hostname in {"localhost", "127.0.0.1", "::1"}
        except ValueError: return False
    def send_json(self, value, status=200):
        body=json.dumps(value,ensure_ascii=False).encode()
        self.send_response(status); self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        path=urlparse(self.path).path
        if path == "/api/data": return self.send_json(load_data())
        if path == "/health": return self.send_json({"ok":True,"app":"StudyOS"})
        return super().do_GET()
    def do_PUT(self):
        if urlparse(self.path).path != "/api/data": return self.send_json({"error":"Não encontrado"},404)
        if not self.is_local_origin(): return self.send_json({"error":"Origem não autorizada"},403)
        try:
            size=int(self.headers.get("Content-Length",0))
            if size <= 0: return self.send_json({"error":"Corpo JSON ausente"},400)
            if size > MAX_BODY: return self.send_json({"error":"Backup maior que 10 MB"},413)
            payload=json.loads(self.rfile.read(size))
            save_data(payload); self.send_json({"ok":True})
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError, OSError) as exc: self.send_json({"error":str(exc)},400)
    def do_POST(self):
        if urlparse(self.path).path != "/api/shutdown": return self.send_json({"error":"Não encontrado"},404)
        if not self.is_local_origin(): return self.send_json({"error":"Origem não autorizada"},403)
        self.send_json({"ok":True,"message":"StudyOS encerrando"})
        threading.Thread(target=self.server.shutdown, daemon=True).start()
    def log_message(self, fmt, *args): print("[StudyOS]", fmt % args)

class StudyServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    os.chdir(PUBLIC)
    port=int(os.environ.get("STUDYOS_PORT","8080"))
    try:
        server = StudyServer(("127.0.0.1",port),Handler)
    except OSError as exc:
        print(f"\n[ERRO] Não foi possível usar a porta {port}.")
        print("Talvez outro programa ou outra instância do StudyOS já esteja usando essa porta.")
        print(f"Detalhes: {exc}")
        raise SystemExit(1)
    print(f"StudyOS disponível em http://localhost:{port}")
    print("Para encerrar, use Ctrl+C ou execute encerrar.bat.")
    if os.environ.get("STUDYOS_OPEN_BROWSER") == "1":
        threading.Timer(0.7, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStudyOS encerrado com segurança.")
    finally:
        server.server_close()
