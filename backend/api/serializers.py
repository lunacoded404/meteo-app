from rest_framework import serializers
from .models import MapLayer

class MapLayerAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapLayer
        fields = ["id","key","name","is_enabled","icon"]
        read_only_fields = ["id","key","name"]
