import json
import time
import threading
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class IoTDataConsumer:
    def __init__(self):
        self.client = None
        self.is_connected = False
        self.is_enabled = False
        
        try:
            import os
            if os.path.exists(settings.AWS_IOT_ROOT_CA) and \
               os.path.exists(settings.AWS_IOT_CERT) and \
               os.path.exists(settings.AWS_IOT_PRIVATE_KEY):
                self.is_enabled = True
                self.setup_client()
            else:
                logger.warning("Certificados de AWS IoT no encontrados. El consumidor IoT está deshabilitado.")
        except Exception as e:
            logger.error(f"Error al verificar certificados IoT: {str(e)}")
    
    def setup_client(self):
        try:
            self.client = AWSIoTMQTTClient("DjangoBackendConsumer")
            self.client.configureEndpoint(settings.AWS_IOT_ENDPOINT, 8883)
            self.client.configureCredentials(
                settings.AWS_IOT_ROOT_CA,
                settings.AWS_IOT_PRIVATE_KEY,
                settings.AWS_IOT_CERT
            )
            
            self.client.configureAutoReconnectBackoffTime(1, 32, 20)
            self.client.configureOfflinePublishQueueing(-1)
            self.client.configureDrainingFrequency(2)
            self.client.configureConnectDisconnectTimeout(10)
            self.client.configureMQTTOperationTimeout(5)
            
            logger.info("Cliente AWS IoT configurado correctamente")
        except Exception as e:
            logger.error(f"Error al configurar cliente IoT: {str(e)}")
            self.is_enabled = False
    
    
    def callback(self, client, userdata, message):
        try:
            from .models import Contenedor, LecturaSensor
        
            payload = json.loads(message.payload.decode('utf-8'))
            logger.info(f"Mensaje IoT recibido: {payload}")
        
            device_id = payload.get('device_id')
            if not device_id:
                logger.warning("Mensaje sin device_id recibido")
                return
        
            contenedor = Contenedor.objects.filter(device_id=device_id).first()
            if not contenedor:
                logger.warning(f"Contenedor no encontrado para device_id: {device_id}")
                return
        
            nivel_llenado = int(payload.get('nivel_llenado', 0))
        
            LecturaSensor.objects.create(
                contenedor=contenedor,
                nivel_llenado=nivel_llenado,
                distancia_cm=payload.get('distancia', 0),
                temperatura=payload.get('temperatura', 0),
                humedad=payload.get('humedad', 0),
            )
        
            logger.info(f"Lectura guardada - {device_id}: {nivel_llenado}%")
        
        except json.JSONDecodeError as e:
            logger.error(f"Error al decodificar JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Error al procesar mensaje IoT: {str(e)}")

    
    def start(self):
        if not self.is_enabled:
            logger.info("AWS IoT Consumer deshabilitado (certificados no configurados)")
            return
        
        try:
            self.client.connect()
            self.is_connected = True
            logger.info("Conectado a AWS IoT Core")
            
            self.client.subscribe("emsa/contenedores/#", 1, self.callback)
            logger.info("Suscrito al topic: emsa/contenedores/#")
            
            while self.is_connected:
                time.sleep(1)
                
        except Exception as e:
            logger.error(f"Error en IoT Consumer: {str(e)}")
            self.is_connected = False
    
    def stop(self):
        self.is_connected = False
        if self.client:
            self.client.disconnect()
            logger.info("Desconectado de AWS IoT Core")

iot_consumer = IoTDataConsumer()

def start_iot_consumer():
    thread = threading.Thread(target=iot_consumer.start, daemon=True)
    thread.start()
    logger.info("IoT Consumer iniciado en thread separado")
