from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, ProfessionalDetailViewSet, ScheduleViewSet,
    AppointmentViewSet, ChatViewSet, MessageViewSet, RegisterView, 
    CustomTokenObtainPairView, CurrentUserView, UpcomingAppointmentsView,
    BecomeProfessionalView, ProfessionalsListView, ProfessionalDetailView,
    CreateAppointmentView, UpdateAppointmentStatusView, CancelAppointmentView, ReviewView, NotificationsView,
    AvailableSlotsView, ChatRoomListView, CreateChatRoomView, ChatMessagesView, SendMessageView, MarkMessagesAsReadView
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
    
    # Profesionales
    path('professionals/', ProfessionalsListView.as_view(), name='professionals_list'),
    path('professionals/<int:professional_id>/', ProfessionalDetailView.as_view(), name='professional_detail'),
    path('professionals/<int:professional_id>/available-slots/', AvailableSlotsView.as_view(), name='available_slots'),
    
    # Turnos
    path('appointments/create/', CreateAppointmentView.as_view(), name='create_appointment'),
    path('appointments/<int:appointment_id>/status/', UpdateAppointmentStatusView.as_view(), name='update_appointment_status'),
    path('appointments/<int:appointment_id>/cancel/', CancelAppointmentView.as_view(), name='cancel_appointment'),
    
    # Reseñas
    path('reviews/', ReviewView.as_view(), name='create_review'),
    
    # Notificaciones
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('notifications/<int:notification_id>/read/', NotificationsView.as_view(), name='mark_notification_read'),
    
    # Websockets
    path('chat/rooms/', ChatRoomListView.as_view(), name='chat-rooms'),
    path('chat/create/', CreateChatRoomView.as_view(), name='create-chat'),
    path('chat/<int:room_id>/messages/', ChatMessagesView.as_view(), name='chat-messages'),
    path('chat/<int:room_id>/send/', SendMessageView.as_view(), name='send-message'),
    path('chat/<int:room_id>/read/', MarkMessagesAsReadView.as_view(), name='mark-messages-read'),

    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

