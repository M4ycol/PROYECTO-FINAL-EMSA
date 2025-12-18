# sensores/serializers.py
from rest_framework import serializers
from .models import LecturaSensor
from contenedores.models import Contenedor

class LecturaSensorSerializer(serializers.ModelSerializer):
    """Serializer para lecturas de sensores"""
    contenedor_numero = serializers.IntegerField(
        source='contenedor.numero',
        read_only=True
    )
    contenedor_nombre = serializers.CharField(
        source='contenedor.nombre',
        read_only=True
    )
    
    class Meta:
        model = LecturaSensor
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'contenedor_nombre', 'nivel_llenado',
            'distancia_cm', 'temperatura', 'humedad',
            'concentracion_gas', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class LecturaSensorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear lecturas desde IoT"""
    contenedor_numero = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = LecturaSensor
        fields = [
            'contenedor_numero', 'nivel_llenado',
            'distancia_cm', 'temperatura', 'humedad',
            'concentracion_gas'
        ]
    
    def validate_contenedor_numero(self, value):
        try:
            contenedor = Contenedor.objects.get(numero=value)
            return contenedor.id
        except Contenedor.DoesNotExist:
            raise serializers.ValidationError(
                f"No existe contenedor con número {value}"
            )
    
    def validate_nivel_llenado(self, value):
        if not (0 <= float(value) <= 100):
            raise serializers.ValidationError(
                "El nivel debe estar entre 0 y 100"
            )
        return value
    
    def create(self, validated_data):
        contenedor_id = validated_data.pop('contenedor_numero')
        validated_data['contenedor_id'] = contenedor_id
        return super().create(validated_data)
