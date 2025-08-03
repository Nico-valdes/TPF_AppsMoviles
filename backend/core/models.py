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
    lastName = models.CharField(max_length=45, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profileImage = models.CharField(max_length=500, blank=True, null=True)  # Puede ser URL externa o ruta local
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Necesario para superuser

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    def __str__(self):
        return self.email


class ProfessionalDetail(models.Model):
    CATEGORY_CHOICES = [
        ('health', 'Salud'),
        ('beauty', 'Belleza'),
        ('fitness', 'Fitness'),
        ('education', 'Educación'),
        ('legal', 'Legal'),
        ('consulting', 'Consultoría'),
        ('other', 'Otros'),
    ]
    
    professional = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'professional'})
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    address = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.professional.name} - {self.get_category_display()}"


class Schedule(models.Model):
    professional = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'professional'})
    day_week = models.IntegerField()  # 0 = lunes, 6 = domingo
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.professional.name} - Día {self.day_week}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('cancelled', 'Cancelado'),
        ('completed', 'Completado'),
        ('no_show', 'No se presentó'),
    ]

    professional = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments_as_professional', limit_choices_to={'role': 'professional'})
    regular = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments_as_regular', limit_choices_to={'role': 'regular'})
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)  # Hacer opcional para citas de 1 hora
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    service = models.CharField(max_length=200, blank=True)  # Agregar campo para el servicio
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    total_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    class Meta:
        ordering = ['-date', '-start_time']

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


class Review(models.Model):
    professional = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received', limit_choices_to={'role': 'professional'})
    regular = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given', limit_choices_to={'role': 'regular'})
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['appointment', 'regular']

    def __str__(self):
        return f"Review de {self.regular.name} para {self.professional.name}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('appointment_created', 'Turno Creado'),
        ('appointment_confirmed', 'Turno Confirmado'),
        ('appointment_cancelled', 'Turno Cancelado'),
        ('appointment_reminder', 'Recordatorio de Turno'),
        ('new_review', 'Nueva Reseña'),
        ('message_received', 'Nuevo Mensaje'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name}: {self.title}"
