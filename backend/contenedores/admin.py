# contenedores/admin.py
from django.contrib import admin
from .models import Contenedor, Alerta, LecturaSensor


@admin.register(Contenedor)
class ContenedorAdmin(admin.ModelAdmin):
    """
    Configuración del panel de administración para Contenedores
    """
    
    list_display = [
        'numero', 'nombre', 'direccion', 'estado',
        'capacidad_litros', 'nivel_actual', 'fecha_instalacion'
    ]
    
    list_filter = ['estado', 'fecha_instalacion']
    
    search_fields = ['numero', 'nombre', 'direccion']
    
    readonly_fields = ['numero', 'fecha_instalacion', 'creado_en', 'actualizado_en']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'nombre', 'device_id', 'direccion', 'estado')
        }),
        ('Ubicación GPS', {
            'fields': ('latitud', 'longitud')
        }),
        ('Especificaciones', {
            'fields': ('capacidad_litros', 'nivel_actual_cache', 'fecha_instalacion')
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('creado_en', 'actualizado_en')
        }),
    )
    
    ordering = ['numero']
    
    def nivel_actual(self, obj):
        """Muestra el nivel actual del contenedor"""
        return f"{obj.nivel_actual:.1f}%"
    nivel_actual.short_description = 'Nivel Actual'


@admin.register(LecturaSensor)
class LecturaSensorAdmin(admin.ModelAdmin):
    list_display = ['contenedor', 'nivel_llenado', 'distancia_cm', 'temperatura', 'timestamp']
    list_filter = ['timestamp', 'contenedor']
    search_fields = ['contenedor__nombre', 'contenedor__numero']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Contenedor', {
            'fields': ('contenedor',)
        }),
        ('Mediciones', {
            'fields': ('nivel_llenado', 'distancia_cm', 'temperatura', 'humedad')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    """
    Configuración del panel de administración para Alertas
    """
    list_display = [
        'id', 'contenedor', 'tipo', 'estado', 
        'nivel_detectado', 'fecha_creacion'
    ]
    list_filter = ['tipo', 'estado', 'fecha_creacion']
    search_fields = ['mensaje', 'contenedor__nombre']  
    readonly_fields = ['fecha_creacion', 'fecha_resolucion']
    ordering = ['-fecha_creacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('contenedor', 'tipo', 'estado', 'mensaje')
        }),
        ('Detalles', {
            'fields': ('nivel_detectado',)
        }),
        ('Fechas', {
            'classes': ('collapse',),
            'fields': ('fecha_creacion', 'fecha_resolucion')
        }),
    )
    
    def get_queryset(self, request):
        """Optimizar queries con select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('contenedor')