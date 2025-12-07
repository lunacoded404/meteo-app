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
        managed = False
