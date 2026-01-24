# alertas/admin.py
'''
from django.contrib import admin # pyright: ignore[reportMissingModuleSource]
from .models import Alerta

@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'contenedor', 
        'tipo', 
        'prioridad', 
        'resuelta', 
        'creada_en'
    ]
    list_filter = ['tipo', 'prioridad', 'resuelta', 'creada_en']
    search_fields = ['contenedor__numero', 'contenedor__nombre', 'mensaje']
    ordering = ['-creada_en']
    readonly_fields = ['creada_en', 'actualizada_en']
    list_per_page = 50
    
    fieldsets = (
        ('Información de la Alerta', {
            'fields': ('contenedor', 'tipo', 'prioridad', 'mensaje')
        }),
        ('Valores', {
            'fields': ('valor_actual', 'umbral')
        }),
        ('Resolución', {
            'fields': ('resuelta', 'resuelto_por', 'resuelto_en', 'notas_resolucion')
        }),
        ('Timestamps', {
            'fields': ('creada_en', 'actualizada_en'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['marcar_como_resuelta']
    
    def marcar_como_resuelta(self, request, queryset):
        from django.utils import timezone  # pyright: ignore[reportMissingModuleSource]
        queryset.update(
            resuelta=True,
            resuelto_por=request.user,
            resuelto_en=timezone.now()
        )
        self.message_user(request, f"{queryset.count()} alerta(s) marcada(s) como resuelta(s).")
    marcar_como_resuelta.short_description = "Marcar seleccionadas como resueltas"
'''