# Configuración de Railway para Audio en Chat

## Variables de Entorno Requeridas

Para que la funcionalidad de audio funcione correctamente en Railway, necesitas configurar estas variables de entorno:

### Variables de Base de Datos (Supabase)
```
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu-password-de-supabase
DB_HOST=tu-proyecto.supabase.co
DB_PORT=5432
```

### Variables de Supabase Storage
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-public-key
```

### Variables de Django
```
SECRET_KEY=tu-secret-key-de-django
DEBUG=False
ALLOWED_HOSTS=.railway.app
```

## Cómo Configurar en Railway

1. **Ve a tu proyecto en Railway**
2. **Selecciona tu servicio de backend**
3. **Ve a la pestaña "Variables"**
4. **Agrega cada variable:**

### Paso 1: Obtener Credenciales de Supabase
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_KEY`
   - **Database password** → `DB_PASSWORD`
   - **Database host** → `DB_HOST`

### Paso 2: Configurar en Railway
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DB_HOST=db.tu-proyecto.supabase.co
DB_PASSWORD=tu-password
```

## Verificar Configuración

Después de configurar las variables:

1. **Reinicia el servicio** en Railway
2. **Verifica los logs** para asegurarte de que no hay errores
3. **Prueba la funcionalidad** de audio en la app

## Troubleshooting

### Error: "SUPABASE_URL not found"
- Verifica que `SUPABASE_URL` esté configurada correctamente
- Asegúrate de que incluya `https://`

### Error: "Invalid credentials"
- Verifica que `SUPABASE_KEY` sea la **anon public key**, no la service role key
- Asegúrate de que no tenga espacios extra

### Error: "Bucket not found"
- Verifica que el bucket `chat-audios` exista en Supabase Storage
- Crea el bucket manualmente si es necesario

## Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Reiniciar servicio
3. ✅ Probar funcionalidad de audio
4. ✅ Verificar logs de Railway 