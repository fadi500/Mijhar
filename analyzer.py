import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from prompt import PROMPT

load_dotenv()

_client = None


class QuotaExhaustedError(Exception):
    """حصة Gemini المجانية نفدت لجميع النماذج المتاحة."""


class ModelOverloadedError(Exception):
    """جميع النماذج مزدحمة مؤقتًا (503 UNAVAILABLE) بعد عدة محاولات."""


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY غير موجود. الرجاء إضافة مفتاح Gemini API.")
        _client = genai.Client(api_key=api_key)
    return _client


# النماذج بالترتيب: الأحدث أولًا، وعند نفاد حصة أحدها ينتقل للتالي تلقائيًا
# (حصة Google المجانية محسوبة لكل نموذج على حدة، فهذا يضاعف عدد التحليلات اليومية)
MODELS = ["gemini-flash-latest", "gemini-2.5-flash"]


def _is_quota_error(e):
    """فحص منظّم لخطأ نفاد الحصة (وليس مطابقة نصية قد تخطئ)."""
    return isinstance(e, genai_errors.APIError) and (
        e.code == 429 or e.status == "RESOURCE_EXHAUSTED"
    )


def _is_overload_error(e):
    """خطأ ازدحام مؤقت من Google (503) — يستحق تجربة نموذج آخر أو إعادة المحاولة."""
    return isinstance(e, genai_errors.APIError) and (
        e.code == 503 or e.status == "UNAVAILABLE"
    )


def analyze_notes(text):
    """يحلل الإيضاحات عبر Gemini مع تنقّل تلقائي بين النماذج عند نفاد الحصة أو الازدحام."""
    client = _get_client()
    last_quota_err = None
    last_overload_err = None
    transient_seen = False
    # جولتان على قائمة النماذج: الازدحام والردود الفارغة غالبًا تزول خلال ثوانٍ
    for attempt in range(2):
        if attempt > 0:
            time.sleep(2)
        transient_seen = False
        for model in MODELS:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=PROMPT + "\n\n" + text
                )
                if not response.text:
                    # رد فارغ عابر من النموذج — عامله كازدحام وجرّب نموذجًا/جولة أخرى
                    transient_seen = True
                    continue
                return response.text
            except Exception as e:
                if _is_quota_error(e):
                    last_quota_err = e
                    continue  # حصة هذا النموذج انتهت — جرّب النموذج التالي
                if _is_overload_error(e):
                    last_overload_err = e
                    transient_seen = True
                    continue  # النموذج مزدحم مؤقتًا — جرّب النموذج التالي
                raise
        if not transient_seen:
            break  # كل الإخفاقات نفاد حصة (دائم اليوم) — لا فائدة من جولة ثانية
    if transient_seen:
        # حتى لو نفدت حصة أحد النماذج، الازدحام مؤقت — رسالة "أعد المحاولة بعد لحظات" أدق للمستخدم
        raise ModelOverloadedError("النماذج مزدحمة مؤقتًا") from last_overload_err
    raise QuotaExhaustedError("نفدت الحصة اليومية لجميع النماذج") from last_quota_err
