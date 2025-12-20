from django.urls import path
from . import views

urlpatterns = [
    path("provinces/", views.provinces_geojson),

    path("provinces/<str:code>/weather/", views.province_weather),
    path("provinces/<str:code>/wind/", views.province_wind),
    path("provinces/<str:code>/rain/", views.province_rain),

    path("provinces/<str:code>/humidity/", views.province_humidity),
    path("provinces/<str:code>/cloud/", views.province_cloud),
]
