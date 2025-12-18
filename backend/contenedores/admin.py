# contenedores/admin.py
from django.contrib import admin# pyright: ignore[reportMissingModuleSource]
from .models import Contenedor

@admin.register(Contenedor)
class ContenedorAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 
        'nombre', 
        'estado', 
        'capacidad_litros',
        'actualizado_en'
    ]
    list_filter = ['estado', 'creado_en']
    search_fields = ['numero', 'nombre', 'direccion']
    ordering = ['numero']
    readonly_fields = ['creado_en', 'actualizado_en']
    list_per_page = 25
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'nombre', 'direccion', 'estado')
        }),
        ('Ubicación GPS', {
            'fields': ('latitud', 'longitud')
        }),
        ('Especificaciones', {
            'fields': ('capacidad_litros', 'fecha_instalacion')
        }),
        ('Timestamps', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )
