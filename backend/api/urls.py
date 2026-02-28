from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views_admin_layers import AdminMapLayerViewSet
from api.views_admin_users import AdminUserViewSet
from api.views_layers_public import map_layers_public

from . import views 

router = DefaultRouter()
router.register(r"admin/layers", AdminMapLayerViewSet, basename="admin-layers")
router.register(r"admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("", include(router.urls)),
    path("map/layers/", map_layers_public),
    path("auth/", include("api.auth_urls")),  
    path("provinces/<str:code>/current/", views.province_current),
    path("provinces/<str:code>/weather/", views.province_weather),
    path("provinces/<str:code>/wind/", views.province_wind),
    path("provinces/<str:code>/rain/", views.province_rain),
    path("provinces/<str:code>/humidity/", views.province_humidity),
    path("provinces/<str:code>/cloud/", views.province_cloud),
    path("provinces/<str:code>/bundle/", views.province_bundle),
    path("province-index/", views.province_index),
    path("places/hcm-districts/", views.hcm_districts),
    path("places/kien-giang/", views.kien_giang_places),
]
