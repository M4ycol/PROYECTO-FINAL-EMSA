from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Contenedor(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('mantenimiento', 'Mantenimiento'),
    ]
    
    numero = models.IntegerField(
        unique=True, 
        validators=[MinValueValidator(1), MaxValueValidator(22)],
        help_text="AUTO-GENERADO",
        editable=False
    )
    nombre = models.CharField(
        max_length=200, 
        help_text="Nombre o identificador del contenedor"
    )
    
    device_id = models.CharField(
        max_length=100, 
        unique=True, 
        null=True,
        blank=True,
        help_text="ID del dispositivo IoT (ej: CONT_001, CONT_002)"
    )
    
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
    
    capacidad_litros = models.IntegerField(
        default=3300,
        validators=[MinValueValidator(100)],
        help_text="Capacidad total en litros (3 compartimentos)"
    )
    
    nivel_actual_cache = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Nivel actual en porcentaje (0-100) - Actualizado por IoT"
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo',
        help_text="Estado actual del contenedor"
    )
    
    fecha_instalacion = models.DateField(
        auto_now_add=True,
        help_text="Fecha de instalación del contenedor (AUTO-GENERADA)"
    )
    
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
            models.Index(fields=['device_id']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.numero:
            ultimo = Contenedor.objects.order_by('-numero').first()
            if ultimo and ultimo.numero < 22:
                self.numero = ultimo.numero + 1
            else:
                self.numero = 1
        
        if not self.device_id:
            self.device_id = f"CONT_{str(self.numero).zfill(3)}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Contenedor #{self.numero} - {self.nombre}"
    
    @property
    def nivel_actual(self):
        try:
            ultima_lectura = self.lecturas.first()
            if ultima_lectura:
                return float(ultima_lectura.nivel_llenado)
            return float(self.nivel_actual_cache)
        except:
            return float(self.nivel_actual_cache)
    
    @property
    def alertas_activas_count(self):
        try:
            return self.alertas.filter(estado__in=['nueva', 'vista']).count()
        except:
            return 0
    
    @property
    def ubicacion_gps(self):
        return (float(self.latitud), float(self.longitud))
    
    @property
    def esta_lleno(self):
        return self.nivel_actual >= 80
    
    @property
    def requiere_atencion(self):
        return self.esta_lleno or self.alertas_activas_count > 0
    
    def get_estado_display_color(self):
        colores = {
            'activo': '#4caf50',
            'inactivo': '#f44336',
            'mantenimiento': '#ff9800'
        }
        return colores.get(self.estado, '#9e9e9e')
    
    def get_nivel_color(self):
        nivel = self.nivel_actual
        if nivel >= 80:
            return '#f44336'
        elif nivel >= 60:
            return '#ff9800'
        else:
            return '#4caf50'
    
    def actualizar_nivel(self, nuevo_nivel):
        self.nivel_actual_cache = nuevo_nivel
        self.save(update_fields=['nivel_actual_cache', 'actualizado_en'])
        
        '''if nuevo_nivel >= 80 and not self.alertas.filter(estado='nueva', tipo='critico').exists():
            Alerta.objects.create(
                contenedor=self,
                tipo='critico',
                titulo=f'Contenedor {self.numero} crítico',
                descripcion=f'El contenedor ha alcanzado un nivel de {nuevo_nivel}% y requiere atención inmediata.',
                nivel_actual=nuevo_nivel
            )
        elif nuevo_nivel >= 60 and not self.alertas.filter(estado='nueva', tipo='advertencia').exists():
            Alerta.objects.create(
                contenedor=self,
                tipo='advertencia',
                titulo=f'Contenedor {self.numero} en advertencia',
                descripcion=f'El contenedor ha alcanzado un nivel de {nuevo_nivel}%.',
                nivel_actual=nuevo_nivel
            )
'''

class LecturaSensor(models.Model):
    contenedor = models.ForeignKey(
        Contenedor, 
        on_delete=models.CASCADE, 
        related_name='lecturas'
    )
    
    device_id = models.CharField(
        max_length=100,
        default='',
        help_text="ID del dispositivo ESP32"
    )
    
    nivel_llenado = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de llenado (0-100)"
    )
    
    distancia_cm = models.FloatField(
        null=True,
        blank=True,
        help_text="Distancia medida por sensor ultrasónico en cm"
    )
    
    temperatura = models.FloatField(
        null=True,
        blank=True,
        help_text="Temperatura ambiente en °C"
    )
    
    humedad = models.FloatField(
        null=True,
        blank=True,
        help_text="Humedad relativa en %"
    )
    
    presion = models.FloatField(
        null=True,
        blank=True,
        help_text="Presión atmosférica en hPa"
    )
    
    air_quality = models.IntegerField(
        null=True,
        blank=True,
        help_text="Calidad del aire (0-500)"
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="Momento de la lectura"
    )
    
    class Meta:
        db_table = 'lecturas_sensores'
        ordering = ['-timestamp']
        verbose_name = 'Lectura de Sensor'
        verbose_name_plural = 'Lecturas de Sensores'
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['contenedor', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.contenedor.nombre} - {self.nivel_llenado}% - {self.timestamp.strftime('%d/%m/%Y %H:%M')}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.contenedor.actualizar_nivel(self.nivel_llenado)


class Alerta(models.Model):
    TIPO_CHOICES = [
        ('critico', 'Crítico'),
        ('advertencia', 'Advertencia'),
        ('info', 'Información'),
    ]
    
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('resuelta', 'Resuelta'),
        ('ignorada', 'Ignorada'),
    ]
    
    contenedor = models.ForeignKey(Contenedor, on_delete=models.CASCADE, related_name='alertas')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activa')
    mensaje = models.TextField()
    nivel_detectado = models.FloatField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
    
    def __str__(self):
        return f"{self.tipo} - {self.contenedor.nombre} - {self.estado}"