# backend/api/management/commands/fetch_open_meteo.py
import requests
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.db import connection

from api.models import Province, WeatherForecastHourly, ProvinceWeatherStatic

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class Command(BaseCommand):
    help = "Fetch hourly weather from Open-Meteo for all provinces"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("DB connection:"))
        self.stdout.write(str(connection.settings_dict))

        provinces = list(Province.objects.all())
        self.stdout.write(self.style.SUCCESS(f"Found {len(provinces)} provinces."))

        if not provinces:
            self.stdout.write(self.style.WARNING("No provinces found. Stop."))
            return

        for p in provinces:
            self.stdout.write(self.style.HTTP_INFO(f"Fetching data for {p.name} (id={p.id})..."))
            try:
                self.fetch_for_province(p)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error for {p.name}: {e}"))

    def fetch_for_province(self, province: Province):
        if province.lat is None or province.lon is None:
            self.stdout.write(self.style.WARNING(f"Province {province.name} has no lat/lon, skip."))
            return

        params = {
            "latitude": province.lat,
            "longitude": province.lon,
            "hourly": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "cloud_cover",
                "precipitation",
            ]),
            "timezone": "auto",
        }

        resp = requests.get(OPEN_METEO_URL, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly")
        if not hourly:
            self.stdout.write(self.style.WARNING(f"No 'hourly' data for {province.name}, skip."))
            return

        times = hourly["time"]  # list string ISO
        temps = hourly["temperature_2m"]
        hums = hourly["relative_humidity_2m"]
        press = hourly["surface_pressure"]
        wspd = hourly["wind_speed_10m"]
        wdir = hourly["wind_direction_10m"]
        clouds = hourly["cloud_cover"]
        precip = hourly["precipitation"]

        now = timezone.now()
        local_tz = timezone.get_default_timezone()

        objs = []
        for i, t_str in enumerate(times):
            # t_str ví dụ "2025-12-11T23:00"
            dt_naive = datetime.fromisoformat(t_str)
            dt_aware = timezone.make_aware(dt_naive, local_tz)

            objs.append(
                WeatherForecastHourly(
                    province=province,
                    forecast_time=dt_aware,
                    temp_c=temps[i],
                    humidity_percent=hums[i],
                    pressure_hpa=press[i],
                    wind_speed_ms=wspd[i],
                    wind_dir_deg=wdir[i],
                    cloud_cover_percent=clouds[i],
                    precip_mm=precip[i],
                    created_at=now,  # 👈 FIX CHÍNH: không để NULL nữa
                )
            )

        self.stdout.write(f"Will insert {len(objs)} hourly rows for {province.name}...")

        with transaction.atomic():
            WeatherForecastHourly.objects.bulk_create(
                objs,
                ignore_conflicts=True,
            )

            # snapshot: cứ lấy index 0 làm ví dụ
            idx = 0
            dt_snapshot_naive = datetime.fromisoformat(times[idx])
            dt_snapshot_aware = timezone.make_aware(dt_snapshot_naive, local_tz)

            ProvinceWeatherStatic.objects.update_or_create(
                province=province,
                defaults={
                    "temp_c": temps[idx],
                    "humidity_percent": hums[idx],
                    "pressure_hpa": press[idx],
                    "wind_speed_ms": wspd[idx],
                    "wind_dir_deg": wdir[idx],
                    "cloud_cover_percent": clouds[idx],
                    "precip_mm": precip[idx],
                    "snapshot_time": dt_snapshot_aware,
                    "source": "open-meteo",
                    "created_at": now,
                    "updated_at": now,
                },
            )

        self.stdout.write(self.style.SUCCESS(f"Saved weather for {province.name}"))
