#!/usr/bin/env python3
"""Local Edge TTS service used by the development profile.

POST /tts accepts {text, voice}; GET /tts/<file> serves generated audio.
"""
import asyncio
import json
import os
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

import edge_tts

PORT = int(os.environ.get("TTS_PORT", "8799"))
OUTPUT_DIR = Path(os.environ.get("TTS_OUTPUT_DIR", Path(__file__).resolve().parents[1] / "runtime" / "tts"))
VOICES = {
    "zh-CN-XiaoxiaoNeural", "zh-CN-XiaoyiNeural", "zh-CN-YunxiNeural",
    "zh-CN-YunjianNeural", "zh-CN-YunyangNeural", "zh-CN-liaoning-XiaobeiNeural",
    "zh-CN-shaanxi-XiaoniNeural",
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_GET(self):
        if not self.path.startswith("/tts/"):
            self.send_error(404)
            return
        filename = Path(unquote(self.path.removeprefix("/tts/"))).name
        target = OUTPUT_DIR / filename
        if not target.is_file() or target.suffix.lower() != ".mp3":
            self.send_error(404)
            return
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != "/tts":
            self._json(404, {"code": 404, "msg": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length) or b"{}")
            text = str(payload.get("text") or "").strip()
            if not text:
                self._json(400, {"code": 400, "msg": "缺少文本"})
                return
            if len(text) > 3000:
                self._json(400, {"code": 400, "msg": "文本过长"})
                return
            voice = str(payload.get("voice") or "zh-CN-XiaoxiaoNeural")
            if voice not in VOICES:
                voice = "zh-CN-XiaoxiaoNeural"
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            filename = f"{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}.mp3"
            asyncio.run(edge_tts.Communicate(text, voice).save(str(OUTPUT_DIR / filename)))
            self._json(200, {"code": 200, "data": {"url": f"http://127.0.0.1:{PORT}/tts/{filename}", "voice": voice}})
        except Exception as exc:
            self._json(500, {"code": 500, "msg": str(exc)[:200]})

    def _json(self, status, data):
        content = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    print(f"Local Edge TTS listening on http://127.0.0.1:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
