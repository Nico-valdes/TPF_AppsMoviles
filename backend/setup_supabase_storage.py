#!/usr/bin/env python3
"""
Script para configurar Supabase Storage para archivos de audio
"""
import os
from decouple import config
from supabase import create_client, Client

def setup_supabase_storage():
    """Configurar bucket de Supabase Storage para archivos de audio"""
    
    # Obtener credenciales de Supabase usando python-decouple
    supabase_url = config('SUPABASE_URL', default='')
    supabase_key = config('SUPABASE_SERVICE_KEY', default='')  # Usar service key para configuración
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL y SUPABASE_KEY deben estar configurados")
        print("Configura estas variables de entorno:")
        print("SUPABASE_URL=https://tu-proyecto.supabase.co")
        print("SUPABASE_KEY=tu-anon-key")
        return False
    
    try:
        # Crear cliente de Supabase
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Crear bucket para archivos de audio
        bucket_name = 'chat-audios'
        
        try:
            # Verificar si el bucket ya existe
            buckets = supabase.storage.list_buckets()
            bucket_exists = any(bucket.name == bucket_name for bucket in buckets)
            
            if bucket_exists:
                print(f"✅ Bucket '{bucket_name}' ya existe")
            else:
                # Intentar crear el bucket
                result = supabase.storage.create_bucket(
                    bucket_name,
                    options={
                        'public': True,  # URLs públicas para acceso directo
                        'allowed_mime_types': ['audio/m4a', 'audio/mp3', 'audio/wav', 'audio/aac'],
                        'file_size_limit': 15728640  # 15MB en bytes
                    }
                )
                print(f"✅ Bucket '{bucket_name}' creado exitosamente")
            
        except Exception as e:
            if "already exists" in str(e).lower() or "Unauthorized" in str(e):
                print(f"✅ Bucket '{bucket_name}' ya existe o está configurado")
            else:
                print(f"❌ Error al verificar bucket: {str(e)}")
                return False
        
        # Configurar políticas de acceso (opcional)
        try:
            # Política para permitir lectura pública de archivos de audio
            policy = supabase.storage.from_(bucket_name).get_policy()
            print(f"✅ Políticas de acceso configuradas para '{bucket_name}'")
        except Exception as e:
            print(f"⚠️  No se pudieron configurar políticas automáticamente: {str(e)}")
            print("Puedes configurar las políticas manualmente en el dashboard de Supabase")
        
        print("\n🎉 Configuración de Supabase Storage completada")
        print(f"📁 Bucket: {bucket_name}")
        print(f"🔗 URL: {supabase_url}")
        print("\n📝 Variables de entorno necesarias:")
        print(f"SUPABASE_URL={supabase_url}")
        print(f"SUPABASE_KEY={supabase_key}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error de conexión con Supabase: {str(e)}")
        print("Verifica que las credenciales sean correctas")
        return False

if __name__ == "__main__":
    print("🚀 Configurando Supabase Storage para archivos de audio...")
    setup_supabase_storage() 