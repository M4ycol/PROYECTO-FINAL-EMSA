# alertas/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Alerta
from .serializers import (
    AlertaSerializer,
    AlertaCreateSerializer,
    AlertaResolverSerializer
)

class AlertaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar alertas
    """
    queryset = Alerta.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AlertaCreateSerializer
        elif self.action == 'resolver':
            return AlertaResolverSerializer
        return AlertaSerializer
    
    def get_queryset(self):
        queryset = Alerta.objects.select_related('contenedor', 'resuelto_por').all()
        
        # Filtro por estado resuelto
        resuelta = self.request.query_params.get('resuelta', None)
        if resuelta is not None:
            resuelta_bool = resuelta.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(resuelta=resuelta_bool)
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtro por prioridad
        prioridad = self.request.query_params.get('prioridad', None)
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)
        
        # Filtro por contenedor
        contenedor_id = self.request.query_params.get('contenedor', None)
        if contenedor_id:
            queryset = queryset.filter(contenedor_id=contenedor_id)
        
        return queryset.order_by('-creada_en')
    
    @action(detail=True, methods=['patch'])
    def resolver(self, request, pk=None):
        """
        Marca una alerta como resuelta
        PATCH /api/alertas/{id}/resolver/
        Body: { "notas_resolucion": "..." }
        """
        alerta = self.get_object()
        
        if alerta.resuelta:
            return Response(
                {'error': 'Esta alerta ya fue resuelta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AlertaResolverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Marcar como resuelta
        alerta.resuelta = True
        alerta.resuelto_por = request.user if request.user.is_authenticated else None
        alerta.resuelto_en = timezone.now()
        alerta.notas_resolucion = serializer.validated_data.get('notas_resolucion', '')
        alerta.save()
        
        return Response(AlertaSerializer(alerta).data)
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        """
        Obtiene todas las alertas activas
        GET /api/alertas/activas/
        """
        alertas = Alerta.objects.filter(resuelta=False).order_by('-prioridad', '-creada_en')
        serializer = AlertaSerializer(alertas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadísticas de alertas
        GET /api/alertas/estadisticas/
        """
        total = Alerta.objects.count()
        activas = Alerta.objects.filter(resuelta=False).count()
        resueltas = Alerta.objects.filter(resuelta=True).count()
        
        # Por prioridad
        criticas = Alerta.objects.filter(resuelta=False, prioridad='critica').count()
        altas = Alerta.objects.filter(resuelta=False, prioridad='alta').count()
        medias = Alerta.objects.filter(resuelta=False, prioridad='media').count()
        bajas = Alerta.objects.filter(resuelta=False, prioridad='baja').count()
        
        # Por tipo
        desborde = Alerta.objects.filter(resuelta=False, tipo='desborde').count()
        gas = Alerta.objects.filter(resuelta=False, tipo='gas').count()
        temperatura = Alerta.objects.filter(resuelta=False, tipo='temperatura').count()
        falla_sensor = Alerta.objects.filter(resuelta=False, tipo='falla_sensor').count()
        
        data = {
            'total': total,
            'activas': activas,
            'resueltas': resueltas,
            'por_prioridad': {
                'criticas': criticas,
                'altas': altas,
                'medias': medias,
                'bajas': bajas
            },
            'por_tipo': {
                'desborde': desborde,
                'gas': gas,
                'temperatura': temperatura,
                'falla_sensor': falla_sensor
            }
        }
        
        return Response(data)
