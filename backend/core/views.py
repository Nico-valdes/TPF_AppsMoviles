from datetime import date
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.hashers import make_password
from django.db import models
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message, Review, Notification
from .serializers import (
    UserSerializer, ProfessionalDetailSerializer, ProfessionalListSerializer, ScheduleSerializer,
    AppointmentSerializer, AppointmentCreateSerializer, ChatSerializer, MessageSerializer, 
    ReviewSerializer, NotificationSerializer, CustomTokenObtainPairSerializer
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
    
    def patch(self, request):
        user = request.user
        
        # Manejar datos multipart para imágenes
        data = request.data.copy()
        
        # Si hay un archivo de imagen, procesarlo
        if 'profileImage' in request.FILES:
            uploaded_file = request.FILES['profileImage']
            # Verificar que el archivo no esté vacío
            if uploaded_file.size > 0:
                data['profileImage'] = uploaded_file
            else:
                # Si el archivo está vacío, no incluirlo en los datos
                print("Archivo de imagen vacío recibido")
        
        serializer = UserSerializer(user, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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


class ProfessionalsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        
        queryset = ProfessionalDetail.objects.filter(professional__is_active=True)
        
        if category:
            queryset = queryset.filter(category=category)
        
        if search:
            queryset = queryset.filter(
                professional__name__icontains=search
            ) | queryset.filter(
                description__icontains=search
            )
        
        serializer = ProfessionalListSerializer(queryset, many=True)
        return Response(serializer.data)


class ProfessionalDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, professional_id):
        try:
            professional_detail = ProfessionalDetail.objects.get(
                id=professional_id,
                professional__is_active=True
            )
            serializer = ProfessionalDetailSerializer(professional_detail)
            return Response(serializer.data)
        except ProfessionalDetail.DoesNotExist:
            return Response({'error': 'Profesional no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class CreateAppointmentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        print(f"Usuario autenticado: {user.name} (role: {user.role})")
        print(f"Datos recibidos: {request.data}")
        
        if user.role != 'regular':
            return Response({'error': 'Solo los clientes pueden crear turnos'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Procesar datos del frontend
        data = request.data.copy()
        
        # Convertir timeSlot a start_time
        if 'timeSlot' in data:
            time_slot = data.pop('timeSlot')
            print(f"TimeSlot recibido: {time_slot}")
            # Convertir formato "HH:MM" a objeto Time
            from datetime import datetime
            try:
                time_obj = datetime.strptime(time_slot, '%H:%M').time()
                data['start_time'] = time_obj
                print(f"Time convertido: {time_obj}")
                
                # Calcular end_time (1 hora después)
                from datetime import timedelta
                start_datetime = datetime.combine(datetime.today(), time_obj)
                end_datetime = start_datetime + timedelta(hours=1)
                data['end_time'] = end_datetime.time()
                print(f"End time calculado: {end_datetime.time()}")
            except ValueError as e:
                print(f"Error convirtiendo time: {e}")
                return Response({'error': 'Formato de hora inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convertir professionalId a professional
        if 'professionalId' in data:
            professional_id = data.pop('professionalId')
            print(f"Professional ID: {professional_id}")
            try:
                professional = User.objects.get(id=professional_id, role='professional')
                data['professional'] = professional
                print(f"Profesional encontrado: {professional.name}")
            except User.DoesNotExist:
                print(f"Profesional no encontrado con ID: {professional_id}")
                return Response({'error': 'Profesional no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Datos procesados para serializer: {data}")
        serializer = AppointmentCreateSerializer(data=data)
        if serializer.is_valid():
            print("Serializer válido, creando appointment...")
            appointment = serializer.save(regular=user)
            print(f"Appointment creado con ID: {appointment.id}")
            
            # Crear notificación para el profesional
            Notification.objects.create(
                user=appointment.professional,
                type='appointment_created',
                title='Nuevo turno solicitado',
                message=f'{user.name} ha solicitado un turno para el {appointment.date}',
                related_appointment=appointment
            )
            print("Notificación creada")
            
            return Response({'message': 'Turno creado exitosamente'}, status=status.HTTP_201_CREATED)
        else:
            print(f"Errores del serializer: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateAppointmentStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Verificar que el usuario es el profesional del turno
            if request.user != appointment.professional:
                return Response({'error': 'No tienes permisos para modificar este turno'}, status=status.HTTP_403_FORBIDDEN)
            
            new_status = request.data.get('status')
            if new_status not in dict(Appointment.STATUS_CHOICES):
                return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
            
            appointment.status = new_status
            appointment.save()
            
            # Crear notificación para el cliente
            Notification.objects.create(
                user=appointment.regular,
                type='appointment_confirmed' if new_status == 'confirmed' else 'appointment_cancelled',
                title=f'Turno {new_status}',
                message=f'Tu turno del {appointment.date} ha sido {new_status}',
                related_appointment=appointment
            )
            
            return Response({'message': f'Estado del turno actualizado a {new_status}'})
            
        except Appointment.DoesNotExist:
            return Response({'error': 'Turno no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class ReviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        if user.role != 'regular':
            return Response({'error': 'Solo los clientes pueden dejar reseñas'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(regular=user)
            
            # Actualizar rating del profesional
            professional = review.professional
            reviews = Review.objects.filter(professional=professional)
            avg_rating = reviews.aggregate(avg=models.Avg('rating'))['avg']
            professional.professionaldetail.rating = avg_rating
            professional.professionaldetail.total_reviews = reviews.count()
            professional.professionaldetail.save()
            
            # Crear notificación para el profesional
            Notification.objects.create(
                user=professional,
                type='new_review',
                title='Nueva reseña recibida',
                message=f'{user.name} ha dejado una reseña de {review.rating} estrellas',
                related_appointment=review.appointment
            )
            
            return Response({'message': 'Reseña creada exitosamente'}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'message': 'Notificación marcada como leída'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)