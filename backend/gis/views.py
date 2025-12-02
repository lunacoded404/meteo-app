import json
from pathlib import Path
from django.http import JsonResponse
from django.conf import settings

def provinces_geojson(request):
    # Đường dẫn tới file .geojson bạn đã export từ QGIS
    geojson_path = Path(settings.BASE_DIR) / "data" / "vietnam_provinces.geojson"

    with geojson_path.open(encoding="utf-8") as f:
        data = json.load(f)

    # safe=False vì data là list hoặc object phức tạp, không chỉ dict
    return JsonResponse(data, safe=False)
