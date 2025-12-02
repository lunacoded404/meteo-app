from django.urls import path
from .views import provinces_geojson

urlpatterns = [
    path("layers/provinces/", provinces_geojson, name="provinces_geojson"),
]
