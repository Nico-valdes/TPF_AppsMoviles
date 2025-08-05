#!/usr/bin/env python3
"""
Script para probar la configuración de CORS
"""
import os
import sys
import django
from pathlib import Path

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from django.http import HttpResponse
from corsheaders.middleware import CorsMiddleware
from django.middleware.common import CommonMiddleware

def test_cors_headers():
    """Probar que los headers de CORS se envían correctamente"""
    
    print("🧪 Probando configuración de CORS...")
    
    # Crear una request de prueba
    factory = RequestFactory()
    request = factory.post('/api/chat/3/send-audio/')
    request.META['HTTP_ORIGIN'] = 'http://localhost:8081'
    request.META['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] = 'POST'
    request.META['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] = 'content-type,authorization'
    
    # Aplicar middleware de CORS
    cors_middleware = CorsMiddleware(lambda req: HttpResponse())
    common_middleware = CommonMiddleware(lambda req: HttpResponse())
    
    # Procesar la request
    response = cors_middleware(request)
    
    print("📋 Headers de respuesta:")
    for header, value in response.items():
        if 'access-control' in header.lower():
            print(f"  {header}: {value}")
    
    # Verificar headers específicos
    cors_headers = {
        'Access-Control-Allow-Origin': response.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.get('Access-Control-Allow-Credentials'),
    }
    
    print("\n✅ Headers de CORS encontrados:")
    for header, value in cors_headers.items():
        if value:
            print(f"  ✅ {header}: {value}")
        else:
            print(f"  ❌ {header}: No encontrado")
    
    return True

if __name__ == "__main__":
    test_cors_headers() 