'''# sensores/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LecturaSensorViewSet

router = DefaultRouter()
router.register(r'lecturas', LecturaSensorViewSet, basename='lectura')

urlpatterns = [
    path('', include(router.urls)),
]
'''