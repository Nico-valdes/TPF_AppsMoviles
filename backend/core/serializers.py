from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ProfessionalDetail, Schedule, Appointment, Chat, Message


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class ProfessionalDetailSerializer(serializers.ModelSerializer):
    professional = UserSerializer(read_only=True)

    class Meta:
        model = ProfessionalDetail
        fields = '__all__'


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    regular_name = serializers.CharField(source='regular.name', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'date', 'start_time', 'end_time', 'status', 'professional_name', 'regular_name']


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

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
