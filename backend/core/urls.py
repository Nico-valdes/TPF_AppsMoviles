from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ProfessionalDetailViewSet, ScheduleViewSet,
    AppointmentViewSet, ChatViewSet, MessageViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'professionals', ProfessionalDetailViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'chats', ChatViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
