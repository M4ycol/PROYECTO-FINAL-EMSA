# contenedores/serializers.py
from rest_framework import serializers
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
            'creado_en', 'actualizado_en'
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
        model = Contenedor
        fields = '__all__'
    
    def get_lecturas_recientes(self, obj):
        """Últimas 10 lecturas"""
        from sensores.serializers import LecturaSensorSerializer # type: ignore
        lecturas = obj.lecturas.all()[:10]
        return LecturaSensorSerializer(lecturas, many=True).data
    
    def get_alertas_activas(self, obj):
        """Alertas no resueltas"""
        from alertas.serializers import AlertaSerializer # type: ignore
        alertas = obj.alertas.filter(resuelta=False)
        return AlertaSerializer(alertas, many=True).data


class ContenedorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar contenedores"""
    
    class Meta:
        model = Contenedor
        fields = [
            'numero', 'nombre', 'direccion',
            'latitud', 'longitud', 'capacidad_litros',
            'estado', 'fecha_instalacion'
        ]
    
    def validate_numero(self, value):
        if value < 1 or value > 22:
            raise serializers.ValidationError(
                "El número debe estar entre 1 y 22"
            )
        return value
