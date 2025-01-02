from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReferenceViewSet, MachineViewSet, MaintenanceViewSet, ClaimViewSet, TableViewSet, UserReferenceViewSet
from .views import main_page

# Создаем маршруты через DefaultRouter
router = DefaultRouter()
router.register(r'machines', MachineViewSet, basename='machine')
router.register(r'maintenances', MaintenanceViewSet, basename='maintenance')
router.register(r'claims', ClaimViewSet, basename='claim')
router.register(r'table', TableViewSet, basename='table')
router.register(r'references', ReferenceViewSet, basename='reference')  # Register ReferenceViewSet
router.register(r'user_references', UserReferenceViewSet, basename='user_reference')

# Указываем основные маршруты
urlpatterns = [
    path('', include(router.urls)),  # Включение маршрутов API
]


