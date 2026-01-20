# contenedores/serializers.py
from rest_framework import serializers
from .models import Contenedor, Alerta 
from .models import Contenedor


class ContenedorListSerializer(serializers.ModelSerializer):
    """Serializer para lista de contenedores"""
    nivel_actual = serializers.SerializerMethodField()
    alertas_activas = serializers.SerializerMethodField()
    
    class Meta:
        model = Contenedor
        fields = [
            'id', 'numero', 'nombre', 'direccion',
            'latitud', 'longitud', 'capacidad_litros',
            'estado', 'nivel_actual', 'alertas_activas',
            'fecha_instalacion', 'creado_en', 'actualizado_en'
        ]
    
    def get_nivel_actual(self, obj):
        """Obtiene el nivel actual del contenedor"""
        ultima_lectura = obj.lecturas.first()
        return float(ultima_lectura.nivel_llenado) if ultima_lectura else 0.0
    
    def get_alertas_activas(self, obj):
        """Cuenta alertas activas"""
        return obj.alertas.filter(resuelta=False).count()


class ContenedorDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para un contenedor"""
    lecturas_recientes = serializers.SerializerMethodField()
    alertas_activas = serializers.SerializerMethodField()
    
    class Meta:
        model = Contenedor# contenedores/serializers.py
from rest_framework import serializers
from .models import Contenedor  # solo Contenedor, sin Alerta


class ContenedorListSerializer(serializers.ModelSerializer):
    """Serializer para lista de contenedores"""
    nivel_actual = serializers.SerializerMethodField()
    alertas_activas = serializers.SerializerMethodField()

    class Meta:
        model = Contenedor
        fields = [
            'id', 'numero', 'nombre', 'direccion',
            'latitud', 'longitud', 'capacidad_litros',
            'estado', 'nivel_actual', 'alertas_activas',
            'fecha_instalacion', 'creado_en', 'actualizado_en',
        ]

    def get_nivel_actual(self, obj):
        """Obtiene el nivel actual del contenedor"""
        ultima_lectura = obj.lecturas.first()
        return float(ultima_lectura.nivel_llenado) if ultima_lectura else 0.0

    def get_alertas_activas(self, obj):
        """Por ahora siempre 0, aún sin modelo de alertas ligado"""
        return 0


class ContenedorDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para un contenedor"""
    lecturas_recientes = serializers.SerializerMethodField()
    alertas_activas = serializers.SerializerMethodField()

    class Meta:
        model = Contenedor
        fields = '__all__'

    def get_lecturas_recientes(self, obj):
        """Últimas 10 lecturas"""
        from sensores.serializers import LecturaSensorSerializer
        lecturas = obj.lecturas.all()[:10]
        return LecturaSensorSerializer(lecturas, many=True).data

    def get_alertas_activas(self, obj):
        """Por ahora sin alertas asociadas"""
        return []


class ContenedorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar contenedores"""

    class Meta:
        model = Contenedor
        fields = [
            'nombre', 'direccion',
            'latitud', 'longitud', 'capacidad_litros',
            'estado',
        ]
        # numero y fecha_instalacion se generan automáticamente

        fields = '__all__'
    
    def get_lecturas_recientes(self, obj):
        """Últimas 10 lecturas"""
        from sensores.serializers import LecturaSensorSerializer
        lecturas = obj.lecturas.all()[:10]
        return LecturaSensorSerializer(lecturas, many=True).data
    
    def get_alertas_activas(self, obj):
        """Alertas no resueltas"""
        from alertas.serializers import AlertaSerializer
        alertas = obj.alertas.filter(resuelta=False)
        return AlertaSerializer(alertas, many=True).data


class ContenedorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar contenedores"""
    
    class Meta:
        model = Contenedor
        fields = [
            'nombre', 'direccion',
            'latitud', 'longitud', 'capacidad_litros',
            'estado'
        ]
        # ✅ numero y fecha_instalacion se generan automáticamente
    
    # ✅ ELIMINADO: validate_numero ya no es necesario
class AlertaSerializer(serializers.ModelSerializer):
    contenedor_nombre = serializers.CharField(source='contenedor.nombre', read_only=True)
    contenedor_numero = serializers.IntegerField(source='contenedor.numero', read_only=True)
    contenedor_direccion = serializers.CharField(source='contenedor.direccion', read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Alerta
        fields = [
            'id',
            'contenedor',
            'contenedor_nombre',
            'contenedor_numero',
            'contenedor_direccion',
            'tipo',
            'tipo_display',
            'titulo',
            'descripcion',
            'nivel_actual',
            'estado',
            'estado_display',
            'fecha_creacion',
            'fecha_vista',
            'fecha_resolucion',
            'comentario_resolucion',
            'tiempo_transcurrido',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_vista', 'fecha_resolucion']
    
    def get_tiempo_transcurrido(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.fecha_creacion
        
        if delta.seconds < 60:
            return "Hace menos de 1 minuto"
        elif delta.seconds < 3600:
            minutos = delta.seconds // 60
            return f"Hace {minutos} minuto{'s' if minutos > 1 else ''}"
        elif delta.days == 0:
            horas = delta.seconds // 3600
            return f"Hace {horas} hora{'s' if horas > 1 else ''}"
        elif delta.days == 1:
            return "Hace 1 dia"
        else:
            return f"Hace {delta.days} dias"


class AlertaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerta
        fields = [
            'contenedor',
            'tipo',
            'titulo',
            'descripcion',
            'nivel_actual',
        ]