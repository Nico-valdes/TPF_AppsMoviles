# Configuración de Supabase Storage para Audio

## ¿Qué es Supabase Storage?

Supabase Storage es un servicio de almacenamiento de archivos integrado con tu base de datos Supabase. Permite almacenar y servir archivos de forma segura sin necesidad de servicios de terceros adicionales.

## Ventajas sobre otros servicios:

✅ **Integrado**: No necesitas configurar AWS S3 o Cloudinary por separado  
✅ **Seguridad**: Políticas de acceso integradas con tu autenticación  
✅ **Simplicidad**: Una sola plataforma para base de datos y archivos  
✅ **Sin costos adicionales**: Incluido en tu plan de Supabase  

## Configuración Paso a Paso

### 1. Obtener Credenciales de Supabase

Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard) y:

1. Selecciona tu proyecto
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** (ej: `https://xyz.supabase.co`)
   - **anon public** key

### 2. Configurar Variables de Entorno

En tu archivo `.env` o en Railway:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-public-key
```

### 3. Crear Bucket de Storage

Ejecuta el script de configuración:

```bash
cd backend
python setup_supabase_storage.py
```

O manualmente en el Dashboard de Supabase:

1. Ve a **Storage** en el sidebar
2. Crea un nuevo bucket llamado `chat-audios`
3. Configura como **Public**
4. Establece límites:
   - **File size limit**: 15MB
   - **Allowed MIME types**: `audio/m4a`, `audio/mp3`, `audio/wav`, `audio/aac`

### 4. Configurar Políticas de Acceso (Opcional)

En el Dashboard de Supabase → Storage → Policies:

```sql
-- Política para permitir lectura pública de archivos de audio
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-audios');

-- Política para permitir subida de archivos autenticados
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-audios' 
  AND auth.role() = 'authenticated'
);
```

## Uso en el Código

El código ya está configurado para usar Supabase Storage:

```python
# En views.py - SendAudioMessageView
supabase: Client = create_client(supabase_url, supabase_key)

# Subir archivo
upload_result = supabase.storage.from_('chat-audios').upload(
    path=file_name,
    file=audio_file.read(),
    file_options={"content-type": audio_file.content_type}
)

# Obtener URL pública
audio_url = supabase.storage.from_('chat-audios').get_public_url(file_name)
```

## Estructura de Archivos

```
chat-audios/
├── audio_1_123_1703123456.m4a
├── audio_1_456_1703123457.mp3
└── audio_2_789_1703123458.wav
```

## Límites y Consideraciones

- **Tamaño máximo**: 15MB por archivo
- **Tipos permitidos**: m4a, mp3, wav, aac
- **URLs públicas**: Los archivos son accesibles públicamente
- **Organización**: Archivos organizados por `audio_{room_id}_{user_id}_{timestamp}.{extension}`

## Troubleshooting

### Error: "Bucket not found"
- Verifica que el bucket `chat-audios` existe en Supabase
- Ejecuta `python setup_supabase_storage.py`

### Error: "Invalid credentials"
- Verifica `SUPABASE_URL` y `SUPABASE_KEY` en variables de entorno
- Usa la **anon public key**, no la service role key

### Error: "File too large"
- Verifica que el archivo no exceda 15MB
- Ajusta el límite en el bucket si es necesario

## Comparación con Otros Servicios

| Servicio | Configuración | Costo | Integración |
|----------|---------------|-------|-------------|
| **Supabase Storage** | ✅ Simple | ✅ Incluido | ✅ Perfecta |
| AWS S3 | ❌ Compleja | 💰 Adicional | ⚠️ Separada |
| Cloudinary | ⚠️ Media | 💰 Adicional | ⚠️ Separada |

## Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Ejecutar script de configuración
3. ✅ Probar subida de archivos
4. 🔄 Implementar frontend para grabación de audio
5. 🔄 Agregar reproducción de audio en el chat 