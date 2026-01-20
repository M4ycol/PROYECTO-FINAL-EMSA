# contenedores/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContenedorViewSet

router = DefaultRouter()
router.register(r'contenedores', ContenedorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
