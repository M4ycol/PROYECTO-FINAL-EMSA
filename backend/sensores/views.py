# sensores/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import LecturaSensor
from .serializers import (
    LecturaSensorSerializer,
    LecturaSensorCreateSerializer
)
from contenedores.models import Contenedor

class LecturaSensorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar lecturas de sensores
    """
    queryset = LecturaSensor.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LecturaSensorCreateSerializer
        return LecturaSensorSerializer
    
    def get_queryset(self):
        queryset = LecturaSensor.objects.select_related('contenedor').all()
        
        # Filtro por contenedor
        contenedor_id = self.request.query_params.get('contenedor', None)
        if contenedor_id:
            queryset = queryset.filter(contenedor_id=contenedor_id)
        
        # Filtro por fecha
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        if fecha_desde:
            queryset = queryset.filter(timestamp__gte=fecha_desde)
        
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        if fecha_hasta:
            queryset = queryset.filter(timestamp__lte=fecha_hasta)
        
        # Limitar resultados
        limit = self.request.query_params.get('limit', None)
        if limit:
            queryset = queryset[:int(limit)]
        
        return queryset.order_by('-timestamp')
    
    def create(self, request, *args, **kwargs):
        """
        Crear nueva lectura y generar alertas si es necesario
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lectura = serializer.save()
        
        # Generar alertas automáticas
        self.generar_alertas(lectura)
        
        return Response(
            LecturaSensorSerializer(lectura).data,
            status=status.HTTP_201_CREATED
        )
    
    def generar_alertas(self, lectura):
        """Genera alertas automáticas según umbrales"""
        from alertas.models import Alerta
        contenedor = lectura.contenedor
        
        # Alerta de desborde (nivel > 80%)
        if float(lectura.nivel_llenado) >= 80:
            # Verificar si ya existe alerta activa
            existe = Alerta.objects.filter(
                contenedor=contenedor,
                tipo='desborde',
                resuelta=False
            ).exists()
            
            if not existe:
                prioridad = 'critica' if float(lectura.nivel_llenado) >= 90 else 'alta'
                Alerta.objects.create(
                    contenedor=contenedor,
                    tipo='desborde',
                    prioridad=prioridad,
                    mensaje=f'Nivel de llenado crítico: {lectura.nivel_llenado}%',
                    valor_actual=lectura.nivel_llenado,
                    umbral=80.0
                )
        
        # Alerta de gas (> 800 PPM)
        if lectura.concentracion_gas >= 800:
            existe = Alerta.objects.filter(
                contenedor=contenedor,
                tipo='gas',
                resuelta=False
            ).exists()
            
            if not existe:
                Alerta.objects.create(
                    contenedor=contenedor,
                    tipo='gas',
                    prioridad='media',
                    mensaje=f'Concentración de gas elevada: {lectura.concentracion_gas} PPM',
                    valor_actual=lectura.concentracion_gas,
                    umbral=800
                )
        
        # Alerta de temperatura anormal (> 35°C o < 10°C)
        if float(lectura.temperatura) > 35 or float(lectura.temperatura) < 10:
            existe = Alerta.objects.filter(
                contenedor=contenedor,
                tipo='temperatura',
                resuelta=False
            ).exists()
            
            if not existe:
                Alerta.objects.create(
                    contenedor=contenedor,
                    tipo='temperatura',
                    prioridad='baja',
                    mensaje=f'Temperatura anormal: {lectura.temperatura}°C',
                    valor_actual=lectura.temperatura,
                    umbral=35.0 if float(lectura.temperatura) > 35 else 10.0
                )
    
    @action(detail=False, methods=['get'])
    def ultima(self, request):
        """
        Obtiene la última lectura de un contenedor
        GET /api/sensores/lecturas/ultima/?contenedor=1
        """
        contenedor_id = request.query_params.get('contenedor', None)
        
        if not contenedor_id:
            return Response(
                {'error': 'Se requiere el parámetro contenedor'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lectura = LecturaSensor.objects.filter(
                contenedor_id=contenedor_id
            ).first()
            
            if not lectura:
                return Response(
                    {'error': 'No hay lecturas para este contenedor'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = LecturaSensorSerializer(lectura)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
