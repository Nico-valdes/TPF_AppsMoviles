from rest_framework import viewsets
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message
from .serializers import (
    UserSerializer, ProfessionalDetailSerializer, ScheduleSerializer,
    AppointmentSerializer, ChatSerializer, MessageSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class ProfessionalDetailViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalDetail.objects.all()
    serializer_class = ProfessionalDetailSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer


class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
