"""
Django settings for core project.
Uses django-environ — all config comes from environment variables or a .env file.
"""

from datetime import timedelta
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    # (type, default)
    DEBUG                = (bool,  False),
    SECRET_KEY           = (str,   'django-insecure-change-me-in-production'),
    ALLOWED_HOSTS        = (list,  []),
    CORS_ALLOWED_ORIGINS = (list,  []),
    DATABASE_URL         = (str,   f'sqlite:///{BASE_DIR / "db.sqlite3"}'),
    REDIS_URL            = (str,   ''),
    # Email
    EMAIL_HOST           = (str,   'smtp.gmail.com'),
    EMAIL_PORT           = (int,   587),
    EMAIL_USE_TLS        = (bool,  True),
    EMAIL_USE_SSL        = (bool,  False),
    EMAIL_HOST_USER      = (str,   ''),
    EMAIL_HOST_PASSWORD  = (str,   ''),
    DEFAULT_FROM_EMAIL   = (str,   'UpMonitor <noreply@upmonitor.local>'),
    # Resend
    RESEND_API_KEY       = (str,   ''),
)

environ.Env.read_env(BASE_DIR / '.env')   # no-op if .env doesn't exist


# ── Security ──────────────────────────────────────────────────────────────────

SECRET_KEY = env('SECRET_KEY')
DEBUG       = env('DEBUG')

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')
if not ALLOWED_HOSTS and DEBUG:
    ALLOWED_HOSTS = ['*']


# ── Application ───────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app',
    'rest_framework',
    'corsheaders',
    'background_task',
    'channels',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION  = 'core.asgi.application'


# ── Database ──────────────────────────────────────────────────────────────────

DATABASES = {
    'default': env.db('DATABASE_URL')
}
DATABASES['default']['CONN_MAX_AGE'] = 0 if DEBUG else 600


# ── Password validation ───────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ── Internationalisation ──────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True


# ── Static files ─────────────────────────────────────────────────────────────

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_STORAGE = (
    'django.contrib.staticfiles.storage.StaticFilesStorage'
    if DEBUG else
    'whitenoise.storage.CompressedManifestStaticFilesStorage'
)


# ── Django REST Framework ─────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=120),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    False,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES':        ('Bearer',),
}


# ── CORS ──────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')
if not CORS_ALLOWED_ORIGINS and DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']


# ── Channels ─────────────────────────────────────────────────────────────────

_redis_url = env('REDIS_URL')

if _redis_url:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG':  {'hosts': [_redis_url]},
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer'
        }
    }


# ── Email ─────────────────────────────────────────────────────────────────────

RESEND_API_KEY = env('RESEND_API_KEY')

if RESEND_API_KEY:
    # Use Resend (HTTP API) – dummy SMTP backend, we send via resend API directly
    EMAIL_BACKEND = 'django.core.mail.backends.base.BaseEmailBackend'
elif env('EMAIL_HOST_USER'):
    EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST          = env('EMAIL_HOST')
    EMAIL_PORT          = env('EMAIL_PORT')
    EMAIL_USE_TLS       = env('EMAIL_USE_TLS')
    EMAIL_USE_SSL       = env('EMAIL_USE_SSL')
    EMAIL_HOST_USER     = env('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL  = env('DEFAULT_FROM_EMAIL')
else:
    EMAIL_BACKEND      = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL')


# ── Cookie security (cross‑domain required for refresh token) ───────────────

SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE   = True
CSRF_COOKIE_SAMESITE    = 'None'
CSRF_COOKIE_SECURE      = True


# ── Misc ──────────────────────────────────────────────────────────────────────

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')