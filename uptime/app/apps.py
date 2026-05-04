import sys
from django.apps import AppConfig


class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        # Do NOT touch the DB here — ready() runs in every process including
        # process_tasks, migrate, shell, etc. Calling start_monitoring() here
        # causes the "DB during app init" crash that silently kills the worker.
        pass