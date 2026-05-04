from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


# ── User profile ───────────────────────────────────────────────────────────────

class UserProfile(models.Model):
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"Profile({self.user.username})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


# ── Alert settings (email config per user) ─────────────────────────────────────

class AlertSettings(models.Model):
    user             = models.OneToOneField(User, on_delete=models.CASCADE, related_name='alert_settings')
    alert_email      = models.EmailField(blank=True, default='')
    email_enabled    = models.BooleanField(default=False)
    alert_on_down    = models.BooleanField(default=True)
    alert_on_recover = models.BooleanField(default=True)
    cooldown_mins    = models.IntegerField(default=30)

    def __str__(self):
        return f"AlertSettings({self.user.username})"


@receiver(post_save, sender=User)
def create_alert_settings(sender, instance, created, **kwargs):
    if created:
        AlertSettings.objects.get_or_create(user=instance)


# ── Website monitoring ─────────────────────────────────────────────────────────

class Website(models.Model):
    user               = models.ForeignKey(User, on_delete=models.CASCADE, related_name='websites')
    website_name       = models.CharField(max_length=100)
    website_url        = models.URLField(max_length=500)
    interval           = models.IntegerField(help_text='minutes')
    last_checked       = models.DateTimeField(null=True, blank=True, db_index=True)
    last_status        = models.BooleanField(null=True)
    last_response_time = models.FloatField(null=True)
    is_active          = models.BooleanField(default=True)
    last_alert_sent    = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.website_name} - {self.user.username}"


class CheckResult(models.Model):
    website       = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="checks")
    checked_at    = models.DateTimeField(auto_now_add=True)
    status        = models.BooleanField()
    status_code   = models.IntegerField(null=True, blank=True)
    response_time = models.FloatField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["-checked_at"]
        indexes  = [models.Index(fields=["website", "checked_at"])]

    def __str__(self):
        return f"{self.website.website_name}"