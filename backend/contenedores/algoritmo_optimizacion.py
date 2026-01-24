from datetime import datetime, timedelta
from django.utils import timezone
from .models import Contenedor, LecturaSensor
import logging

logger = logging.getLogger(__name__)

class OptimizadorRecoleccion:
    """
    Algoritmo Greedy para priorizar recolección de contenedores
    bajo recursos limitados (2 camiones, capacidad limitada)
    """
    
    # Constantes del sistema EMSA
    CAPACIDAD_CAMION_M3 = 12
    CAPACIDAD_CAMION_LITROS = 12000
    NUM_CAMIONES = 2
    CAPACIDAD_CONTENEDOR = 3300
    
    # Umbrales de criticidad
    NIVEL_CRITICO = 80
    NIVEL_ADVERTENCIA = 60
    
    def __init__(self):
        self.contenedores_data = []
    
    def calcular_tasa_llenado(self, contenedor):
        """
        Calcula la tasa de llenado promedio en %/hora
        usando las últimas 24 horas de lecturas
        """
        try:
            ahora = timezone.now()
            hace_24h = ahora - timedelta(hours=24)
            
            lecturas = contenedor.lecturas.filter(
                timestamp__gte=hace_24h
            ).order_by('timestamp')
            
            if lecturas.count() < 2:
                return 0.0
            
            primera = lecturas.first()
            ultima = lecturas.last()
            
            diferencia_nivel = ultima.nivel_llenado - primera.nivel_llenado
            diferencia_tiempo = (ultima.timestamp - primera.timestamp).total_seconds() / 3600
            
            if diferencia_tiempo == 0:
                return 0.0
            
            tasa = diferencia_nivel / diferencia_tiempo
            return max(0, tasa)
            
        except Exception as e:
            logger.error(f"Error calculando tasa de llenado: {e}")
            return 0.0
    
    def calcular_tiempo_hasta_llenado(self, nivel_actual, tasa_llenado):
        """
        Calcula horas hasta llegar al 100% de llenado
        """
        if tasa_llenado <= 0:
            return float('inf')
        
        nivel_restante = 100 - nivel_actual
        horas_hasta_lleno = nivel_restante / tasa_llenado
        
        return horas_hasta_lleno
    
    def calcular_puntuacion_prioridad(self, contenedor_data):
        """
        Algoritmo Greedy: Calcula puntuación de prioridad
        
        Función objetivo: Maximizar urgencia de recolección
        Variables: nivel_actual, tasa_llenado, tiempo_hasta_lleno
        
        Puntuación más alta = Mayor prioridad
        """
        nivel = contenedor_data['nivel_actual']
        tasa = contenedor_data['tasa_llenado']
        horas_hasta_lleno = contenedor_data['horas_hasta_lleno']
        
        # Componente 1: Criticidad actual (0-50 puntos)
        if nivel >= self.NIVEL_CRITICO:
            puntos_criticidad = 50
        elif nivel >= self.NIVEL_ADVERTENCIA:
            puntos_criticidad = 30
        else:
            puntos_criticidad = nivel * 0.3
        
        # Componente 2: Urgencia temporal (0-30 puntos)
        if horas_hasta_lleno < 24:
            puntos_urgencia = 30
        elif horas_hasta_lleno < 48:
            puntos_urgencia = 20
        elif horas_hasta_lleno < 72:
            puntos_urgencia = 10
        else:
            puntos_urgencia = 0
        
        # Componente 3: Tasa de llenado (0-20 puntos)
        puntos_tasa = min(20, tasa * 2)
        
        # Puntuación total (0-100)
        puntuacion_total = puntos_criticidad + puntos_urgencia + puntos_tasa
        
        return min(100, puntuacion_total)
    
    def optimizar_recoleccion(self):
        """
        Algoritmo principal: Prioriza contenedores para recolección
        """
        contenedores = Contenedor.objects.filter(estado='activo')
        self.contenedores_data = []
        
        # Paso 1: Recopilar datos de todos los contenedores
        for contenedor in contenedores:
            nivel_actual = contenedor.nivel_actual
            tasa_llenado = self.calcular_tasa_llenado(contenedor)
            horas_hasta_lleno = self.calcular_tiempo_hasta_llenado(nivel_actual, tasa_llenado)
            
            data = {
                'contenedor': contenedor,
                'id': contenedor.id,
                'numero': contenedor.numero,
                'nombre': contenedor.nombre,
                'nivel_actual': nivel_actual,
                'tasa_llenado': round(tasa_llenado, 2),
                'horas_hasta_lleno': round(horas_hasta_lleno, 1) if horas_hasta_lleno != float('inf') else None,
                'dias_hasta_lleno': round(horas_hasta_lleno / 24, 1) if horas_hasta_lleno != float('inf') else None,
            }
            
            # Calcular prioridad
            data['prioridad'] = round(self.calcular_puntuacion_prioridad(data), 1)
            
            self.contenedores_data.append(data)
        
        # Paso 2: Ordenar por prioridad (Greedy)
        self.contenedores_data.sort(key=lambda x: x['prioridad'], reverse=True)
        
        # Paso 3: Clasificar por niveles de prioridad
        alta_prioridad = [c for c in self.contenedores_data if c['prioridad'] >= 70]
        media_prioridad = [c for c in self.contenedores_data if 40 <= c['prioridad'] < 70]
        baja_prioridad = [c for c in self.contenedores_data if c['prioridad'] < 40]
        
        # Paso 4: Calcular capacidad necesaria
        litros_alta = sum(c['nivel_actual'] * self.CAPACIDAD_CONTENEDOR / 100 for c in alta_prioridad)
        camiones_necesarios = (litros_alta / self.CAPACIDAD_CAMION_LITROS) + 1
        
        resultado = {
            'alta_prioridad': alta_prioridad,
            'media_prioridad': media_prioridad,
            'baja_prioridad': baja_prioridad,
            'total_contenedores': len(self.contenedores_data),
            'capacidad_camiones': {
                'litros_alta_prioridad': round(litros_alta, 2),
                'camiones_necesarios': int(camiones_necesarios),
                'camiones_disponibles': self.NUM_CAMIONES,
                'suficiente_capacidad': camiones_necesarios <= self.NUM_CAMIONES
            },
            'timestamp': timezone.now()
        }
        
        logger.info(f"Optimización completada: {len(alta_prioridad)} alta prioridad")
        
        return resultado
