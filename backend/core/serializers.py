from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message, Review, Notification, ChatRoom, ChatMessage


class UserSerializer(serializers.ModelSerializer):
    profileImage = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'lastName', 'bio', 'profileImage', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'is_active']


class ProfessionalDetailSerializer(serializers.ModelSerializer):
    professional = UserSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = ProfessionalDetail
        fields = '__all__'


class ProfessionalListSerializer(serializers.ModelSerializer):
    professional = UserSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = ProfessionalDetail
        fields = ['id', 'professional', 'category', 'category_display', 'address', 'description', 'hourly_rate', 'is_verified', 'rating', 'total_reviews', 'latitude', 'longitude']


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    regular_name = serializers.CharField(source='regular.name', read_only=True)
    professional_email = serializers.CharField(source='professional.email', read_only=True)
    regular_email = serializers.CharField(source='regular.email', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'date', 'start_time', 'end_time', 'status', 'notes', 'service', 'total_price', 'professional_name', 'regular_name', 'professional_email', 'regular_email', 'created_at', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['professional', 'date', 'start_time', 'end_time', 'notes', 'service', 'total_price']
        extra_kwargs = {
            'total_price': {'required': False},
            'end_time': {'required': False},
            'notes': {'required': False},
            'service': {'required': False},
        }


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    regular_name = serializers.CharField(source='regular.name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'professional', 'regular', 'appointment', 'rating', 'comment', 'created_at', 'professional_name', 'regular_name']
        read_only_fields = ['professional', 'regular', 'appointment']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_at', 'related_appointment']
        read_only_fields = ['user']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Agregar info extra al token
        token['email'] = user.email
        token['name'] = user.name
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Agregar info extra a la respuesta
        data['user_id'] = self.user.id
        data['email'] = self.user.email
        data['name'] = self.user.name
        data['role'] = self.user.role
        return data

class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'participants', 'last_message', 'unread_count', 'updated_at', 'is_active']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'text': last_msg.message,
                'timestamp': last_msg.timestamp,
                'sender': last_msg.sender.name,
                'message_type': last_msg.message_type,
            }
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender', 'message', 'timestamp', 'is_read', 'message_type', 'audio_file', 'audio_duration']
        read_only_fields = ['timestamp', 'is_read']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
