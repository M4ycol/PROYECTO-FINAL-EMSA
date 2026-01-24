# contenedores/serializers.py
from rest_framework import serializers
from .models import Contenedor, Alerta


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
        return float(obj.nivel_actual)
    
    def get_alertas_activas(self, obj):
        """Cuenta alertas activas"""
        return obj.alertas.filter(estado='activa').count()


class AlertaSerializer(serializers.ModelSerializer):
    """Serializer para LEER alertas (GET)"""
    contenedor_ubicacion = serializers.CharField(source='contenedor.direccion', read_only=True)
    contenedor_nombre = serializers.CharField(source='contenedor.nombre', read_only=True)
    titulo = serializers.CharField(source='mensaje', read_only=True)
    descripcion = serializers.CharField(source='mensaje', read_only=True)
    severidad = serializers.SerializerMethodField()
    leida = serializers.SerializerMethodField()
    
    class Meta:
        model = Alerta
        fields = [
            'id', 
            'contenedor', 
            'contenedor_nombre',
            'contenedor_ubicacion',
            'tipo', 
            'estado', 
            'mensaje',
            'titulo',
            'descripcion',
            'severidad',
            'leida',
            'nivel_detectado',
            'fecha_creacion', 
            'fecha_resolucion'
        ]
        read_only_fields = ['fecha_creacion']
    
    def get_severidad(self, obj):
        """Mapea el nivel detectado a severidad"""
        nivel = obj.nivel_detectado or 0
        if nivel >= 80:
            return 'alta'
        elif nivel >= 60:
            return 'media'
        else:
            return 'baja'
    
    def get_leida(self, obj):
        """Mapea estado a leída"""
        return obj.estado == 'resuelta'


class AlertaUpdateSerializer(serializers.Serializer):
    """Serializer para ACTUALIZAR alertas (PATCH)"""
    leida = serializers.BooleanField(required=False)
    
    def update(self, instance, validated_data):
        """Convierte leida a estado"""
        if 'leida' in validated_data:
            if validated_data['leida']:
                instance.estado = 'resuelta'
            else:
                instance.estado = 'activa'
        instance.save()
        return instance


class ContenedorDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para un contenedor"""
    lecturas_recientes = serializers.SerializerMethodField()
    alertas_activas = serializers.SerializerMethodField()
    nivel_actual = serializers.SerializerMethodField()
    
    class Meta:
        model = Contenedor
        fields = '__all__'
    
    def get_nivel_actual(self, obj):
        """Obtiene el nivel actual del contenedor"""
        return float(obj.nivel_actual)
    
    def get_lecturas_recientes(self, obj):
        """Últimas 10 lecturas"""
        from sensores.serializers import LecturaSensorSerializer
        lecturas = obj.lecturas.all()[:10]
        return LecturaSensorSerializer(lecturas, many=True).data
    
    def get_alertas_activas(self, obj):
        """Alertas activas del contenedor"""
        alertas = obj.alertas.filter(estado='activa')
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


class AlertaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear alertas manualmente"""
    
    class Meta:
        model = Alerta
        fields = [
            'contenedor',
            'tipo',
            'mensaje',
            'nivel_detectado',
        ]
