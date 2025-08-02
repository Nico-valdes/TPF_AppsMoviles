from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User, ProfessionalDetail

class Command(BaseCommand):
    help = 'Carga datos de ejemplo de profesionales'

    def handle(self, *args, **options):
        # Crear profesionales de ejemplo
        professionals_data = [
            {
                'name': 'Dr. María González',
                'email': 'maria.gonzalez@example.com',
                'role': 'professional',
                'category': 'health',
                'address': 'Av. Corrientes 1234, Buenos Aires',
                'description': 'Médica clínica con más de 10 años de experiencia. Especializada en medicina general y atención primaria.',
                'hourly_rate': 5000.00,
                'phone': '+54 11 1234-5678',
                'is_verified': True,
                'rating': 4.8,
                'total_reviews': 45
            },
            {
                'name': 'Lic. Carlos Rodríguez',
                'email': 'carlos.rodriguez@example.com',
                'role': 'professional',
                'category': 'legal',
                'address': 'Florida 567, Buenos Aires',
                'description': 'Abogado especializado en derecho laboral y comercial. Consultas y asesoramiento legal.',
                'hourly_rate': 8000.00,
                'phone': '+54 11 2345-6789',
                'is_verified': True,
                'rating': 4.9,
                'total_reviews': 32
            },
            {
                'name': 'Prof. Ana Martínez',
                'email': 'ana.martinez@example.com',
                'role': 'professional',
                'category': 'education',
                'address': 'Belgrano 890, Buenos Aires',
                'description': 'Profesora de inglés con certificación internacional. Clases particulares y grupales.',
                'hourly_rate': 3000.00,
                'phone': '+54 11 3456-7890',
                'is_verified': True,
                'rating': 4.7,
                'total_reviews': 28
            },
            {
                'name': 'Dra. Laura Fernández',
                'email': 'laura.fernandez@example.com',
                'role': 'professional',
                'category': 'beauty',
                'address': 'Palermo 456, Buenos Aires',
                'description': 'Dermatóloga especializada en tratamientos estéticos y cuidado de la piel.',
                'hourly_rate': 6000.00,
                'phone': '+54 11 4567-8901',
                'is_verified': True,
                'rating': 4.6,
                'total_reviews': 38
            },
            {
                'name': 'Lic. Roberto Silva',
                'email': 'roberto.silva@example.com',
                'role': 'professional',
                'category': 'consulting',
                'address': 'Microcentro 234, Buenos Aires',
                'description': 'Consultor en marketing digital y estrategias de negocio. Ayudo a empresas a crecer online.',
                'hourly_rate': 7000.00,
                'phone': '+54 11 5678-9012',
                'is_verified': True,
                'rating': 4.5,
                'total_reviews': 25
            },
            {
                'name': 'Prof. Diego Morales',
                'email': 'diego.morales@example.com',
                'role': 'professional',
                'category': 'fitness',
                'address': 'Villa Crespo 789, Buenos Aires',
                'description': 'Entrenador personal certificado. Programas de fitness y nutrición personalizados.',
                'hourly_rate': 4000.00,
                'phone': '+54 11 6789-0123',
                'is_verified': True,
                'rating': 4.8,
                'total_reviews': 42
            }
        ]

        for data in professionals_data:
            # Crear usuario
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'name': data['name'],
                    'password': make_password('password123'),
                    'role': data['role']
                }
            )
            
            if created:
                # Crear detalle profesional
                ProfessionalDetail.objects.create(
                    professional=user,
                    category=data['category'],
                    address=data['address'],
                    description=data['description'],
                    hourly_rate=data['hourly_rate'],
                    phone=data['phone'],
                    is_verified=data['is_verified'],
                    rating=data['rating'],
                    total_reviews=data['total_reviews']
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Profesional creado: {data["name"]}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Profesional ya existe: {data["name"]}')
                )

        self.stdout.write(
            self.style.SUCCESS('Datos de ejemplo cargados exitosamente')
        ) 