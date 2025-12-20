from datetime import date, datetime
import requests
import json


from django.db import connection
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone   
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Province

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"


# =========================
# Helpers
# =========================
def _om_get(lat: float, lon: float, params: dict):
    base = {
        "latitude": lat,
        "longitude": lon,
        "timezone": "auto",
    }
    base.update(params)
    resp = requests.get(OPEN_METEO_BASE, params=base, timeout=15)
    resp.raise_for_status()
    return resp.json()


def _parse_om_time(t_str: str):
    # Open-Meteo thường trả kiểu "2025-12-11T23:00"
    dt_naive = datetime.fromisoformat(t_str)
    if dt_naive.tzinfo is None:
        return timezone.make_aware(dt_naive, timezone.get_default_timezone())
    return dt_naive


def _latest_hour_value(om: dict, field: str):
    """
    Lấy giá trị hourly gần nhất tại/ trước 'now' (không lấy giờ tương lai).
    """
    hourly = om.get("hourly", {}) or {}
    times = hourly.get("time", []) or []
    values = hourly.get(field, []) or []
    if not times or not values:
        return None, None

    n = min(len(times), len(values))
    now = timezone.now()

    for i in range(n - 1, -1, -1):
        try:
            dt = _parse_om_time(times[i])
        except Exception:
            continue
        if dt <= now:
            return times[i], values[i]

    # fallback (nếu parse lỗi hết)
    return times[n - 1], values[n - 1]


# =========================
# 1) Provinces GeoJSON
# =========================
def provinces_geojson(request):
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT id, code, name, ST_AsGeoJSON(geom)
            FROM provinces
            WHERE geom IS NOT NULL
            """
        )
        rows = cur.fetchall()

    features = []
    for (id_, code, name, geom_json) in rows:
        features.append({
            "type": "Feature",
            "geometry": json.loads(geom_json),
            "properties": {"id": id_, "code": code, "name": name},
        })

    return JsonResponse({"type": "FeatureCollection", "features": features}, safe=False)


# =========================
# 2) Temperature (current + 7 days)
# =========================
@api_view(["GET"])
def province_weather(request, code: str):
    province = get_object_or_404(Province, code=code)
    if province.lat is None or province.lon is None:
        return Response({"detail": "Missing lat/lon"}, status=400)

    om = _om_get(province.lat, province.lon, {
        "current_weather": True,
        "daily": "temperature_2m_max,temperature_2m_min",
        "past_days": 7,
        "forecast_days": 7,
    })

    current = om.get("current_weather", {})
    daily = om.get("daily", {})

    today = date.today().isoformat()
    past, future = [], []

    for i, t in enumerate(daily.get("time", [])):
        item = {
            "time": t,
            "tmax": daily["temperature_2m_max"][i],
            "tmin": daily["temperature_2m_min"][i],
        }
        (past if t < today else future).append(item)

    return Response({
        "province": {"id": province.id, "code": code, "name": province.name},
        "coord": {"lat": province.lat, "lon": province.lon},
        "current": {
            "temperature": current.get("temperature"),
            "time": current.get("time"),
        },
        "daily_past_7": past[-7:],
        "daily_future_7": future[:7],
    })


# =========================
# 3) Rain (current + 7 days daily)
# =========================
@api_view(["GET"])
def province_rain(request, code: str):
    province = get_object_or_404(Province, code=code)
    if province.lat is None or province.lon is None:
        return Response({"detail": "Missing lat/lon"}, status=400)

    om = _om_get(province.lat, province.lon, {
        # ✅ current cho “hiện tại”
        "current": "precipitation,precipitation_probability",

        # ✅ hourly fallback (nếu current thiếu)
        "hourly": "precipitation,precipitation_probability",

        # ✅ daily forecast 7 ngày
        "daily": "precipitation_sum,precipitation_probability_max",
        "forecast_days": 7,

        # (tuỳ chọn) lấy thêm 1 ngày quá khứ cho hourly latest-hour fallback
        "past_days": 1,

        "precipitation_unit": "mm",
    })

    # ----- current -----
    cur = om.get("current", {}) or {}
    t = cur.get("time")
    precip = cur.get("precipitation")  # mm
    prob = cur.get("precipitation_probability")  # %

    # fallback từ hourly nếu current thiếu
    if precip is None:
        t2, precip = _latest_hour_value(om, "precipitation")
        t = t or t2

    if prob is None:
        t3, prob = _latest_hour_value(om, "precipitation_probability")
        t = t or t3

    # ----- daily 7 days -----
    daily = om.get("daily", {}) or {}
    d_times = daily.get("time", []) or []
    d_sum = daily.get("precipitation_sum", []) or []
    d_pmax = daily.get("precipitation_probability_max", []) or []

    n = min(len(d_times), len(d_sum), len(d_pmax) if d_pmax else len(d_times), 7)

    points = []
    for i in range(n):
        points.append({
            "date": d_times[i],  # "YYYY-MM-DD"
            "precipitation_sum_mm": d_sum[i] if i < len(d_sum) else None,
            "precipitation_probability_max": d_pmax[i] if i < len(d_pmax) else None,
        })

    return Response({
        "province": {"id": province.id, "code": code, "name": province.name},
        "coord": {"lat": province.lat, "lon": province.lon},
        "timezone": om.get("timezone"),
        "current": {
            "precipitation_mm": precip,
            "precipitation_probability": prob,
            "time": t,
        },
        "daily": {
            "points": points,  # ✅ RainDrawer dùng data.daily.points
        },
    })


# =========================
# 4) Wind (current + wind rose 24h)
# =========================
@api_view(["GET"])
def province_wind(request, code: str):
    province = get_object_or_404(Province, code=code)
    if province.lat is None or province.lon is None:
        return Response({"detail": "Missing lat/lon"}, status=400)

    om = _om_get(province.lat, province.lon, {
        "hourly": "wind_speed_10m,wind_direction_10m",
        "past_days": 1,          # lấy 24h gần nhất
        "forecast_days": 0,
        "windspeed_unit": "ms",  # Open-Meteo trả m/s
    })

    hourly = om.get("hourly", {}) or {}
    times = hourly.get("time", []) or []
    wspd = hourly.get("wind_speed_10m", []) or []
    wdir = hourly.get("wind_direction_10m", []) or []

    if not times or not wdir:
        return Response({"detail": "No wind data"}, status=204)

    # current = phần tử cuối
    speed_kmh = (wspd[-1] * 3.6) if (wspd and wspd[-1] is not None) else None
    direction_deg = wdir[-1] if wdir else None
    time_str = times[-1] if times else None

    # Wind rose 16 hướng từ 24 giá trị cuối
    labels = [
        "Bắc", "BĐB", "ĐB", "ĐĐB",
        "Đ", "ĐĐN", "ĐN", "NĐN",
        "Nam", "NTN", "TN", "TTN",
        "T", "TTB", "TB", "BTB",
    ]
    counts = [0] * 16

    for deg in wdir[-24:]:
        if deg is None:
            continue
        idx = int(round((deg % 360) / 22.5)) % 16
        counts[idx] += 1

    rose = [
        {"dir_label": labels[i], "angle_deg": i * 22.5, "count": counts[i]}
        for i in range(16)
    ]

    return Response({
        "province": {"id": province.id, "code": code, "name": province.name},
        "coord": {"lat": province.lat, "lon": province.lon},
        "current": {
            "wind_speed_kmh": speed_kmh,
            "wind_direction_deg": direction_deg,
            "time": time_str,
        },
        "rose_period_hours": 24,
        "rose": rose,
    })



# =========================
# 5) Humidity (current)
# =========================
@api_view(["GET"])
def province_humidity(request, code: str):
    province = get_object_or_404(Province, code=code)
    if province.lat is None or province.lon is None:
        return Response({"detail": "Missing lat/lon"}, status=400)

    om = _om_get(province.lat, province.lon, {
        "current": "relative_humidity_2m",
        # nếu bạn cần chart theo giờ thì giữ hourly, không thì bỏ
        "hourly": "relative_humidity_2m",
        "past_days": 1,
        "forecast_days": 1,
    })

    cur = om.get("current") or {}
    t = cur.get("time")
    v = cur.get("relative_humidity_2m")

    return Response({
        "province": {"id": province.id, "code": code, "name": province.name},
        "coord": {"lat": province.lat, "lon": province.lon},
        "current": {"time": t, "humidity_percent": v},
    })



# =========================
# 6) Cloud (current + hourly fallback)
# =========================
@api_view(["GET"])
def province_cloud(request, code: str):
    province = get_object_or_404(Province, code=code)
    if province.lat is None or province.lon is None:
        return Response({"detail": "Missing lat/lon"}, status=400)

    om = _om_get(province.lat, province.lon, {
        "current": "cloud_cover",
        "hourly": "cloud_cover",
        "past_days": 1,
        "forecast_days": 1,
    })

    cur = om.get("current", {}) or {}
    t = cur.get("time")
    cloud = cur.get("cloud_cover")  


    if cloud is None:
        t2, cloud = _latest_hour_value(om, "cloud_cover")
        t = t or t2



    return Response({
        "province": {"id": province.id, "code": code, "name": province.name},
        "coord": {"lat": province.lat, "lon": province.lon},
        "timezone": om.get("timezone"),
        "current": {
            "time": t,
            "cloud_cover_percent": cloud,
        },
    })



