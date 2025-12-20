# backend/api/models.py
from django.db import models


class Province(models.Model):
    id = models.IntegerField(primary_key=True)
    code = models.CharField(max_length=50, null=True, blank=True, unique=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    level = models.CharField(max_length=50, null=True, blank=True)
    lon = models.FloatField(null=True, blank=True, db_column="long")
    lat = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "provinces"
        managed = False  # bảng đã có sẵn trên Supabase


class WeatherForecastHourly(models.Model):
    """
    Bảng lưu thời tiết theo giờ cho từng tỉnh.
    Được đổ dữ liệu bởi fetch_open_meteo.py.
    """

    id = models.BigAutoField(primary_key=True)
    province = models.ForeignKey(
        Province,
        on_delete=models.DO_NOTHING,
        db_column="province_id",
        related_name="hourly_forecasts",
    )
    forecast_time = models.DateTimeField()

    temp_c = models.FloatField(null=True, blank=True)
    humidity_percent = models.FloatField(null=True, blank=True)
    pressure_hpa = models.FloatField(null=True, blank=True)
    wind_speed_ms = models.FloatField(null=True, blank=True)
    wind_dir_deg = models.FloatField(null=True, blank=True)
    cloud_cover_percent = models.FloatField(null=True, blank=True)
    precip_mm = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "weather_forecast_hourly"
        managed = False
        indexes = [
            models.Index(fields=["province", "forecast_time"]),
        ]

    def __str__(self):
        return f"{self.province_id} @ {self.forecast_time}"
