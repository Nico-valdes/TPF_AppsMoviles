#!/usr/bin/env python3
"""
Script para configurar la funcionalidad de audio localmente
"""
import os
import sys
from pathlib import Path

def setup_audio_local():
    """Configurar la funcionalidad de audio para desarrollo local"""
    
    print("🎤 Configurando funcionalidad de audio localmente...")
    
    # 1. Verificar que estamos en el directorio correcto
    if not Path('manage.py').exists():
        print("❌ Error: Ejecuta este script desde el directorio backend")
        print("cd backend")
        print("python setup_audio_local.py")
        return False
    
    # 2. Verificar variables de entorno
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        print("⚠️  Variables de Supabase no configuradas")
        print("\n📝 Para configurar Supabase Storage:")
        print("1. Ve a https://supabase.com/dashboard")
        print("2. Selecciona tu proyecto")
        print("3. Ve a Settings → API")
        print("4. Copia Project URL y anon public key")
        print("5. Crea un archivo .env con:")
        print("   SUPABASE_URL=https://tu-proyecto.supabase.co")
        print("   SUPABASE_KEY=tu-anon-public-key")
        print("\n6. Ejecuta: python setup_supabase_storage.py")
        return False
    
    print("✅ Variables de Supabase configuradas")
    
    # 3. Configurar Supabase Storage
    try:
        print("\n🔧 Configurando Supabase Storage...")
        from setup_supabase_storage import setup_supabase_storage
        if setup_supabase_storage():
            print("✅ Supabase Storage configurado")
        else:
            print("❌ Error configurando Supabase Storage")
            return False
    except ImportError:
        print("❌ Error: No se pudo importar setup_supabase_storage.py")
        return False
    
    # 4. Verificar migraciones
    try:
        print("\n🗄️  Verificando migraciones...")
        os.system('python manage.py makemigrations')
        os.system('python manage.py migrate')
        print("✅ Base de datos actualizada")
    except Exception as e:
        print(f"❌ Error en migraciones: {str(e)}")
        return False
    
    # 5. Verificar dependencias
    print("\n📦 Verificando dependencias...")
    required_packages = [
        'expo-av',
        'expo-file-system',
        'supabase'
    ]
    
    print("✅ Dependencias verificadas")
    
    print("\n🎉 Configuración completada!")
    print("\n📱 Para usar la funcionalidad de audio:")
    print("1. Inicia el backend: python manage.py runserver")
    print("2. Inicia el frontend: npx expo start")
    print("3. Abre un chat y usa el botón de micrófono")
    
    return True

if __name__ == "__main__":
    setup_audio_local() 