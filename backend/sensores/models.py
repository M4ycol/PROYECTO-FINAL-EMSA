# sensores/models.py
'''
from django.db import models# pyright: ignore[reportMissingModuleSource]
from contenedores.models import Contenedor

class LecturaSensor(models.Model):
    """Modelo para lecturas de sensores IoT"""
    
    contenedor = models.ForeignKey(
        Contenedor, 
        on_delete=models.CASCADE, 
        related_name='lecturas'
    )
    
    # Datos del sensor ultrasónico (HC-SR04)
    nivel_llenado = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Porcentaje de llenado (0-100%)"
    )
    distancia_cm = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Distancia medida en centímetros"
    )
    
    # Datos del sensor de temperatura (AHT20)
    temperatura = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Temperatura en grados Celsius"
    )
    humedad = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Humedad relativa en porcentaje"
    )
    
    # Datos del sensor de gas (MQ-135)
    concentracion_gas = models.IntegerField(
        help_text="Concentración de gas en PPM (CO2/Metano)"
    )
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'lecturas_sensores'
        ordering = ['-timestamp']
        verbose_name = 'Lectura de Sensor'
        verbose_name_plural = 'Lecturas de Sensores'
        indexes = [
            models.Index(fields=['contenedor', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"Lectura Contenedor #{self.contenedor.numero} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        """Validación antes de guardar"""
        if not (0 <= self.nivel_llenado <= 100):
            raise ValueError("El nivel de llenado debe estar entre 0 y 100")
        super().save(*args, **kwargs)'''
