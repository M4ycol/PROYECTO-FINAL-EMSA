# alertas/models.py
from django.db import models # pyright: ignore[reportMissingModuleSource]
from django.contrib.auth.models import User # pyright: ignore[reportMissingModuleSource]
from contenedores.models import Contenedor


class Alerta(models.Model):
    """Modelo para alertas y notificaciones del sistema"""
    
    TIPO_CHOICES = [
        ('desborde', 'Desborde Inminente'),
        ('gas', 'Nivel de Gas Alto'),
        ('temperatura', 'Temperatura Anormal'),
        ('falla_sensor', 'Falla de Sensor'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]
    
    contenedor = models.ForeignKey(
        Contenedor, 
        on_delete=models.CASCADE, 
        related_name='contenedor_alertas'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES)
    mensaje = models.TextField()
    valor_actual = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Valor que disparó la alerta"
    )
    umbral = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Valor umbral configurado"
    )
    
    # Estado de la alerta
    resuelta = models.BooleanField(default=False)
    resuelto_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='alertas_resueltas'
    )
    resuelto_en = models.DateTimeField(null=True, blank=True)
    notas_resolucion = models.TextField(blank=True, default='')
    
    # Timestamps
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'alertas'
        ordering = ['-creada_en']
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
        indexes = [
            models.Index(fields=['resuelta', '-creada_en']),
            models.Index(fields=['prioridad', '-creada_en']),
        ]
    
    def __str__(self):
        estado = "✅ Resuelta" if self.resuelta else "⚠️ Activa"
        return f"{estado} - {self.get_tipo_display()} - Contenedor #{self.contenedor.numero}"
    
    @property
    def tiempo_transcurrido(self):
        """Calcula tiempo desde creación"""
        from django.utils import timezone# pyright: ignore[reportMissingModuleSource]
        if self.resuelta and self.resuelto_en:
            delta = self.resuelto_en - self.creada_en
        else:
            delta = timezone.now() - self.creada_en
        
        minutos = int(delta.total_seconds() / 60)
        if minutos < 60:
            return f"{minutos}m"
        horas = minutos // 60
        minutos_restantes = minutos % 60
        return f"{horas}h {minutos_restantes}m"

