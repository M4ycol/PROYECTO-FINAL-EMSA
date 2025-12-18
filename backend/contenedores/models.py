# contenedores/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Contenedor(models.Model):
    """Modelo para contenedores soterrados de EMSA"""
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('mantenimiento', 'Mantenimiento'),
    ]
    
    numero = models.IntegerField(
        unique=True, 
        validators=[MinValueValidator(1), MaxValueValidator(22)],
        help_text="Número del contenedor (1-22)"
    )
    nombre = models.CharField(max_length=200, help_text="Nombre o identificador")
    direccion = models.TextField(help_text="Dirección exacta del contenedor")
    latitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Latitud GPS"
    )
    longitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Longitud GPS"
    )
    capacidad_litros = models.IntegerField(
        default=3300,
        help_text="Capacidad total en litros"
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo'
    )
    fecha_instalacion = models.DateField(null=True, blank=True)
    
    # Timestamps
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contenedores'
        ordering = ['numero']
        verbose_name = 'Contenedor'
        verbose_name_plural = 'Contenedores'
    
    def __str__(self):
        return f"Contenedor #{self.numero} - {self.nombre}"
    
    @property
    def nivel_actual(self):
        """Obtiene el nivel actual del contenedor"""
        ultima_lectura = self.lecturas.first()
        return float(ultima_lectura.nivel_llenado) if ultima_lectura else 0.0
    
    @property
    def alertas_activas_count(self):
        """Cuenta alertas activas"""
        return self.alertas.filter(resuelta=False).count()
