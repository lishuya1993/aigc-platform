#!/usr/bin/env python3
"""Read-only MCP diagnostics for the AIGC/Sub2API server."""

from __future__ import annotations

import json
import os
import posixpath
import re
import shlex
import subprocess
import sys
from typing import Any


HOST = os.environ.get("AIGC_OPS_SSH_HOST", "82.158.89.133")
USER = os.environ.get("AIGC_OPS_SSH_USER", "root")
KEY_FILE = os.path.expanduser(os.environ.get("AIGC_OPS_SSH_KEY", "~/.ssh/aigc_ops_codex"))
KNOWN_HOSTS = os.path.expanduser(os.environ.get("AIGC_OPS_KNOWN_HOSTS", "~/.ssh/known_hosts"))
MAX_OUTPUT = 120_000
READABLE_ROOTS = (
    "/var/log",
    "/etc/nginx",
    "/opt/aigc-platform/logs",
    "/opt/aigc-platform/config",
    "/opt/aigc-platform/deploy",
    "/opt/sub2api",
    "/opt/new-api",
)
SENSITIVE_NAMES = (
    ".env",
    "authorized_keys",
    "credential",
    "id_rsa",
    "id_ed25519",
    "private_key",
    "secret",
    "shadow",
)
SAFE_NAME = re.compile(r"^[A-Za-z0-9_.@-]+$")


def _ssh(command: str, timeout: int = 30) -> str:
    if not os.path.isfile(KEY_FILE):
        raise RuntimeError(f"SSH key is missing: {KEY_FILE}")
    cmd = [
        "/usr/bin/ssh",
        "-i", KEY_FILE,
        "-o", "IdentitiesOnly=yes",
        "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=8",
        "-o", "StrictHostKeyChecking=yes",
        "-o", f"UserKnownHostsFile={KNOWN_HOSTS}",
        f"{USER}@{HOST}",
        command,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"SSH command timed out after {timeout}s") from exc
    output = (result.stdout + result.stderr).strip()
    if len(output) > MAX_OUTPUT:
        output = output[:MAX_OUTPUT] + "\n[output truncated]"
    if result.returncode != 0:
        raise RuntimeError(output or f"SSH exited with code {result.returncode}")
    return output or "(no output)"


def _safe_path(path: str) -> str:
    if not isinstance(path, str) or not path.startswith("/"):
        raise ValueError("path must be absolute")
    normalized = posixpath.normpath(path)
    if not any(normalized == root or normalized.startswith(root + "/") for root in READABLE_ROOTS):
        raise ValueError("path is outside the approved diagnostic directories")
    if any(name in normalized.lower() for name in SENSITIVE_NAMES):
        raise ValueError("sensitive credential files cannot be read")
    return normalized


def _positive_int(arguments: dict[str, Any], key: str, default: int, maximum: int) -> int:
    value = arguments.get(key, default)
    if not isinstance(value, int) or not 1 <= value <= maximum:
        raise ValueError(f"{key} must be an integer between 1 and {maximum}")
    return value


def server_status(_: dict[str, Any]) -> str:
    command = (
        "LC_ALL=C; hostname; date -Is; uptime; free -h; df -h /; "
        "systemctl --failed --no-pager; "
        "docker ps --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}'"
    )
    return _ssh(command)


def docker_overview(_: dict[str, Any]) -> str:
    command = (
        "LC_ALL=C; docker ps -a --format "
        "'table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}'; "
        "printf '\\nRESOURCE USAGE\\n'; docker stats --no-stream --format "
        "'table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}'"
    )
    return _ssh(command, timeout=45)


def container_logs(arguments: dict[str, Any]) -> str:
    container = arguments.get("container", "")
    if not isinstance(container, str) or not SAFE_NAME.fullmatch(container):
        raise ValueError("container must contain only letters, digits, dot, underscore, @, or dash")
    lines = _positive_int(arguments, "lines", 200, 2000)
    return _ssh(shlex.join(["docker", "logs", "--tail", str(lines), container]), timeout=45)


def nginx_diagnostics(_: dict[str, Any]) -> str:
    command = (
        "LC_ALL=C; if command -v nginx >/dev/null 2>&1; then nginx -t; nginx -T 2>&1; "
        "elif docker ps --format '{{.Names}}' | grep -qx nginx; then "
        "docker exec nginx nginx -t; docker exec nginx nginx -T 2>&1; "
        "else echo 'Nginx binary/container was not found'; fi"
    )
    return _ssh(command, timeout=45)


def read_log(arguments: dict[str, Any]) -> str:
    path = _safe_path(arguments.get("path", ""))
    lines = _positive_int(arguments, "lines", 200, 2000)
    output = _ssh(shlex.join(["tail", "-n", str(lines), "--", path]), timeout=45)
    contains = arguments.get("contains")
    if contains is not None:
        if not isinstance(contains, str) or len(contains) > 200:
            raise ValueError("contains must be a string of at most 200 characters")
        output = "\n".join(line for line in output.splitlines() if contains in line)
        return output or "(no matching lines)"
    return output


def list_path(arguments: dict[str, Any]) -> str:
    path = _safe_path(arguments.get("path", ""))
    depth = _positive_int(arguments, "depth", 2, 5)
    command = shlex.join(["find", path, "-maxdepth", str(depth), "-printf", "%y %p\\n"])
    return _ssh(command, timeout=45)


TOOLS = {
    "server_status": {
        "description": "Show health, failed services, disk/memory use, and running containers on the fixed AIGC server.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "handler": server_status,
    },
    "docker_overview": {
        "description": "List AIGC/Sub2API containers and a one-shot resource usage snapshot.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "handler": docker_overview,
    },
    "container_logs": {
        "description": "Read the recent logs of one named container without changing it.",
        "inputSchema": {"type": "object", "properties": {"container": {"type": "string"}, "lines": {"type": "integer", "minimum": 1, "maximum": 2000, "default": 200}}, "required": ["container"], "additionalProperties": False},
        "handler": container_logs,
    },
    "nginx_diagnostics": {
        "description": "Validate and display the active Nginx configuration.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "handler": nginx_diagnostics,
    },
    "read_log": {
        "description": "Read an approved server log path, optionally filtering literal text locally.",
        "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}, "lines": {"type": "integer", "minimum": 1, "maximum": 2000, "default": 200}, "contains": {"type": "string", "maxLength": 200}}, "required": ["path"], "additionalProperties": False},
        "handler": read_log,
    },
    "list_path": {
        "description": "List files under an approved AIGC/Sub2API diagnostic directory.",
        "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}, "depth": {"type": "integer", "minimum": 1, "maximum": 5, "default": 2}}, "required": ["path"], "additionalProperties": False},
        "handler": list_path,
    },
}


def _result(request_id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def _error(request_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def _handle(message: dict[str, Any]) -> dict[str, Any] | None:
    request_id, method = message.get("id"), message.get("method")
    if method == "initialize":
        return _result(request_id, {"protocolVersion": message.get("params", {}).get("protocolVersion", "2025-03-26"), "capabilities": {"tools": {"listChanged": False}}, "serverInfo": {"name": "aigc-ops", "version": "0.1.0"}})
    if method in {"notifications/initialized", "notifications/cancelled"}:
        return None
    if method == "ping":
        return _result(request_id, {})
    if method == "tools/list":
        return _result(request_id, {"tools": [{"name": name, "description": item["description"], "inputSchema": item["inputSchema"]} for name, item in TOOLS.items()]})
    if method == "tools/call":
        params, name = message.get("params", {}), message.get("params", {}).get("name")
        tool = TOOLS.get(name)
        if tool is None:
            return _error(request_id, -32602, f"unknown tool: {name}")
        try:
            text = tool["handler"](params.get("arguments", {}))
            return _result(request_id, {"content": [{"type": "text", "text": text}]})
        except (ValueError, RuntimeError) as exc:
            return _result(request_id, {"content": [{"type": "text", "text": str(exc)}], "isError": True})
    if request_id is None:
        return None
    return _error(request_id, -32601, f"method not found: {method}")


def main() -> None:
    for raw_line in sys.stdin.buffer:
        line = raw_line.strip()
        if not line:
            continue
        try:
            response = _handle(json.loads(line))
        except Exception as exc:
            response = _error(None, -32700, f"invalid request: {exc}")
        if response is not None:
            sys.stdout.write(json.dumps(response, ensure_ascii=False, separators=(",", ":")) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
