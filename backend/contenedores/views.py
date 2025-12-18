# contenedores/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Contenedor
from .serializers import (
    ContenedorListSerializer,
    ContenedorDetailSerializer,
    ContenedorCreateSerializer
)

class ContenedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar contenedores
    
    list: Listar todos los contenedores
    retrieve: Obtener detalle de un contenedor
    create: Crear nuevo contenedor
    update: Actualizar contenedor completo
    partial_update: Actualizar campos específicos
    destroy: Eliminar contenedor
    """
    queryset = Contenedor.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ContenedorListSerializer
        elif self.action == 'retrieve':
            return ContenedorDetailSerializer
        return ContenedorCreateSerializer
    
    def get_queryset(self):
        queryset = Contenedor.objects.all()
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Filtro por número
        numero = self.request.query_params.get('numero', None)
        if numero:
            queryset = queryset.filter(numero=numero)
        
        # Búsqueda por nombre o dirección
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) | 
                Q(direccion__icontains=search)
            )
        
        return queryset.order_by('numero')
    
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        """
        Obtiene estadísticas generales del sistema
        GET /api/contenedores/estadisticas_generales/
        """
        contenedores = Contenedor.objects.all()
        
        # Contar por estado
        total = contenedores.count()
        activos = contenedores.filter(estado='activo').count()
        inactivos = contenedores.filter(estado='inactivo').count()
        mantenimiento = contenedores.filter(estado='mantenimiento').count()
        
        # Calcular nivel promedio
        from sensores.models import LecturaSensor
        nivel_promedio = 0
        contenedores_con_datos = 0
        
        for contenedor in contenedores:
            ultima_lectura = contenedor.lecturas.first()
            if ultima_lectura:
                nivel_promedio += float(ultima_lectura.nivel_llenado)
                contenedores_con_datos += 1
        
        if contenedores_con_datos > 0:
            nivel_promedio = round(nivel_promedio / contenedores_con_datos, 2)
        
        # Contar alertas activas
        from alertas.models import Alerta
        alertas_activas = Alerta.objects.filter(resuelta=False).count()
        alertas_criticas = Alerta.objects.filter(
            resuelta=False, 
            prioridad='critica'
        ).count()
        
        data = {
            'total_contenedores': total,
            'contenedores_activos': activos,
            'contenedores_inactivos': inactivos,
            'contenedores_mantenimiento': mantenimiento,
            'nivel_promedio': nivel_promedio,
            'alertas_activas': alertas_activas,
            'alertas_criticas': alertas_criticas,
            'timestamp': timezone.now()
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def mapa(self, request):
        """
        Obtiene datos para el mapa interactivo
        GET /api/contenedores/mapa/
        """
        contenedores = Contenedor.objects.filter(estado='activo')
        
        datos_mapa = []
        for contenedor in contenedores:
            ultima_lectura = contenedor.lecturas.first()
            alertas_activas = contenedor.alertas.filter(resuelta=False).count()
            
            nivel = 0
            if ultima_lectura:
                nivel = float(ultima_lectura.nivel_llenado)
            
            # Determinar color según nivel
            if nivel >= 80:
                color = 'red'
                estado_nivel = 'critico'
            elif nivel >= 60:
                color = 'orange'
                estado_nivel = 'medio'
            else:
                color = 'green'
                estado_nivel = 'normal'
            
            datos_mapa.append({
                'id': contenedor.id,
                'numero': contenedor.numero,
                'nombre': contenedor.nombre,
                'direccion': contenedor.direccion,
                'latitud': float(contenedor.latitud),
                'longitud': float(contenedor.longitud),
                'nivel_llenado': nivel,
                'estado_nivel': estado_nivel,
                'color': color,
                'alertas_activas': alertas_activas
            })
        
        return Response(datos_mapa)
    
    @action(detail=True, methods=['get'])
    def historial(self, request, pk=None):
        """
        Obtiene historial de lecturas de un contenedor
        GET /api/contenedores/{id}/historial/?dias=7
        """
        contenedor = self.get_object()
        
        # Obtener parámetro de días (por defecto 7)
        dias = int(request.query_params.get('dias', 7))
        fecha_desde = timezone.now() - timedelta(days=dias)
        
        # Obtener lecturas
        lecturas = contenedor.lecturas.filter(
            timestamp__gte=fecha_desde
        ).order_by('timestamp')
        
        # Serializar datos
        from sensores.serializers import LecturaSensorSerializer
        data = LecturaSensorSerializer(lecturas, many=True).data
        
        return Response({
            'contenedor': ContenedorListSerializer(contenedor).data,
            'lecturas': data,
            'periodo_dias': dias
        })
