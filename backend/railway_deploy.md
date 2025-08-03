# 🚀 Despliegue con Railway + Supabase

## 🎯 **¿Por qué Railway + Supabase?**

✅ **Railway**: Gratis, fácil, automático  
✅ **Supabase**: Ya tienes la BD configurada  
✅ **Integración perfecta**: Sin configuración adicional  
✅ **Escalable**: Puedes crecer cuando necesites  

## 📋 **Paso a Paso**

### **1. Preparar el Proyecto**

```bash
cd backend
# Instalar dependencias de producción
pip install dj-database-url
```

### **2. Configurar Variables de Entorno**

Crear archivo `.env` en `backend/`:
```bash
# Desarrollo local
DEBUG=True
SECRET_KEY=tu-clave-secreta-desarrollo
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu-password-supabase
DB_HOST=db.tu-proyecto.supabase.co
DB_PORT=5432

# Para Railway (se configuran en Railway dashboard)
# DEBUG=False
# SECRET_KEY=tu-clave-secreta-produccion
# DATABASE_URL=postgresql://postgres:password@host:port/dbname
```

### **3. Obtener URL de Supabase**

1. **Ir a Supabase Dashboard**
2. **Seleccionar tu proyecto**
3. **Settings → Database**
4. **Copiar la "Connection string"**

### **4. Desplegar en Railway**

#### **Opción A: Desde GitHub (Recomendada)**

1. **Subir código a GitHub**
   ```bash
   git add .
   git commit -m "Preparar para Railway"
   git push origin main
   ```

2. **Conectar Railway a GitHub**
   - Ir a [railway.app](https://railway.app)
   - Crear cuenta
   - "Deploy from GitHub repo"
   - Seleccionar tu repositorio
   - **IMPORTANTE**: En la configuración de despliegue:
     - **Root Directory**: `backend`
     - **Branch**: `main`

3. **Configurar Variables de Entorno en Railway**
   - En Railway dashboard, ir a "Variables"
   - Agregar:
     ```
     DEBUG=False
     SECRET_KEY=tu-clave-secreta-produccion
     DATABASE_URL=postgresql://postgres:password@host:port/dbname
     ```

4. **Railway detecta Django automáticamente** y lo despliega

#### **Opción B: Desde Railway CLI**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto (desde la raíz del proyecto)
railway init

# Configurar directorio backend
railway link --project tu-proyecto-id

# Desplegar
railway up
```

### **5. Configuración Específica para Backend**

Railway detectará automáticamente que es un proyecto Django y usará:
- `requirements.txt` para dependencias
- `manage.py` para comandos
- `railway.json` para configuración específica
- `nixpacks.toml` para configuración de build

### **6. Ejecutar Migraciones**

```bash
# En Railway dashboard → "Deployments" → "View Logs"
# O usar Railway CLI:
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

### **7. Verificar Despliegue**

- Railway te da una URL como: `https://tu-app.railway.app`
- Probar: `https://tu-app.railway.app/api/`

## 🔧 **Configuración del Frontend**

### **Actualizar Config.ts**

```typescript
// En frontend/turnify/constants/Config.ts
export const API_BASE_URL = 'https://tu-app.railway.app';
```

## 💰 **Costos**

### **Railway (Gratis)**
- ✅ 500 horas/mes gratis
- ✅ 1GB RAM
- ✅ 1GB almacenamiento
- ✅ Despliegue automático

### **Supabase (Gratis)**
- ✅ 500MB base de datos
- ✅ 2GB transferencia
- ✅ 50,000 filas
- ✅ Autenticación incluida

## 🚨 **Troubleshooting**

### **Error: "No start command could be found"**
**Solución:**
1. Verificar que `manage.py` esté en la raíz de la carpeta `backend`
2. Verificar que `requirements.txt` esté en la raíz de la carpeta `backend`
3. Verificar que `railway.json` y `nixpacks.toml` estén configurados correctamente
4. En Railway dashboard, asegurar que **Root Directory** esté configurado como `backend`

### **Error: "Database connection failed"**
- Verificar `DATABASE_URL` en Railway
- Asegurar que Supabase esté activo
- Verificar credenciales de Supabase

### **Error: "CORS policy"**
- Verificar que la URL de Railway esté en `CORS_ALLOWED_ORIGINS`
- Actualizar configuración en `settings.py`

### **Error: "Static files not found"**
```bash
railway run python manage.py collectstatic --noinput
```

### **Error: "No module named 'dj_database_url'"**
```bash
# Verificar que esté en requirements.txt
pip install dj-database-url
```

## 🎉 **Ventajas de Railway + Supabase**

1. **Simplicidad**: Railway detecta Django automáticamente
2. **Gratis**: Ambos tienen planes gratuitos generosos
3. **Escalable**: Puedes actualizar cuando crezcas
4. **Integración**: Supabase + Railway funcionan perfectamente juntos
5. **Despliegue automático**: Cada push a GitHub despliega automáticamente

## 📱 **Después del Backend**

Una vez que tengas el backend en Railway:

1. **Actualizar frontend** con la nueva URL
2. **Probar conexión** desde la app móvil
3. **Desplegar frontend** con Expo EAS
4. **¡Listo!** Tu app funciona independientemente de tu PC 