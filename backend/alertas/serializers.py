# alertas/serializers.py
from rest_framework import serializers
from .models import Alerta

class AlertaSerializer(serializers.ModelSerializer):
    """Serializer para alertas"""
    contenedor_numero = serializers.IntegerField(
        source='contenedor.numero',
        read_only=True
    )
    contenedor_nombre = serializers.CharField(
        source='contenedor.nombre',
        read_only=True
    )
    resuelto_por_nombre = serializers.CharField(
        source='resuelto_por.username',
        read_only=True,
        allow_null=True
    )
    tiempo_transcurrido = serializers.CharField(read_only=True)
    
    class Meta:
        model = Alerta
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'contenedor_nombre', 'tipo', 'prioridad',
            'mensaje', 'valor_actual', 'umbral',
            'resuelta', 'resuelto_por', 'resuelto_por_nombre',
            'resuelto_en', 'notas_resolucion',
            'creada_en', 'actualizada_en', 'tiempo_transcurrido'
        ]
        read_only_fields = ['creada_en', 'actualizada_en']


class AlertaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear alertas"""
    
    class Meta:
        model = Alerta
        fields = [
            'contenedor', 'tipo', 'prioridad',
            'mensaje', 'valor_actual', 'umbral'
        ]


class AlertaResolverSerializer(serializers.Serializer):
    """Serializer para resolver alertas"""
    notas_resolucion = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Notas sobre la resolución"
    )
