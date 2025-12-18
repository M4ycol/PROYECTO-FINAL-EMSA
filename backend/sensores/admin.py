# sensores/admin.py
from django.contrib import admin
from .models import LecturaSensor

@admin.register(LecturaSensor)
class LecturaSensorAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'contenedor', 
        'nivel_llenado', 
        'temperatura',
        'humedad',
        'concentracion_gas', 
        'timestamp'
    ]
    list_filter = ['contenedor', 'timestamp']
    search_fields = ['contenedor__numero', 'contenedor__nombre']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    list_per_page = 50
    
    fieldsets = (
        ('Contenedor', {
            'fields': ('contenedor',)
        }),
        ('Sensor Ultrasónico (HC-SR04)', {
            'fields': ('nivel_llenado', 'distancia_cm'),
            'description': 'Medición de nivel de llenado'
        }),
        ('Sensor Temperatura/Humedad (AHT20)', {
            'fields': ('temperatura', 'humedad'),
            'description': 'Condiciones ambientales'
        }),
        ('Sensor de Gas (MQ-135)', {
            'fields': ('concentracion_gas',),
            'description': 'Concentración de CO2/Metano'
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )
