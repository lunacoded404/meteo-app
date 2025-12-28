from django.urls import path
from . import views

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [

    path("provinces/<str:code>/current/", views.province_current),

    path("provinces/<str:code>/weather/", views.province_weather),
    path("provinces/<str:code>/wind/", views.province_wind),
    path("provinces/<str:code>/rain/", views.province_rain),
    path("provinces/<str:code>/humidity/", views.province_humidity),
    path("provinces/<str:code>/cloud/", views.province_cloud),

    # ✅ bundle đúng hệ
    path("provinces/<str:code>/bundle/", views.province_bundle),

    # List nhẹ để search nhanh
    path("province-index/", views.province_index),


]
