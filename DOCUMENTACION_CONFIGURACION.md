# 📱 Configuración App Móvil + Backend Django

## 🚨 **Problema**
App funcionaba solo en emulador porque usaba `127.0.0.1:8000` (localhost). El celular no puede acceder a localhost de la PC.

## ✅ **Solución**

### **1. Identificar IP Local**
```bash
ipconfig
# Buscar tu IP en la red Wi-Fi (ej: 192.168.1.XXX)
```

### **2. Configurar Frontend**
**Archivo**: `frontend/turnify/constants/Config.ts`
```typescript
export const API_BASE_URL = 'http://192.168.1.XXX:8000'; // Reemplazar XXX
```

**Actualizar todos los archivos** que usan fetch para importar `API_BASE_URL`.

### **3. Configurar Backend**
**Archivo**: `backend/backend/settings.py`
```python
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '192.168.1.XXX'] # Reemplazar XXX
```

## 🚀 **Comandos**

### **Backend**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### **Frontend**
```bash
cd frontend/turnify
npx expo start
```

## 📱 **Uso**
1. PC y celular en la misma red Wi-Fi
2. Escanear QR con Expo Go
3. ¡Listo! App conecta al backend

## 🛠️ **Si Cambia la IP**
- Actualizar `Config.ts` (API_BASE_URL)
- Actualizar `settings.py` (ALLOWED_HOSTS)
