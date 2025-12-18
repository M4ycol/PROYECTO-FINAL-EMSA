# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin de Django
    path('admin/', admin.site.urls),
    
    # Autenticación JWT
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # APIs de las apps
    path('api/contenedores/', include('contenedores.urls')),
    path('api/sensores/', include('sensores.urls')),
    path('api/alertas/', include('alertas.urls')),
]
