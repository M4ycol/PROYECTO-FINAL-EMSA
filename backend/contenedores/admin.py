# contenedores/admin.py
from django.contrib import admin
from .models import Contenedor, Alerta


@admin.register(Contenedor)
class ContenedorAdmin(admin.ModelAdmin):
    """
    Configuración del panel de administración para Contenedores
    """
    
    # ✅ Lista de campos visibles en la tabla
    list_display = [
        'numero', 'nombre', 'direccion', 'estado',
        'capacidad_litros', 'nivel_actual', 'fecha_instalacion'
    ]
    
    # ✅ Filtros en el sidebar
    list_filter = ['estado', 'fecha_instalacion']
    
    # ✅ Buscador
    search_fields = ['numero', 'nombre', 'direccion']
    
    # ✅ Campos de solo lectura (incluyendo numero y fecha_instalacion)
    readonly_fields = ['numero', 'fecha_instalacion', 'creado_en', 'actualizado_en']
    
    # ✅ Organización de campos en el formulario
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
            'classes': ('collapse',),
            'fields': ('creado_en', 'actualizado_en')
        }),
    )
    
    # ✅ Ordenamiento por defecto
    ordering = ['numero']
    
    def nivel_actual(self, obj):
        """Muestra el nivel actual del contenedor"""
        return f"{obj.nivel_actual:.1f}%"
    nivel_actual.short_description = 'Nivel Actual'
@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ['id', 'contenedor', 'tipo', 'titulo', 'estado', 'fecha_creacion']
    list_filter = ['tipo', 'estado', 'fecha_creacion']
    search_fields = ['titulo', 'descripcion', 'contenedor__nombre']
    readonly_fields = ['fecha_creacion', 'fecha_vista', 'fecha_resolucion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('contenedor', 'tipo', 'titulo', 'descripcion', 'nivel_actual')
        }),
        ('Estado', {
            'fields': ('estado', 'fecha_creacion', 'fecha_vista', 'fecha_resolucion', 'comentario_resolucion')
        }),
    )