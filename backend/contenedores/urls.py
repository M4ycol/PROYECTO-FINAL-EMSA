# contenedores/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContenedorViewSet, AlertaViewSet, GenerarAlertasView
from . import views

router = DefaultRouter()
router.register(r'contenedores', ContenedorViewSet)
router.register(r'alertas', AlertaViewSet, basename='alerta')

urlpatterns = [
    path('datos-tiempo-real/', views.datos_tiempo_real, name='datos-tiempo-real'),
    path('recibir-datos-iot/', views.recibir_datos_iot, name='recibir-datos-iot'), 
    path('optimizacion/', views.optimizacion_view, name='optimizacion'),
    path('alertas/generar/', GenerarAlertasView.as_view(), name='generar-alertas'), 
    path('', include(router.urls)),
]



