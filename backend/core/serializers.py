from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message, Review, Notification


class UserSerializer(serializers.ModelSerializer):
    profileImage = serializers.ImageField(required=False, allow_null=True, max_length=None)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'lastName', 'bio', 'profileImage', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'is_active']
    
    def validate_profileImage(self, value):
        if value and hasattr(value, 'size') and value.size == 0:
            raise serializers.ValidationError("El archivo de imagen está vacío")
        return value
    
    def update(self, instance, validated_data):
        # Manejar la imagen de perfil
        if 'profileImage' in validated_data:
            # Si hay una nueva imagen, eliminar la anterior si existe
            if instance.profileImage:
                instance.profileImage.delete(save=False)
        
        return super().update(instance, validated_data)


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
        fields = ['id', 'professional', 'category', 'category_display', 'address', 'description', 'hourly_rate', 'is_verified', 'rating', 'total_reviews']


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


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
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
