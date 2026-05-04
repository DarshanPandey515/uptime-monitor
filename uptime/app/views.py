from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Website, CheckResult, UserProfile, AlertSettings
from .serializers import (
    WebsiteSerializer, CheckResultSerializer,
    UserProfileSerializer, AlertSettingsSerializer,
    ChangePasswordSerializer,
    RegisterSerializer
)
from .tasks import start_monitoring, stop_monitoring


# ──────────────────────────────────────────────
#  Auth
# ──────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        return Response({
            "id":           user.id,
            "username":     user.username,
            "display_name": profile.display_name if profile else '',
        })


class LoginAPIView(APIView):
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user is None:
            return Response({"error": "Invalid Credentials."}, status=400)

        refresh = RefreshToken.for_user(user)
        response = Response({"access": str(refresh.access_token)})
        response.set_cookie(
            key="refresh_token", value=str(refresh),
            httponly=True, secure=False, samesite="Lax",
        )
        return response


class RefreshAPIView(APIView):
    permission_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"error": "No refresh token."}, status=401)
        try:
            refresh = RefreshToken(refresh_token)
            return Response({"access": str(refresh.access_token)})
        except TokenError:
            return Response({"error": "Invalid refresh token"}, status=401)


class RegisterAPIView(APIView):
    permission_classes = []

    def post(self, request):
        # already imported above in real file
        from .serializers import RegisterSerializer
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response(
            {"access": str(refresh.access_token),
                           "detail": "Account created successfully."},
            status=201,
        )
        response.set_cookie(
            key="refresh_token", value=str(refresh),
            httponly=True, secure=False, samesite="Lax",
        )
        return response
    

class RegisterAPIView(APIView):
    permission_classes = []
 
    def post(self, request):
        from .serializers import RegisterSerializer           
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
 
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response(
            {"access": str(refresh.access_token), "detail": "Account created successfully."},
            status=201,
        )
        response.set_cookie(
            key="refresh_token", value=str(refresh),
            httponly=True, secure=False, samesite="Lax",
        )
        return response
 

class LogoutAPIView(APIView):
    def post(self, request):
        response = Response({"message": "Logged Out"})
        response.delete_cookie("refresh_token")
        return response


# ──────────────────────────────────────────────
#  Profile  (display name)
# ──────────────────────────────────────────────

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_or_create_profile(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        profile = self._get_or_create_profile(request.user)
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        profile    = self._get_or_create_profile(request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# ──────────────────────────────────────────────
#  Alert settings
# ──────────────────────────────────────────────

class AlertSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_or_create(self, user):
        obj, _ = AlertSettings.objects.get_or_create(user=user)
        return obj

    def get(self, request):
        obj = self._get_or_create(request.user)
        return Response(AlertSettingsSerializer(obj).data)

    def put(self, request):
        obj        = self._get_or_create(request.user)
        serializer = AlertSettingsSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# ──────────────────────────────────────────────
#  Change password
# ──────────────────────────────────────────────

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({"current_password": "Current password is incorrect."}, status=400)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Re-issue tokens so the user stays logged in after password change
        refresh  = RefreshToken.for_user(user)
        response = Response({"access": str(refresh.access_token), "detail": "Password changed successfully."})
        response.set_cookie(
            key="refresh_token", value=str(refresh),
            httponly=True, secure=False, samesite="Lax",
        )
        return response


# ──────────────────────────────────────────────
#  Delete account
# ──────────────────────────────────────────────

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        password = request.data.get("password")
        if not password:
            return Response({"error": "Password is required to delete account."}, status=400)

        user = authenticate(username=request.user.username, password=password)
        if user is None:
            return Response({"error": "Incorrect password."}, status=400)

        user.delete()
        response = Response({"detail": "Account deleted."})
        response.delete_cookie("refresh_token")
        return response


# ──────────────────────────────────────────────
#  Website monitoring (unchanged)
# ──────────────────────────────────────────────

class WebsiteListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        websites   = Website.objects.filter(user=request.user)
        serializer = WebsiteSerializer(websites, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = WebsiteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WebsiteDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(Website, pk=pk, user=request.user)

    def get(self, request, pk):
        website  = self.get_object(request, pk)
        now      = timezone.now()
        last_24h = now - timedelta(hours=24)
        check_24h = website.checks.filter(checked_at__gte=last_24h)

        total_checks      = check_24h.count()
        successful_checks = check_24h.filter(status=True).count()
        uptime            = round((successful_checks / total_checks) * 100, 2) if total_checks else 0
        avg_response      = check_24h.aggregate(avg=Avg("response_time"))["avg"] or 0
        recent_checks     = website.checks.all()[:50]

        return Response({
            "website":       WebsiteSerializer(website).data,
            "metrics":       {"uptime_24h": uptime, "avg_response_24h": avg_response, "total_check_24h": total_checks},
            "recent_checks": CheckResultSerializer(recent_checks, many=True).data,
        })

    def put(self, request, pk):
        website    = self.get_object(request, pk)
        serializer = WebsiteSerializer(website, data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        website = self.get_object(request, pk)
        website.delete()
        return Response(status=204)


class WebsiteToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        website   = get_object_or_404(Website, pk=pk, user=request.user)
        is_active = request.data.get("is_active")
        if is_active is None:
            return Response({"error": "is_active required"}, status=400)

        website.is_active = bool(is_active)
        website.save(update_fields=["is_active"])
        if website.is_active:
            start_monitoring()
        return Response({"id": website.id, "is_active": website.is_active})


class ToggleMonitorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action   = request.data.get("action")
        websites = Website.objects.filter(user=request.user)

        if action == "pause":
            websites.update(is_active=False)
            if not Website.objects.filter(is_active=True).exists():
                stop_monitoring()
            return Response({"status": "paused"})

        if action == "start":
            websites.update(is_active=True)
            start_monitoring()
            return Response({"status": "started"})

        return Response({"error": 'action must be "start" or "pause"'}, status=400)


# ──────────────────────────────────────────────
#  Test email
# ──────────────────────────────────────────────

class SendTestEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .tasks import _send_alert_email
        from .models import AlertSettings, Website
        from django.utils import timezone

        # Fetch or validate the target email
        recipient = request.data.get('email', '').strip()
        if not recipient:
            try:
                cfg = AlertSettings.objects.get(user=request.user)
                recipient = cfg.alert_email
            except AlertSettings.DoesNotExist:
                pass

        if not recipient:
            return Response({'error': 'No email address provided.'}, status=400)

        # Build a dummy website object for the template
        class _FakeSite:
            website_name = 'Test Site'
            website_url  = 'https://example.com'
            user         = request.user

        class _FakeCheck:
            checked_at    = timezone.now()
            status_code   = 200
            response_time = 142.0
            error_message = None

        sent = _send_alert_email(_FakeSite(), recipient, 'down', _FakeCheck())
        if sent:
            return Response({'detail': f'Test email sent to {recipient}.'})
        return Response({'error': 'Failed to send email. Check your email settings.'}, status=500)