from datetime import date, datetime, timedelta
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.hashers import make_password
from django.db import models
from django.utils import timezone
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message, Review, Notification, ChatRoom, ChatMessage
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
                # Guardar la imagen en media/profile_images/
                import os
                from django.conf import settings
                
                # Crear el directorio si no existe
                media_dir = os.path.join(settings.MEDIA_ROOT, 'profile_images')
                os.makedirs(media_dir, exist_ok=True)
                
                # Generar nombre único para el archivo
                import uuid
                file_extension = os.path.splitext(uploaded_file.name)[1]
                filename = f"{uuid.uuid4()}{file_extension}"
                file_path = os.path.join(media_dir, filename)
                
                # Guardar el archivo
                with open(file_path, 'wb+') as destination:
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)
                
                # Guardar la ruta relativa en la base de datos
                relative_path = f"profile_images/{filename}"
                data['profileImage'] = relative_path
                print(f"Imagen guardada en: {relative_path}")
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
        
        # Campos adicionales para profesionales
        category = request.data.get('category')
        description = request.data.get('description')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        address = request.data.get('address')

        if not name or not email or not password or not role:
            return Response({'error': 'Todos los campos son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(name=name).exists():
            return Response({'error': 'El nombre de usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'El email ya está registrado.'}, status=status.HTTP_400_BAD_REQUEST)

        # Si es profesional, verificar campos adicionales
        if role == 'professional':
            if not category or not description or not latitude or not longitude or not address:
                return Response({'error': 'Para registrarse como profesional, debe proporcionar categoría, descripción y ubicación.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(name=name, email=email, password=password, role=role)
        user.save()
        
        # Si es profesional, crear ProfessionalDetail
        if role == 'professional':
            ProfessionalDetail.objects.create(
                professional=user,
                category=category,
                description=description,
                latitude=latitude,
                longitude=longitude,
                address=address
            )
        
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
            try:
                time_obj = datetime.strptime(time_slot, '%H:%M').time()
                data['start_time'] = time_obj
                print(f"Time convertido: {time_obj}")
                
                # Calcular end_time (1 hora después)
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
                data['professional'] = professional_id  # Usar el ID en lugar del objeto
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


class CancelAppointmentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Verificar que el usuario es el cliente o el profesional del turno
            if request.user != appointment.regular and request.user != appointment.professional:
                return Response({'error': 'No tienes permisos para cancelar este turno'}, status=status.HTTP_403_FORBIDDEN)
            
            # Verificar que el turno no esté ya cancelado o completado
            if appointment.status in ['cancelled', 'completed']:
                return Response({'error': 'No se puede cancelar un turno que ya está cancelado o completado'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Cancelar el turno
            appointment.status = 'cancelled'
            appointment.save()
            
            # Crear notificación para la otra parte
            if request.user == appointment.regular:
                # Cliente canceló, notificar al profesional
                Notification.objects.create(
                    user=appointment.professional,
                    type='appointment_cancelled',
                    title='Turno cancelado por el cliente',
                    message=f'El cliente {appointment.regular.name} ha cancelado el turno del {appointment.date}',
                    related_appointment=appointment
                )
            else:
                # Profesional canceló, notificar al cliente
                Notification.objects.create(
                    user=appointment.regular,
                    type='appointment_cancelled',
                    title='Turno cancelado por el profesional',
                    message=f'El profesional {appointment.professional.name} ha cancelado el turno del {appointment.date}',
                    related_appointment=appointment
                )
            
            return Response({'message': 'Turno cancelado exitosamente'}, status=status.HTTP_200_OK)
            
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

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, professional_id):
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        print(f"🔍 AvailableSlotsView llamado - Professional ID: {professional_id}")
        date_str = request.GET.get('date')
        print(f"📅 Fecha recibida: {date_str}")
        
        if not date_str:
            return Response(
                {'error': 'El parámetro date es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convertir la fecha string a objeto date
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            print(f"📅 Fecha parseada: {selected_date}")
            
            # Obtener el día de la semana (0 = lunes, 6 = domingo)
            day_of_week = selected_date.weekday()
            print(f"📅 Día de la semana: {day_of_week}")
            
            # Buscar el horario del profesional para ese día
            try:
                schedule = Schedule.objects.get(
                    professional_id=professional_id,
                    day_week=day_of_week
                )
                print(f"✅ Horario encontrado: {schedule.start_time} - {schedule.end_time}")
            except Schedule.DoesNotExist:
                print(f"❌ No hay horario para el día {day_of_week}")
                
                # Verificar qué horarios tiene este profesional
                all_schedules = Schedule.objects.filter(professional_id=professional_id)
                print(f"📋 Horarios totales del profesional {professional_id}: {all_schedules.count()}")
                
                for s in all_schedules:
                    print(f"  • Día {s.day_week}: {s.start_time} - {s.end_time}")
                
                return Response({
                    'professional_id': professional_id,
                    'date': date_str,
                    'day_of_week': day_of_week,
                    'available_slots': [],
                    'message': f'No hay horarios disponibles para este día'
                })
            
            # Generar slots de 30 minutos
            available_slots = []
            current_time = schedule.start_time
            
            while current_time < schedule.end_time:
                slot_time = current_time.strftime('%H:%M')
                available_slots.append(slot_time)
                
                # Avanzar 30 minutos
                current_time = (datetime.combine(date.today(), current_time) + timedelta(minutes=30)).time()
            
            print(f"⏰ Slots generados: {available_slots}")
            
            # Filtrar slots que ya tienen citas
            existing_appointments = Appointment.objects.filter(
                professional_id=professional_id,
                date=selected_date
            ).values_list('start_time', flat=True)
            
            print(f"📋 Citas existentes: {list(existing_appointments)}")
            
            # Remover slots ocupados
            occupied_slots = [appt.strftime('%H:%M') for appt in existing_appointments]
            available_slots = [slot for slot in available_slots if slot not in occupied_slots]
            
            print(f"📊 Total de slots disponibles: {len(available_slots)}")
            
            response_data = {
                'professional_id': professional_id,
                'date': date_str,
                'day_of_week': day_of_week,
                'schedule_start': schedule.start_time.strftime('%H:%M'),
                'schedule_end': schedule.end_time.strftime('%H:%M'),
                'available_slots': available_slots
            }
            
            print(f"📤 Enviando respuesta: {response_data}")
            return Response(response_data)
            
        except ValueError as e:
            print(f"❌ Error parseando fecha: {e}")
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            return Response(
                {'error': 'Error interno del servidor'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

## Vistas para asgi
class ChatRoomListView(APIView):
    """Lista las salas de chat del usuario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            rooms = ChatRoom.objects.filter(
                participants=request.user,
                is_active=True
            ).prefetch_related('participants', 'messages')
            
            rooms_data = []
            for room in rooms:
                # Obtener último mensaje
                last_message = room.messages.last()
                
                # Obtener el otro participante (en chat privado)
                other_participant = room.participants.exclude(id=request.user.id).first()
                
                rooms_data.append({
                    'id': room.id,
                    'name': room.name,
                    'other_user': {
                        'id': other_participant.id if other_participant else None,
                        'name': other_participant.name if other_participant else None,
                        'email': other_participant.email if other_participant else None,
                    },
                    'last_message': {
                        'text': last_message.message if last_message else None,
                        'timestamp': last_message.timestamp if last_message else None,
                        'sender': last_message.sender.name if last_message else None,
                    },
                    'updated_at': room.updated_at,
                })
            
            return Response({
                'success': True,
                'rooms': rooms_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class CreateChatRoomView(APIView):
    """Crear sala de chat entre dos usuarios"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            other_user_id = request.data.get('user_id')
            
            if not other_user_id:
                return Response({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            try:
                other_user = User.objects.get(id=other_user_id)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Usuario no encontrado'
                }, status=404)
            
            if other_user == request.user:
                return Response({
                    'success': False,
                    'error': 'No puedes crear un chat contigo mismo'
                }, status=400)
            
            # Crear o obtener sala privada
            room, created = ChatRoom.get_or_create_private_room(request.user, other_user)
            
            return Response({
                'success': True,
                'room': {
                    'id': room.id,
                    'name': room.name,
                    'created': created,
                    'other_user': {
                        'id': other_user.id,
                        'name': other_user.name,
                        'email': other_user.email,
                    }
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class ChatMessagesView(APIView):
    """Obtener mensajes de una sala de chat"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, room_id):
        try:
            # Verificar que el usuario pertenece a la sala
            room = ChatRoom.objects.get(
                id=room_id,
                participants=request.user,
                is_active=True
            )
            
            # Obtener mensajes
            messages = ChatMessage.objects.filter(room=room).select_related('sender')
            
            messages_data = []
            for message in messages:
                messages_data.append({
                    'id': message.id,
                    'message': message.message,
                    'sender': {
                        'id': message.sender.id,
                        'name': message.sender.name,
                    },
                    'timestamp': message.timestamp,
                    'is_read': message.is_read,
                    'message_type': message.message_type,
                })
            
            return Response({
                'success': True,
                'messages': messages_data
            })
            
        except ChatRoom.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Sala de chat no encontrada'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class SendMessageView(APIView):
    """Enviar mensaje a una sala de chat"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(
                id=room_id,
                participants=request.user,
                is_active=True
            )
            
            message_text = request.data.get('message')
            if not message_text:
                return Response({
                    'success': False,
                    'error': 'Mensaje es requerido'
                }, status=400)
            
            # Crear mensaje
            message = ChatMessage.objects.create(
                room=room,
                sender=request.user,
                message=message_text,
                message_type=request.data.get('message_type', 'text')
            )
            
            # Actualizar timestamp de la sala
            room.updated_at = timezone.now()
            room.save()
            
            return Response({
                'success': True,
                'message': {
                    'id': message.id,
                    'message': message.message,
                    'sender': {
                        'id': message.sender.id,
                        'name': message.sender.name,
                    },
                    'timestamp': message.timestamp,
                    'message_type': message.message_type,
                }
            })
            
        except ChatRoom.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Sala de chat no encontrada'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)            