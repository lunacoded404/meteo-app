# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # auth
    path("api/auth/", include("api.auth_urls")),

    # các api khác (nếu có)
    path("api/", include("api.urls")),

    path("api-auth/", include("rest_framework.urls")),
]
