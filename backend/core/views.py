from datetime import date
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.hashers import make_password
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message
from .serializers import (
    UserSerializer, ProfessionalDetailSerializer, ScheduleSerializer,
    AppointmentSerializer, ChatSerializer, MessageSerializer, CustomTokenObtainPairSerializer
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

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')

        if not name or not email or not password or not role:
            return Response({'error': 'Todos los campos son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(name=name).exists():
            return Response({'error': 'El nombre de usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'El email ya está registrado.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(name=name, email=email, password=password, role=role)
        user.save()
        return Response({'message': 'Usuario registrado correctamente.'}, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UpcomingAppointmentsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Si es profesional, busca sus turnos como profesional
        if user.role == 'professional':
            appointments = Appointment.objects.filter(
                professional=user,
                date__gte=date.today()
            ).order_by('date', 'start_time')
        else:
            # Si es usuario regular, busca sus turnos como paciente
            appointments = Appointment.objects.filter(
                regular=user,
                date__gte=date.today()
            ).order_by('date', 'start_time')

        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

class BecomeProfessionalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role == 'professional':
            return Response({'error': 'Ya eres un profesional'}, status=status.HTTP_400_BAD_REQUEST)

        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        address = request.data.get('address')

        if not latitude or not longitude or not address:
            return Response({'error': 'Faltan datos'}, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar role del usuario
        user.role = 'professional'
        user.save()

        # Crear ProfessionalDetail
        ProfessionalDetail.objects.create(
            professional=user,
            latitude=latitude,
            longitude=longitude,
            address=address
        )

        return Response({'message': 'Ahora eres un profesional en Turnify!'}, status=status.HTTP_201_CREATED)