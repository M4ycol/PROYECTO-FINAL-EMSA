# contenedores/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Contenedor
from .serializers import (
    ContenedorListSerializer,
    ContenedorDetailSerializer,
    ContenedorCreateSerializer,
)


class ContenedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar contenedores

    - list: Listar todos los contenedores
    - retrieve: Obtener detalle de un contenedor
    - create: Crear nuevo contenedor
    - update/partial_update: Actualizar contenedor
    - destroy: Eliminar contenedor
    """
    queryset = Contenedor.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return ContenedorListSerializer
        elif self.action == 'retrieve':
            return ContenedorDetailSerializer
        return ContenedorCreateSerializer

    def get_queryset(self):
        queryset = Contenedor.objects.all()

        # Filtro por estado
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        # Filtro por número
        numero = self.request.query_params.get('numero')
        if numero:
            queryset = queryset.filter(numero=numero)

        # Búsqueda por nombre o ubicación
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(ubicacion__icontains=search)
            )

        return queryset.order_by('-fecha_instalacion')

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas simples para el dashboard.
        GET /api/contenedores/contenedores/estadisticas/
        """
        contenedores = Contenedor.objects.all()

        total = contenedores.count()
        activos = contenedores.filter(estado='ACTIVO').count()

        nivel_promedio = 0
        if total > 0:
            suma_niveles = sum(c.nivel_actual for c in contenedores)
            nivel_promedio = round(suma_niveles / total, 2)

        return Response({
            'total_contenedores': total,
            'contenedores_activos': activos,
            'nivel_promedio': nivel_promedio,
        })

    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        """
        Estadísticas generales del sistema.
        GET /api/contenedores/contenedores/estadisticas_generales/
        """
        contenedores = Contenedor.objects.all()

        total = contenedores.count()
        activos = contenedores.filter(estado='ACTIVO').count()
        inactivos = contenedores.filter(estado='INACTIVO').count()
        mantenimiento = contenedores.filter(estado='MANTENIMIENTO').count()

        nivel_promedio = 0
        if total > 0:
            suma_niveles = sum(c.nivel_actual for c in contenedores)
            nivel_promedio = round(suma_niveles / total, 2)

        data = {
            'total_contenedores': total,
            'contenedores_activos': activos,
            'contenedores_inactivos': inactivos,
            'contenedores_mantenimiento': mantenimiento,
            'nivel_promedio': nivel_promedio,
            'timestamp': timezone.now(),
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def mapa(self, request):
        """
        Datos para el mapa interactivo.
        GET /api/contenedores/contenedores/mapa/
        """
        contenedores = Contenedor.objects.filter(estado='ACTIVO')

        datos_mapa = []
        for contenedor in contenedores:
            nivel = contenedor.nivel_actual

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
                'nombre': contenedor.nombre,
                'ubicacion': contenedor.ubicacion,
                'latitud': float(contenedor.latitud) if contenedor.latitud else 0,
                'longitud': float(contenedor.longitud) if contenedor.longitud else 0,
                'nivel_llenado': nivel,
                'estado_nivel': estado_nivel,
                'color': color,
                'alertas_activas': 0,  # por ahora fijo en 0
            })

        return Response(datos_mapa)

    @action(detail=True, methods=['get'])
    def historial(self, request, pk=None):
        """
        Historial de lecturas de un contenedor.
        GET /api/contenedores/contenedores/{id}/historial/?dias=7
        """
        contenedor = self.get_object()

        dias = int(request.query_params.get('dias', 7))
        fecha_desde = timezone.now() - timedelta(days=dias)

        lecturas = []
        try:
            lecturas_qs = contenedor.lecturas.filter(
                timestamp__gte=fecha_desde
            ).order_by('timestamp')

            from sensores.serializers import LecturaSensorSerializer
            lecturas = LecturaSensorSerializer(lecturas_qs, many=True).data
        except Exception:
            pass

        return Response({
            'contenedor': ContenedorListSerializer(contenedor).data,
            'lecturas': lecturas,
            'periodo_dias': dias,
        })
