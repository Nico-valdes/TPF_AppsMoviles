from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User, ProfessionalDetail, Schedule
import random

class Command(BaseCommand):
    help = 'Carga horarios para todos los profesionales existentes'

    def handle(self, *args, **options):
        # Verificar que existan profesionales
        professionals = User.objects.filter(role='professional')
        
        if not professionals.exists():
            self.stdout.write(
                self.style.ERROR('❌ No hay profesionales en la base de datos. Primero crea algunos profesionales.')
            )
            return

        self.stdout.write(f"👥 Encontrados {professionals.count()} profesionales")
        
        # Definir diferentes tipos de horarios para asignar aleatoriamente
        schedule_templates = [
            # Horario médico típico
            {
                'name': 'Horario Médico',
                'schedules': [
                    {'day_week': 0, 'start_time': '08:00', 'end_time': '17:00', 'name': 'Lunes'},
                    {'day_week': 1, 'start_time': '08:00', 'end_time': '17:00', 'name': 'Martes'},
                    {'day_week': 2, 'start_time': '08:00', 'end_time': '17:00', 'name': 'Miércoles'},
                    {'day_week': 3, 'start_time': '08:00', 'end_time': '17:00', 'name': 'Jueves'},
                    {'day_week': 4, 'start_time': '08:00', 'end_time': '17:00', 'name': 'Viernes'},
                    {'day_week': 5, 'start_time': '09:00', 'end_time': '13:00', 'name': 'Sábado'},
                ]
            },
            # Horario de oficina
            {
                'name': 'Horario de Oficina',
                'schedules': [
                    {'day_week': 0, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Lunes'},
                    {'day_week': 1, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Martes'},
                    {'day_week': 2, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Miércoles'},
                    {'day_week': 3, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Jueves'},
                    {'day_week': 4, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Viernes'},
                    {'day_week': 5, 'start_time': '10:00', 'end_time': '14:00', 'name': 'Sábado'},
                ]
            },
            # Horario de clases
            {
                'name': 'Horario de Clases',
                'schedules': [
                    {'day_week': 0, 'start_time': '14:00', 'end_time': '21:00', 'name': 'Lunes'},
                    {'day_week': 1, 'start_time': '14:00', 'end_time': '21:00', 'name': 'Martes'},
                    {'day_week': 2, 'start_time': '14:00', 'end_time': '21:00', 'name': 'Miércoles'},
                    {'day_week': 3, 'start_time': '14:00', 'end_time': '21:00', 'name': 'Jueves'},
                    {'day_week': 4, 'start_time': '14:00', 'end_time': '21:00', 'name': 'Viernes'},
                    {'day_week': 5, 'start_time': '09:00', 'end_time': '17:00', 'name': 'Sábado'},
                ]
            },
            # Horario de belleza
            {
                'name': 'Horario de Belleza',
                'schedules': [
                    {'day_week': 0, 'start_time': '10:00', 'end_time': '19:00', 'name': 'Lunes'},
                    {'day_week': 1, 'start_time': '10:00', 'end_time': '19:00', 'name': 'Martes'},
                    {'day_week': 2, 'start_time': '10:00', 'end_time': '19:00', 'name': 'Miércoles'},
                    {'day_week': 3, 'start_time': '10:00', 'end_time': '19:00', 'name': 'Jueves'},
                    {'day_week': 4, 'start_time': '10:00', 'end_time': '19:00', 'name': 'Viernes'},
                    {'day_week': 5, 'start_time': '10:00', 'end_time': '16:00', 'name': 'Sábado'},
                ]
            },
            # Horario flexible
            {
                'name': 'Horario Flexible',
                'schedules': [
                    {'day_week': 0, 'start_time': '06:00', 'end_time': '22:00', 'name': 'Lunes'},
                    {'day_week': 1, 'start_time': '06:00', 'end_time': '22:00', 'name': 'Martes'},
                    {'day_week': 2, 'start_time': '06:00', 'end_time': '22:00', 'name': 'Miércoles'},
                    {'day_week': 3, 'start_time': '06:00', 'end_time': '22:00', 'name': 'Jueves'},
                    {'day_week': 4, 'start_time': '06:00', 'end_time': '22:00', 'name': 'Viernes'},
                    {'day_week': 5, 'start_time': '07:00', 'end_time': '18:00', 'name': 'Sábado'},
                    {'day_week': 6, 'start_time': '08:00', 'end_time': '14:00', 'name': 'Domingo'},
                ]
            },
            # Horario de consultoría
            {
                'name': 'Horario de Consultoría',
                'schedules': [
                    {'day_week': 0, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Lunes'},
                    {'day_week': 1, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Martes'},
                    {'day_week': 2, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Miércoles'},
                    {'day_week': 3, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Jueves'},
                    {'day_week': 4, 'start_time': '09:00', 'end_time': '18:00', 'name': 'Viernes'},
                    {'day_week': 5, 'start_time': '10:00', 'end_time': '14:00', 'name': 'Sábado'},
                ]
            }
        ]

        schedules_created = 0
        schedules_updated = 0

        for professional in professionals:
            self.stdout.write(f"\n👤 Procesando: {professional.name}")
            
            # Asignar un horario aleatorio a cada profesional
            selected_template = random.choice(schedule_templates)
            self.stdout.write(f"  📅 Asignando: {selected_template['name']}")
            
            for schedule_info in selected_template['schedules']:
                from datetime import time
                
                # Convertir strings de tiempo a objetos time
                start_time = time.fromisoformat(schedule_info['start_time'])
                end_time = time.fromisoformat(schedule_info['end_time'])
                
                schedule, created = Schedule.objects.get_or_create(
                    professional=professional,
                    day_week=schedule_info['day_week'],
                    defaults={
                        'start_time': start_time,
                        'end_time': end_time
                    }
                )
                
                if created:
                    schedules_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✅ {schedule_info['name']}: {start_time} - {end_time}")
                    )
                else:
                    # Actualizar horario existente
                    schedule.start_time = start_time
                    schedule.end_time = end_time
                    schedule.save()
                    schedules_updated += 1
                    self.stdout.write(
                        self.style.WARNING(f"  🔄 {schedule_info['name']}: {start_time} - {end_time} (actualizado)")
                    )

        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Resumen:")
        )
        self.stdout.write(
            self.style.SUCCESS(f"  ✅ Horarios creados: {schedules_created}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"  🔄 Horarios actualizados: {schedules_updated}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Horarios cargados exitosamente!")
        ) 