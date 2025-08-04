from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User, ProfessionalDetail

class Command(BaseCommand):
    help = 'Crea profesionales de ejemplo'

    def handle(self, *args, **options):
        professionals_data = [
            {
                'email': 'dr.martinez@turnify.com',
                'name': 'Dr. Carlos Martínez',
                'phone': '+54 11 1234-5678',
                'category': 'health',
                'address': 'Av. Corrientes 1234, CABA',
                'description': 'Médico especialista en medicina general con 10 años de experiencia.',
                'hourly_rate': 15000.00
            },
            {
                'email': 'dra.lopez@turnify.com', 
                'name': 'Dra. María López',
                'phone': '+54 11 2345-6789',
                'category': 'health',
                'address': 'Santa Fe 2345, CABA',
                'description': 'Dermatóloga especializada en tratamientos estéticos y médicos.',
                'hourly_rate': 18000.00
            },
            {
                'email': 'lic.garcia@turnify.com',
                'name': 'Lic. Ana García',
                'phone': '+54 11 3456-7890',
                'category': 'health',
                'address': 'Palermo 3456, CABA',
                'description': 'Psicóloga clínica especializada en terapia cognitivo-conductual.',
                'hourly_rate': 12000.00
            },
            {
                'email': 'dr.rodriguez@turnify.com',
                'name': 'Dr. Luis Rodríguez',
                'phone': '+54 11 4567-8901',
                'category': 'health',
                'address': 'Belgrano 4567, CABA',
                'description': 'Cardiólogo con 15 años de experiencia en diagnóstico y tratamiento.',
                'hourly_rate': 25000.00
            },
            {
                'email': 'lic.fernandez@turnify.com',
                'name': 'Lic. Sofia Fernández',
                'phone': '+54 11 5678-9012',
                'category': 'health',
                'address': 'Villa Crespo 5678, CABA',
                'description': 'Nutricionista especializada en planes alimentarios personalizados.',
                'hourly_rate': 10000.00
            }
        ]

        created_count = 0
        updated_count = 0

        for prof_data in professionals_data:
            user, created = User.objects.get_or_create(
                email=prof_data['email'],
                defaults={
                    'name': prof_data['name'],
                    'role': 'professional',
                    'password': make_password('password123'),
                    'is_active': True
                }
            )
            
            if created:
                # Crear detalle profesional
                ProfessionalDetail.objects.create(
                    professional=user,
                    category=prof_data['category'],
                    address=prof_data['address'],
                    phone=prof_data['phone'],
                    description=prof_data['description'],
                    hourly_rate=prof_data['hourly_rate'],
                    is_verified=True  # Los profesionales de ejemplo están verificados
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Profesional creado: {prof_data["name"]} - ${prof_data["hourly_rate"]}/hora')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⚠️ Ya existe: {prof_data["name"]}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Resumen:')
        )
        self.stdout.write(
            self.style.SUCCESS(f'  ✅ Profesionales creados: {created_count}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'  🔄 Profesionales existentes: {updated_count}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'\n🏥 ¡Profesionales listos para usar!')
        )
