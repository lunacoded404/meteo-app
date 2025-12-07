from django.db import connection
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_GET
from datetime import datetime
import json
import requests

from .models import Province

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


@require_GET
def provinces_geojson(request):
    """
    Trả về GeoJSON FeatureCollection của tất cả provinces.
    Dùng ST_AsGeoJSON(geom) từ PostGIS, không dùng GeoDjango.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, code, name, ST_AsGeoJSON(geom)
            FROM public.provinces
            WHERE geom IS NOT NULL;
            """
        )
        rows = cursor.fetchall()

    features = []
    for pid, code, name, geom_json in rows:
        if geom_json is None:
            continue
        geometry = json.loads(geom_json)
        features.append(
            {
                "type": "Feature",
                "id": pid,
                "geometry": geometry,
                "properties": {
                    "id": pid,
                    "code": code,
                    "name": name,
                },
            }
        )

    fc = {
        "type": "FeatureCollection",
        "features": features,
    }
    # safe=False để trả về list/dict bất kỳ, ở đây là FeatureCollection
    return JsonResponse(fc, safe=False)


@require_GET
def province_weather(request, code: str):
    """
    Trả về:
    - current.temperature (°C) + current.time
    - daily_past_7: 7 ngày trước hôm nay (min/max)
    - daily_future_7: hôm nay + 6 ngày tới (min/max)
    """
    try:
        province = Province.objects.get(code=code)
    except Province.DoesNotExist:
        raise Http404("Province not found")

    lat = province.lat
    # nếu field trong model là "long" thì sửa lại:
    # lon = province.long
    lon = province.lon

    if lat is None or lon is None:
        return JsonResponse(
            {"error": "Province has no coordinates (lat/long is null)"},
            status=400,
        )

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m",
        "daily": "temperature_2m_max,temperature_2m_min",
        "timezone": "Asia/Ho_Chi_Minh",
        "past_days": 7,
        "forecast_days": 7,
    }

    r = requests.get(OPEN_METEO_URL, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    current = data.get("current") or {}
    daily = data.get("daily") or {}

    times = daily.get("time") or []
    tmax = daily.get("temperature_2m_max") or []
    tmin = daily.get("temperature_2m_min") or []

    n = min(len(times), len(tmax), len(tmin))

    daily_past_7 = []
    daily_future_7 = []

    if n and current.get("time"):
        # Dùng current.time để xác định "hôm nay"
        try:
            today_date = datetime.fromisoformat(current["time"]).date()
        except Exception:
            today_date = None

        if today_date:
            past = []
            future = []

            for i in range(n):
                try:
                    d = datetime.fromisoformat(times[i]).date()
                except Exception:
                    continue

                item = {
                    "time": times[i],
                    "tmin": tmin[i],
                    "tmax": tmax[i],
                }

                if d < today_date:
                    past.append(item)
                else:
                    # bao gồm cả hôm nay vào future
                    future.append(item)

            daily_past_7 = past[-7:]
            daily_future_7 = future[:7]

    return JsonResponse(
        {
            "province": {
                "id": province.id,
                "code": province.code,
                "name": province.name,
            },
            "coord": {"lat": lat, "lon": lon},
            "timezone": data.get("timezone"),
            "current": {
                "temperature": current.get("temperature_2m"),
                "time": current.get("time"),
            },
            "daily_past_7": daily_past_7,
            "daily_future_7": daily_future_7,
        }
    )
