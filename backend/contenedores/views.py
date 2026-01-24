# contenedores/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from rest_framework import status
from .algoritmo_optimizacion import OptimizadorRecoleccion
from .models import Contenedor, Alerta

from .models import Contenedor
from .serializers import (
    ContenedorListSerializer,
    ContenedorDetailSerializer,
    ContenedorCreateSerializer,
    AlertaSerializer,AlertaUpdateSerializer,
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
    
@api_view(['GET'])
def datos_tiempo_real(request):
    """
    Endpoint para obtener datos en tiempo real del ESP32
    """
    datos = {
        'contenedor_id': 'contenedor-emsa-001',
        'timestamp': str(timezone.now()),
        'nivel': {
            'distancia_cm': 210.58,
            'porcentaje': 0.0
        },
        'ambiente': {
            'temperatura': 21.1,
            'humedad': 50.0,
            'presion': 736.6
        },
        'gases': {
            'ppm': 207
        },
        'estado': 'normal'
    }
    return Response(datos)


@api_view(['POST'])
@permission_classes([AllowAny])
def recibir_datos_iot(request):
    """
    Endpoint para recibir datos desde AWS IoT Rule
    POST /api/contenedores/recibir-datos-iot/
    """
    try:
        data = request.data
        
        # Log para debugging
        print(f"Datos recibidos de AWS: {data}")
        
        # Guardar en variable global o caché para tiempo real
        # Por ahora solo imprimimos
        
        return Response({
            'status': 'success',
            'message': 'Datos recibidos correctamente'
        }, status=201)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=400)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def optimizacion_view(request):
    """
    Endpoint para obtener priorización de contenedores
    GET /api/contenedores/optimizacion/
    """
    try:
        optimizador = OptimizadorRecoleccion()
        resultado = optimizador.optimizar_recoleccion()
        
        # Serializar resultado para JSON
        response_data = {
            'success': True,
            'timestamp': resultado['timestamp'].isoformat(),
            'total_contenedores': resultado['total_contenedores'],
            'alta_prioridad': [
                {
                    'id': c['id'],
                    'numero': c['numero'],
                    'nombre': c['nombre'],
                    'nivel_actual': c['nivel_actual'],
                    'tasa_llenado': c['tasa_llenado'],
                    'dias_hasta_lleno': c['dias_hasta_lleno'],
                    'prioridad': c['prioridad']
                }
                for c in resultado['alta_prioridad']
            ],
            'media_prioridad': [
                {
                    'id': c['id'],
                    'numero': c['numero'],
                    'nombre': c['nombre'],
                    'nivel_actual': c['nivel_actual'],
                    'prioridad': c['prioridad']
                }
                for c in resultado['media_prioridad']
            ],
            'baja_prioridad': [
                {
                    'id': c['id'],
                    'numero': c['numero'],
                    'nombre': c['nombre'],
                    'nivel_actual': c['nivel_actual'],
                    'prioridad': c['prioridad']
                }
                for c in resultado['baja_prioridad']
            ],
            'capacidad_camiones': resultado['capacidad_camiones']
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Agregar estas vistas al archivo views.py existente

class AlertaViewSet(viewsets.ModelViewSet):
    queryset = Alerta.objects.all()
    serializer_class = AlertaSerializer
    
    def get_serializer_class(self):
        """Usa diferentes serializers según la acción"""
        if self.action in ['update', 'partial_update']:
            return AlertaUpdateSerializer
        return AlertaSerializer
    
    def list(self, request):
        """Lista todas las alertas"""
        alertas = self.get_queryset().order_by('-fecha_creacion')
        serializer = self.get_serializer(alertas, many=True)
        return Response({
            'success': True,
            'alertas': serializer.data
        })



class GenerarAlertasView(APIView):
    """
    Vista para generar alertas automáticas basadas en el nivel de los contenedores
    """
    permission_classes = [permissions.AllowAny]  # <- AGREGAR ESTO
    
    def post(self, request):
        try:
            alertas_generadas = []
            
            # Obtener todos los contenedores activos
            contenedores = Contenedor.objects.filter(
                estado='activo',  # <- CORREGIDO: minúsculas
            )
            
            for contenedor in contenedores:
                nivel = contenedor.nivel_actual  # <- CORREGIDO: usar property nivel_actual
                
                # Verificar si ya existe una alerta activa para este contenedor
                alerta_existente = Alerta.objects.filter(
                    contenedor=contenedor,
                    estado='activa'
                ).first()
                
                # Nivel CRÍTICO (≥80%)
                if nivel >= 80:
                    if not alerta_existente or alerta_existente.tipo != 'critico':
                        # Resolver alerta anterior si existe
                        if alerta_existente:
                            alerta_existente.estado = 'resuelta'
                            alerta_existente.fecha_resolucion = timezone.now()
                            alerta_existente.save()
                        
                        # Crear nueva alerta crítica
                        alerta = Alerta.objects.create(
                            contenedor=contenedor,
                            tipo='critico',
                            mensaje=f'🚨 URGENTE: {contenedor.nombre} al {nivel:.1f}% de capacidad. Requiere vaciado inmediato.',  # <- CORREGIDO
                            nivel_detectado=nivel
                        )
                        alertas_generadas.append(alerta)
                
                # Nivel ADVERTENCIA (60-79%)
                elif nivel >= 60:
                    if not alerta_existente or alerta_existente.tipo == 'info':
                        # Resolver alerta anterior si existe
                        if alerta_existente:
                            alerta_existente.estado = 'resuelta'
                            alerta_existente.fecha_resolucion = timezone.now()
                            alerta_existente.save()
                        
                        # Crear nueva alerta de advertencia
                        alerta = Alerta.objects.create(
                            contenedor=contenedor,
                            tipo='advertencia',
                            mensaje=f'⚠️ ADVERTENCIA: {contenedor.nombre} al {nivel:.1f}%. Programar recolección pronto.',  # <- CORREGIDO
                            nivel_detectado=nivel
                        )
                        alertas_generadas.append(alerta)
                
                # Nivel NORMAL (<60%)
                else:
                    # Resolver cualquier alerta activa
                    if alerta_existente:
                        alerta_existente.estado = 'resuelta'
                        alerta_existente.fecha_resolucion = timezone.now()
                        alerta_existente.save()
            
            return Response({
                'success': True,
                'alertas_generadas': len(alertas_generadas),
                'mensaje': f'Se generaron {len(alertas_generadas)} nuevas alertas',
                'contenedores_revisados': contenedores.count()  # <- AGREGADO
            })
            
        except Exception as e:
            import traceback  # <- AGREGADO para mejor debugging
            return Response({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()  # <- AGREGADO
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

