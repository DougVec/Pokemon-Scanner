"""Servidor local do Pokémon Face Scan.

Serve a pasta web/ em http://localhost:8765 e abre o navegador.
A câmera só funciona em localhost ou HTTPS, por isso o servidor é necessário.

Uso:  python3 server/server.py [porta]
"""
import functools
import http.server
import sys
import webbrowser
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent.parent / "web"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=WEB_DIR)
    with http.server.ThreadingHTTPServer(("localhost", PORT), handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Pokémon Face Scan rodando em {url}  (Ctrl+C para parar)")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")


if __name__ == "__main__":
    main()
