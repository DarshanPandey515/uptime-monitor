"""
Add to your app/views.py (or create app/views_health.py and include in urls.py):

    from app.views_health import health_check
    path('health/', health_check),
"""

from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "ok"})
