import webbrowser
import os
import sys

# Change directory to this script's location
DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(DIR)

import backend

PORT = 8000

print("==================================================================")
print(" EquipTrust - Starting Application Server")
print(" URL: http://localhost:8000")
print("==================================================================")

backend.init_db()
backend.seed_db()

try:
    webbrowser.open(f"http://localhost:{PORT}")
    import socketserver
    with socketserver.TCPServer(("", PORT), backend.EquipTrustHandler) as httpd:
        print(f"Server is live at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
