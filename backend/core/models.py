from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El usuario debe tener un email')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Guarda la contraseña hasheada
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('professional', 'Professional'),
        ('regular', 'Regular'),
    ]

    name = models.CharField(max_length=45)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Necesario para superuser

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    def __str__(self):
        return self.email


class ProfessionalDetail(models.Model):
    professional = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'professional'})
    address = models.CharField(max_length=45)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    business_type = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Dirección de {self.professional.name}"


class Schedule(models.Model):
    professional = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'professional'})
    day_week = models.IntegerField()  # 0 = lunes, 6 = domingo
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.professional.name} - Día {self.day_week}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    professional = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments_as_professional', limit_choices_to={'role': 'professional'})
    regular = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments_as_regular', limit_choices_to={'role': 'regular'})
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"{self.date} - {self.professional.name} con {self.regular.name}"


class Chat(models.Model):
    professional = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_professional', limit_choices_to={'role': 'professional'})
    regular = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_regular', limit_choices_to={'role': 'regular'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat entre {self.professional.name} y {self.regular.name}"


class Message(models.Model):
    TYPE_CHOICES = [
        ('text', 'Text'),
        ('audio', 'Audio'),
    ]

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    content = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.name}: {self.content[:30]}"
