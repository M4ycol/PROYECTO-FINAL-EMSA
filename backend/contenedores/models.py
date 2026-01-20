# contenedores/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Contenedor(models.Model):
    """
    Modelo para contenedores soterrados de EMSA
    
    Cada contenedor físico tiene:
    - 3 compartimentos (Orgánico, Inorgánico, Reciclable)
    - 1 sensor ultrasónico HC-SR04 para medición de nivel
    - Capacidad total: 3300 litros (1100L por compartimento)
    """
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('mantenimiento', 'Mantenimiento'),
    ]
    
    # Identificación
    # ✅ CAMBIADO: editable=False para auto-generar
    numero = models.IntegerField(
        unique=True, 
        validators=[MinValueValidator(1), MaxValueValidator(22)],
        help_text="AUTO-GENERADO",
        editable=False  # ✅ AGREGADO
    )
    nombre = models.CharField(
        max_length=200, 
        help_text="Nombre o identificador del contenedor"
    )
    
    # Ubicación
    direccion = models.TextField(
        help_text="Dirección exacta del contenedor"
    )
    latitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Latitud GPS (Cochabamba: -17.393)"
    )
    longitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Longitud GPS (Cochabamba: -66.157)"
    )
    
    # Características técnicas
    capacidad_litros = models.IntegerField(
        default=3300,
        validators=[MinValueValidator(100)],
        help_text="Capacidad total en litros (3 compartimentos)"
    )
    
    # Estado operativo
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo',
        help_text="Estado actual del contenedor"
    )
    
    # ✅ CAMBIADO: auto_now_add para fecha automática
    fecha_instalacion = models.DateField(
        auto_now_add=True,  # ✅ CAMBIADO de null=True, blank=True
        help_text="Fecha de instalación del contenedor (AUTO-GENERADA)"
    )
    
    # Timestamps automáticos
    creado_en = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha de creación del registro"
    )
    actualizado_en = models.DateTimeField(
        auto_now=True,
        help_text="Última actualización del registro"
    )
    
    class Meta:
        db_table = 'contenedores'
        ordering = ['numero']
        verbose_name = 'Contenedor'
        verbose_name_plural = 'Contenedores'
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['numero']),
        ]
    
    # ✅ AGREGADO: Auto-generar número antes de guardar
    def save(self, *args, **kwargs):
        if not self.numero:
            # Obtener el último número y sumar 1
            ultimo = Contenedor.objects.order_by('-numero').first()
            if ultimo and ultimo.numero < 22:
                self.numero = ultimo.numero + 1
            else:
                # Si no hay contenedores o llegamos al límite, empezar desde 1
                self.numero = 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Contenedor #{self.numero} - {self.nombre}"
    
    @property
    def nivel_actual(self):
        """
        Obtiene el nivel actual del contenedor desde el sensor HC-SR04
        
        Returns:
            float: Porcentaje de llenado (0-100)
        """
        try:
            ultima_lectura = self.lecturas.first()
            return float(ultima_lectura.nivel_llenado) if ultima_lectura else 0.0
        except:
            return 0.0
    
    @property
    def alertas_activas_count(self):
        """
        Cuenta las alertas activas del contenedor
        
        Returns:
            int: Número de alertas sin resolver
        """
        try:
            return self.alertas.filter(resuelta=False).count()
        except:
            return 0
    
    @property
    def ubicacion_gps(self):
        """
        Devuelve las coordenadas GPS en formato de tupla
        
        Returns:
            tuple: (latitud, longitud)
        """
        return (float(self.latitud), float(self.longitud))
    
    @property
    def esta_lleno(self):
        """
        Verifica si el contenedor está lleno (>= 80%)
        
        Returns:
            bool: True si nivel >= 80%
        """
        return self.nivel_actual >= 80
    
    @property
    def requiere_atencion(self):
        """
        Verifica si el contenedor requiere atención
        
        Returns:
            bool: True si está lleno o tiene alertas activas
        """
        return self.esta_lleno or self.alertas_activas_count > 0
    
    def get_estado_display_color(self):
        """
        Devuelve el color asociado al estado para visualización
        
        Returns:
            str: Código de color hexadecimal
        """
        colores = {
            'activo': '#4caf50',      # Verde
            'inactivo': '#f44336',    # Rojo
            'mantenimiento': '#ff9800' # Naranja
        }
        return colores.get(self.estado, '#9e9e9e')
    
    def get_nivel_color(self):
        """
        Devuelve el color según el nivel de llenado
        
        Returns:
            str: Código de color hexadecimal
        """
        nivel = self.nivel_actual
        if nivel >= 80:
            return '#f44336'  # Rojo - Crítico
        elif nivel >= 60:
            return '#ff9800'  # Naranja - Alerta
        else:
            return '#4caf50'  # Verde - Normal
class Alerta(models.Model):
    TIPO_CHOICES = [
        ('critico', 'Crítico'),
        ('advertencia', 'Advertencia'),
        ('informativo', 'Informativo'),
    ]
    
    ESTADO_CHOICES = [
        ('nueva', 'Nueva'),
        ('vista', 'Vista'),
        ('resuelta', 'Resuelta'),
        ('ignorada', 'Ignorada'),
    ]
    
    contenedor = models.ForeignKey(Contenedor, on_delete=models.CASCADE, related_name='alertas')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    nivel_actual = models.IntegerField(help_text="Nivel del contenedor cuando se generó la alerta")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='nueva')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_vista = models.DateTimeField(null=True, blank=True)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)
    comentario_resolucion = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.contenedor.nombre} - {self.fecha_creacion.strftime('%d/%m/%Y %H:%M')}"
