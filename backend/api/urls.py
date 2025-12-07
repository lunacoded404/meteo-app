from django.urls import path
from . import views

urlpatterns = [
    path("provinces/", views.provinces_geojson, name="provinces_geojson"),
    path("provinces/<str:code>/weather/", views.province_weather, name="province_weather"),
]
