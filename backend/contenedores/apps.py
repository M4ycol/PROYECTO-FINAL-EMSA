from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class ContenedoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'contenedores'
    
    def ready(self):
        try:
            from .iot_consumer import start_iot_consumer
            import os
            
            # Solo iniciar en el proceso principal, no en el reloader
            if os.environ.get('RUN_MAIN') == 'true':
                start_iot_consumer()
                logger.info("IoT Consumer iniciado correctamente")
        except Exception as e:
            logger.error(f"Error al iniciar IoT Consumer: {str(e)}")
