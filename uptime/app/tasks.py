from background_task import background
from background_task.models import Task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import Website, CheckResult, AlertSettings
from django.db.models import Avg
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import time
import requests
import logging

logger = logging.getLogger(__name__)

MONITOR_TASK_NAME = "app.tasks.monitor_websites"


# ──────────────────────────────────────────────
#  Monitor control
# ──────────────────────────────────────────────

def is_monitor_running():
    return Task.objects.filter(task_name=MONITOR_TASK_NAME).exists()


def start_monitoring():
    if not is_monitor_running():
        monitor_websites(schedule=0)


def stop_monitoring():
    Task.objects.filter(task_name=MONITOR_TASK_NAME).delete()


# ──────────────────────────────────────────────
#  Background tasks
# ──────────────────────────────────────────────

@background(schedule=60)
def monitor_websites():
    now = timezone.now()
    websites = Website.objects.filter(is_active=True)

    for website in websites:
        if website.last_checked is None or \
           now >= website.last_checked + timedelta(minutes=website.interval):
            Website.objects.filter(id=website.id).update(last_checked=now)
            check_website(website.id, schedule=0)

    if not Task.objects.filter(task_name=MONITOR_TASK_NAME, run_at__gt=now).exists():
        monitor_websites(schedule=60)


@background(schedule=0)
def check_website(website_id):
    website = None
    try:
        website = Website.objects.get(id=website_id)

        # Snapshot the previous status BEFORE making the HTTP call
        previous_status = website.last_status

        start = time.perf_counter()
        response = requests.get(
            website.website_url,
            timeout=10,
            stream=True,
            allow_redirects=True,
        )
        response.close()
        elapsed_ms = (time.perf_counter() - start) * 1000

        is_up = 200 <= response.status_code < 400

        result = CheckResult.objects.create(
            website=website,
            status=is_up,
            status_code=response.status_code,
            response_time=elapsed_ms,
        )

        Website.objects.filter(id=website.id).update(
            last_status=is_up,
            last_response_time=elapsed_ms,
        )

        website.refresh_from_db()

        # ── Email alert on status transition ──────────────────────────────────
        _maybe_send_alert(website, is_up, previous_status, result)

        _broadcast_update(website, result)

    except Exception as e:
        if website:
            CheckResult.objects.create(
                website=website,
                status=False,
                error_message=str(e),
            )
            # Treat an exception as "going down"
            # Capture previous_status BEFORE the update overwrites last_status
            previous_status = website.last_status
            Website.objects.filter(id=website.id).update(last_status=False)
            website.refresh_from_db()

            fake_result = website.checks.order_by("-checked_at").first()
            if fake_result:
                _maybe_send_alert(website, False, previous_status, fake_result)


# ──────────────────────────────────────────────
#  Alert logic
# ──────────────────────────────────────────────

def _maybe_send_alert(website, is_up, previous_status, check_result):
    try:
        alert_cfg = AlertSettings.objects.get(user=website.user)
    except AlertSettings.DoesNotExist:
        logger.warning("No AlertSettings for user %s", website.user.username)
        return

    if not alert_cfg.email_enabled:
        logger.info("Email alerts disabled for %s", website.user.username)
        return
    if not alert_cfg.alert_email:
        logger.info("No alert email set for %s", website.user.username)
        return
    if previous_status is None:
        logger.info("First check for %s — no alert on first run", website.website_name)
        return

    going_down = (previous_status == True) and (is_up == False)
    recovering  = (previous_status == False) and (is_up == True)
    still_down  = (previous_status == False) and (is_up == False)

    if going_down and not alert_cfg.alert_on_down:
        logger.info("Alert on down disabled for %s", website.website_name)
        return
    if recovering and not alert_cfg.alert_on_recover:
        logger.info("Alert on recover disabled for %s", website.website_name)
        return

    # still_up → nothing to do
    if not going_down and not recovering and not still_down:
        logger.info("No transition for %s (was=%s now=%s)", website.website_name, previous_status, is_up)
        return

    # For still_down: cooldown_mins=0 means repeat every check; >0 means wait cooldown
    if still_down and not going_down:
        if alert_cfg.cooldown_mins > 0:
            if website.last_alert_sent:
                elapsed = timezone.now() - website.last_alert_sent
                if elapsed < timedelta(minutes=alert_cfg.cooldown_mins):
                    remaining = timedelta(minutes=alert_cfg.cooldown_mins) - elapsed
                    logger.info("Cooldown active for %s (%s remaining)", website.website_name, remaining)
                    return
            else:
                return  # still_down but never alerted — skip (going_down would have fired first)
        # cooldown_mins == 0: fall through and resend on every check
    else:
        # going_down or recovering: apply cooldown as normal
        if alert_cfg.cooldown_mins > 0 and website.last_alert_sent:
            elapsed = timezone.now() - website.last_alert_sent
            if elapsed < timedelta(minutes=alert_cfg.cooldown_mins):
                logger.info("Cooldown active for %s", website.website_name)
                return

    alert_type = 'down' if (going_down or still_down) else 'recover'
    sent = _send_alert_email(
        website, alert_cfg.alert_email, alert_type, check_result)

    if sent:
        Website.objects.filter(id=website.id).update(
            last_alert_sent=timezone.now())

def _send_alert_email(website, recipient_email, alert_type, check_result):
    """
    Compose and send the alert email.
    Returns True on success, False on failure.
    """
    is_down = alert_type == 'down'

    subject = (
        f"🔴 DOWN: {website.website_name} is unreachable"
        if is_down else
        f"🟢 RECOVERED: {website.website_name} is back online"
    )

    checked_at_str = (
        check_result.checked_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        if check_result and check_result.checked_at else
        timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    )

    status_code_str = str(
        check_result.status_code) if check_result and check_result.status_code else "N/A"
    response_time_str = (
        f"{check_result.response_time:.0f} ms"
        if check_result and check_result.response_time else "N/A"
    )
    error_str = check_result.error_message if check_result and check_result.error_message else ""

    # ── Plain-text body ──────────────────────────────────────────────────────
    if is_down:
        text_body = f"""
UpMonitor Alert — Website Down

{website.website_name} ({website.website_url}) is currently UNREACHABLE.

Detected at : {checked_at_str}
Status code : {status_code_str}
{f'Error       : {error_str}' if error_str else ''}

You will receive another alert when the site recovers.

— UpMonitor
""".strip()
    else:
        text_body = f"""
UpMonitor Alert — Website Recovered

{website.website_name} ({website.website_url}) is back ONLINE.

Recovered at   : {checked_at_str}
Response time  : {response_time_str}
Status code    : {status_code_str}

— UpMonitor
""".strip()

    # ── HTML body ────────────────────────────────────────────────────────────
    accent = "#ef4444" if is_down else "#22c55e"
    badge_text = "DOWN" if is_down else "RECOVERED"
    headline = f"{website.website_name} is unreachable" if is_down else f"{website.website_name} is back online"

    rows = [
        ("Website", website.website_name),
        ("URL",     website.website_url),
        ("Time",    checked_at_str),
    ]
    if is_down:
        rows.append(("Status code", status_code_str))
        if error_str:
            rows.append(("Error", error_str))
    else:
        rows.append(("Status code",   status_code_str))
        rows.append(("Response time", response_time_str))

    detail_rows_html = "".join(
        f"""
        <tr>
          <td style="padding:8px 16px;color:#71717a;font-size:13px;white-space:nowrap;">{label}</td>
          <td style="padding:8px 16px;color:#e4e4e7;font-size:13px;word-break:break-all;">{value}</td>
        </tr>"""
        for label, value in rows
    )

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#0c0f17;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header bar -->
        <tr>
          <td style="background:{accent};padding:4px 0;"></td>
        </tr>

        <!-- Logo / brand -->
        <tr>
          <td style="padding:28px 32px 0;">
            <span style="font-size:13px;font-weight:700;color:#52525b;letter-spacing:0.1em;text-transform:uppercase;">
              UpMonitor
            </span>
          </td>
        </tr>

        <!-- Badge + headline -->
        <tr>
          <td style="padding:20px 32px 8px;">
            <span style="display:inline-block;background:{accent}22;border:1px solid {accent}55;
                         color:{accent};font-size:11px;font-weight:700;letter-spacing:0.12em;
                         text-transform:uppercase;padding:4px 10px;border-radius:6px;">
              {badge_text}
            </span>
            <h1 style="margin:14px 0 0;font-size:20px;font-weight:700;color:#f4f4f5;line-height:1.3;">
              {headline}
            </h1>
          </td>
        </tr>

        <!-- Detail table -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
              {detail_rows_html}
            </table>
          </td>
        </tr>

        <!-- Footer note -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.6;">
              {"You'll receive another alert when the site comes back online." if is_down else "No further action needed. Monitoring continues automatically."}
              <br>To manage alert preferences, visit your <a href="#" style="color:#22d3ee;text-decoration:none;">Settings</a>.
            </p>
          </td>
        </tr>

      </table>

      <!-- Footer -->
      <p style="margin:20px 0 0;font-size:11px;color:#3f3f46;">
        Sent by UpMonitor &mdash; you're receiving this because email alerts are enabled for your account.
      </p>
    </td></tr>
  </table>
</body>
</html>"""

    try:
        send_mail(
            subject=subject,
            message=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_body,
            fail_silently=False,
        )
        logger.info("Alert email sent to %s for %s (%s)",
                    recipient_email, website.website_name, alert_type)
        return True
    except Exception as exc:
        logger.error("Failed to send alert email for %s: %s",
                     website.website_name, exc)
        return False


# ──────────────────────────────────────────────
#  WebSocket broadcast (unchanged)
# ──────────────────────────────────────────────

def _broadcast_update(website, latest_check):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    checks_24h = website.checks.filter(checked_at__gte=last_24h)

    total = checks_24h.count()
    successful = checks_24h.filter(status=True).count()
    uptime = round((successful / total) * 100, 2) if total else 0
    avg_response = checks_24h.aggregate(avg=Avg("response_time"))["avg"] or 0

    async_to_sync(channel_layer.group_send)(
        f"monitor_{website.user.id}",
        {
            "type": "website_updates",
            "data": {
                "website": {
                    "id":                 website.id,
                    "last_checked":       website.last_checked.isoformat() if website.last_checked else None,
                    "last_status":        website.last_status,
                    "last_response_time": website.last_response_time,
                    "is_active":          website.is_active,
                },
                "metrics": {
                    "uptime_24h":     uptime,
                    "avg_response_24h": avg_response,
                    "total_check_24h": total,
                },
                "new_check": {
                    "id":            latest_check.id,
                    "checked_at":    latest_check.checked_at.isoformat(),
                    "status":        latest_check.status,
                    "status_code":   latest_check.status_code,
                    "response_time": latest_check.response_time,
                },
            },
        },
    )