"""
server.py — خادم مِجهر على Replit
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from analyzer import analyze_notes, QuotaExhaustedError, ModelOverloadedError

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
CORS(app)

@app.before_request
def block_sensitive_files():
    if request.path.startswith('/.') or request.path.endswith('.py') or request.path.endswith('.env'):
        return "ممنوع الوصول", 403

@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/analyze-notes", methods=["POST"])
def api_analyze_notes():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "الرجاء إدخال نص الإيضاحات المالية."}), 400

    if len(text) > 20000:
        text = text[:20000]

    try:
        result = analyze_notes(text)
        return jsonify({"result": result})
    except ModelOverloadedError:
        return jsonify({
            "error": "خدمة الذكاء الاصطناعي مزدحمة حاليًا. انتظر لحظات ثم أعد المحاولة."
        }), 503
    except QuotaExhaustedError:
        return jsonify({
            "error": "تم استهلاك الحصة المجانية اليومية من Gemini بالكامل. "
                     "حاول مجددًا بعد ساعات قليلة أو غدًا."
        }), 503
    except Exception:
        app.logger.exception("فشل تحليل الإيضاحات")
        return jsonify({"error": "حدث خطأ غير متوقع أثناء التحليل. حاول مرة أخرى."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
