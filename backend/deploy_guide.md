# 🚀 Guía de Despliegue - Backend Django

## 📋 Preparación del Proyecto

### 1. Variables de Entorno
Crear archivo `.env` en la raíz del backend:
```bash
# Configuración de desarrollo
DEBUG=True
SECRET_KEY=tu-clave-secreta-aqui
DB_NAME=turnify_db
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=5432

# Para producción (se configuran en la plataforma)
# DATABASE_URL=postgres://user:pass@host:port/dbname
# DEBUG=False
```

### 2. Comandos de Preparación
```bash
cd backend
python manage.py collectstatic --noinput
python manage.py migrate
```

## 🌐 Opciones de Despliegue

### **Opción 1: Heroku (Recomendada)**

#### Pasos:
1. **Instalar Heroku CLI**
   ```bash
   # Windows
   winget install --id=Heroku.HerokuCLI
   ```

2. **Login y crear app**
   ```bash
   heroku login
   heroku create tu-app-turnify
   ```

3. **Configurar variables de entorno**
   ```bash
   heroku config:set DEBUG=False
   heroku config:set SECRET_KEY=tu-clave-secreta-produccion
   ```

4. **Agregar base de datos PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Desplegar**
   ```bash
   git add .
   git commit -m "Preparar para despliegue"
   git push heroku main
   ```

6. **Ejecutar migraciones**
   ```bash
   heroku run python manage.py migrate
   heroku run python manage.py createsuperuser
   ```

### **Opción 2: Railway**

#### Pasos:
1. **Conectar GitHub a Railway**
2. **Configurar variables de entorno en Railway dashboard**
3. **Railway detecta automáticamente Django y lo despliega**

### **Opción 3: Render**

#### Pasos:
1. **Conectar repositorio GitHub**
2. **Configurar como servicio web**
3. **Agregar base de datos PostgreSQL**
4. **Configurar variables de entorno**

### **Opción 4: DigitalOcean App Platform**

#### Pasos:
1. **Conectar GitHub**
2. **Seleccionar rama y directorio**
3. **Configurar variables de entorno**
4. **Agregar base de datos**

## 🔧 Configuración del Frontend

### Actualizar URL del API
En `frontend/turnify/constants/Config.ts`:
```typescript
// Cambiar de:
export const API_BASE_URL = 'http://192.168.1.XXX:8000';

// A:
export const API_BASE_URL = 'https://tu-app.herokuapp.com';
// o
export const API_BASE_URL = 'https://tu-app.railway.app';
```

## 📱 Despliegue del Frontend

### **Expo Application Services (EAS)**
```bash
cd frontend/turnify
npm install -g @expo/cli
eas login
eas build:configure
eas build --platform all
```

### **Alternativa: Build local**
```bash
expo build:android
expo build:ios
```

## 🔍 Verificación

### Backend:
- ✅ API responde en `/api/`
- ✅ Migraciones ejecutadas
- ✅ Variables de entorno configuradas
- ✅ CORS configurado correctamente

### Frontend:
- ✅ App conecta al backend desplegado
- ✅ Autenticación funciona
- ✅ Todas las funcionalidades operativas

## 🛠️ Comandos Útiles

```bash
# Ver logs de Heroku
heroku logs --tail

# Ejecutar comando en Heroku
heroku run python manage.py shell

# Reiniciar app
heroku restart

# Ver variables de entorno
heroku config
```

## 🚨 Troubleshooting

### Error: "No module named 'dj_database_url'"
```bash
pip install dj-database-url
```

### Error: "Static files not found"
```bash
python manage.py collectstatic --noinput
```

### Error: "Database connection failed"
- Verificar variables de entorno
- Verificar que la base de datos esté activa

### Error: "CORS policy"
- Actualizar `CORS_ALLOWED_ORIGINS` en settings.py
- Verificar que la URL del frontend esté incluida 