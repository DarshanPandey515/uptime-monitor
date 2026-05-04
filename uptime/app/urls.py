from django.urls import path
from app.views import (
    LoginAPIView, MeView, RefreshAPIView, LogoutAPIView,
    ProfileView, AlertSettingsView, ChangePasswordView, DeleteAccountView,
    SendTestEmailView,
    WebsiteListAPIView, WebsiteDetailAPIView,
    WebsiteToggleAPIView, ToggleMonitorAPIView, RegisterAPIView
)
from app.views_health import health_check

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/login/',            LoginAPIView.as_view(),       name='login'),
    path('auth/register/',         RegisterAPIView.as_view(),    name='register'),

    path('auth/me/',               MeView.as_view(),             name='me'),
    path('auth/refresh/',          RefreshAPIView.as_view(),     name='token_refresh'),
    path('auth/logout/',           LogoutAPIView.as_view(),      name='logout'),

    # ── Settings ──────────────────────────────────────────────────────────────
    path('auth/profile/',          ProfileView.as_view(),        name='profile'),
    path('auth/alert-settings/',   AlertSettingsView.as_view(),  name='alert_settings'),
    path('auth/change-password/',  ChangePasswordView.as_view(), name='change_password'),
    path('auth/delete-account/',   DeleteAccountView.as_view(),  name='delete_account'),
    path('auth/send-test-email/',  SendTestEmailView.as_view(),  name='send_test_email'),

    # ── Websites ──────────────────────────────────────────────────────────────
    path('website/',                    WebsiteListAPIView.as_view(),      name='website'),
    path('website/<int:pk>/',           WebsiteDetailAPIView.as_view(),    name='website_detail'),
    path('website/<int:pk>/toggle/',    WebsiteToggleAPIView.as_view(),    name='website_toggle'),
    path('websites/toggle_monitor/',    ToggleMonitorAPIView.as_view(),    name='toggle_monitor'),



    path('health/',                    health_check),

]