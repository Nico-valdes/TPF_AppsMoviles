from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, ProfessionalDetailViewSet, ScheduleViewSet,
    AppointmentViewSet, ChatViewSet, MessageViewSet, RegisterView, 
    CustomTokenObtainPairView, CurrentUserView, UpcomingAppointmentsView,
    BecomeProfessionalView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'professional-details', ProfessionalDetailViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'chats', ChatViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = [
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('appointments/upcoming/', UpcomingAppointmentsView.as_view(), name='upcoming_appointments'),
    path('users/become-professional/', BecomeProfessionalView.as_view(), name='become_professional'),
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
]

