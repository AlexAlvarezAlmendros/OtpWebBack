# Plan de Implementación Backend - Integración Spotify API

## Instrucciones para el Agente IA

Este documento contiene el plan detallado para implementar la integración con Spotify API en el backend. Cada tarea está diseñada para ser implementada de forma secuencial. 

**Cómo proceder:**
1. Lee todo el documento antes de empezar
2. Implementa las tareas en orden (las dependencias están indicadas)
3. Marca cada checkbox cuando completes una tarea
4. Ejecuta los tests indicados antes de marcar como completada
5. Si encuentras bloqueos, documéntalos en los comentarios del código

**Contexto del proyecto:**
- Backend: Node.js + Express
- Base de datos: MongoDB con Mongoose
- Autenticación actual: Auth0
- La integración debe permitir importar datos de artistas y releases desde Spotify

---

## 📋 Tareas de Implementación

### 1. Configuración Inicial y Setup

#### [ ] 1.1 Configurar Variables de Entorno
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 15 min  
**Dependencias:** Ninguna

- [ ] Añadir a `.env`:
  ```env
  SPOTIFY_CLIENT_ID=
  SPOTIFY_CLIENT_SECRET=
  SPOTIFY_API_BASE_URL=https://api.spotify.com/v1
  SPOTIFY_TOKEN_URL=https://accounts.spotify.com/api/token
  ```
- [ ] Actualizar `.env.example` con las nuevas variables
- [ ] Documentar en README.md cómo obtener credenciales de Spotify

**Verificación:** Las variables deben estar accesibles via `process.env`

#### [ ] 1.2 Instalar Dependencias
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 5 min  
**Dependencias:** 1.1

- [ ] Ejecutar: `npm install axios node-cache`
- [ ] Verificar en `package.json` que se añadieron las dependencias

**Verificación:** `npm list axios node-cache` debe mostrar las versiones instaladas

---

### 2. Implementación del Servicio Spotify

#### [ ] 2.1 Crear Estructura de Archivos
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 10 min  
**Dependencias:** 1.2

- [ ] Crear directorio `services/` si no existe
- [ ] Crear archivo `services/spotifyService.js`
- [ ] Crear archivo `services/__tests__/spotifyService.test.js`

#### [ ] 2.2 Implementar Clase SpotifyService - Autenticación
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 45 min  
**Dependencias:** 2.1

Implementar en `services/spotifyService.js`:

- [ ] Constructor con configuración inicial
- [ ] Método `getAccessToken()` con:
  - [ ] Cache de token en memoria
  - [ ] Renovación automática cuando expire
  - [ ] Manejo de errores de autenticación
- [ ] Tests unitarios para autenticación

**Código base:**
```javascript
class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.tokenUrl = process.env.SPOTIFY_TOKEN_URL;
    this.apiBaseUrl = process.env.SPOTIFY_API_BASE_URL;
    this.accessToken = null;
    this.tokenExpiry = null;
  }
  
  async getAccessToken() {
    // Implementar lógica de obtención y cache de token
  }
}
```

**Verificación:** Test debe pasar: `npm test services/__tests__/spotifyService.test.js`

#### [ ] 2.3 Implementar Extracción de IDs de URLs
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 30 min  
**Dependencias:** 2.2

- [ ] Método `extractIdFromUrl(spotifyUrl)` que soporte:
  - [ ] URLs de artistas: `https://open.spotify.com/artist/{id}`
  - [ ] URLs de álbumes: `https://open.spotify.com/album/{id}`
  - [ ] URLs de tracks: `https://open.spotify.com/track/{id}`
  - [ ] URLs con parámetros adicionales
- [ ] Tests para cada tipo de URL

**Verificación:** Debe extraer correctamente IDs de al menos 5 URLs diferentes

#### [ ] 2.4 Implementar Obtención de Datos de Artista
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 45 min  
**Dependencias:** 2.3

- [ ] Método `getArtistData(artistId)` que retorne:
  ```javascript
  {
    name: string,
    genres: string[],
    images: array,
    popularity: number,
    spotifyUrl: string,
    followers: number
  }
  ```
- [ ] Manejo de errores (artista no encontrado, error de red)
- [ ] Tests con mocks de respuesta

#### [ ] 2.5 Implementar Obtención de Datos de Release
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 45 min  
**Dependencias:** 2.3

- [ ] Método `getReleaseData(albumId)` que retorne:
  ```javascript
  {
    name: string,
    artists: string[],
    releaseDate: string,
    totalTracks: number,
    images: array,
    spotifyUrl: string,
    type: string // album, single, compilation
  }
  ```
- [ ] Soporte para singles y álbumes
- [ ] Tests con mocks de respuesta

#### [ ] 2.6 Implementar Sistema de Cache
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 30 min  
**Dependencias:** 2.4, 2.5

- [ ] Usar `node-cache` para cachear respuestas
- [ ] TTL de 1 hora para datos de artistas/releases
- [ ] Método para limpiar cache manualmente
- [ ] Tests de funcionamiento del cache

---

### 3. Implementación de Rutas API

#### [ ] 3.1 Crear Archivo de Rutas
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 15 min  
**Dependencias:** 2.6

- [ ] Crear `routes/spotifyRoutes.js`
- [ ] Configurar router Express básico
- [ ] Añadir middleware de validación

#### [ ] 3.2 Implementar Endpoint de Importación de Artista
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 45 min  
**Dependencias:** 3.1

- [ ] POST `/api/spotify/artist-info`
- [ ] Validación de entrada:
  - [ ] URL requerida
  - [ ] Formato de URL válido
- [ ] Mapeo de datos Spotify a modelo interno:
  ```javascript
  {
    name: string,
    genre: string, // genres.join(', ')
    img: string,   // primera imagen de alta calidad
    spotifyLink: string,
    // Campos vacíos para otros links
  }
  ```
- [ ] Respuesta con status 200 y datos mapeados
- [ ] Manejo de errores con mensajes descriptivos

#### [ ] 3.3 Implementar Endpoint de Importación de Release
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 45 min  
**Dependencias:** 3.1

- [ ] POST `/api/spotify/release-info`
- [ ] Validación similar a artistas
- [ ] Mapeo de tipos de Spotify a tipos internos:
  - [ ] 'album' → 'Album'
  - [ ] 'single' → 'Song'
  - [ ] 'compilation' → 'Album'
- [ ] Conversión de fecha a formato ISO
- [ ] Tests de integración

#### [ ] 3.4 Registrar Rutas en index.js
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 10 min  
**Dependencias:** 3.2, 3.3

- [ ] Importar spotifyRoutes en `index.js`
- [ ] Añadir: `app.use('/api/spotify', spotifyRoutes);`
- [ ] Verificar que las rutas están accesibles

---

### 4. Seguridad y Optimización

#### [ ] 4.1 Implementar Rate Limiting
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 30 min  
**Dependencias:** 3.4

- [ ] Límite de 10 requests por minuto por IP
- [ ] Mensaje de error claro cuando se exceda
- [ ] Tests de rate limiting

#### [ ] 4.2 Validación y Sanitización
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 30 min  
**Dependencias:** 3.4

- [ ] Validar formato de URLs antes de procesarlas
- [ ] Sanitizar respuestas de Spotify
- [ ] Prevenir inyección de código en campos de texto

#### [ ] 4.3 Logging y Monitoreo
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 20 min  
**Dependencias:** 4.2

- [ ] Log de cada request a Spotify API
- [ ] Log de errores con contexto
- [ ] Métricas de uso (requests exitosos vs fallidos)

---

### 5. Testing y Documentación

#### [ ] 5.1 Tests de Integración Completos
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 60 min  
**Dependencias:** 4.3

- [ ] Test E2E de importación de artista
- [ ] Test E2E de importación de release
- [ ] Tests de casos edge (URLs inválidas, servicios caídos)
- [ ] Coverage mínimo del 80%

#### [ ] 5.2 Documentación de API
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 30 min  
**Dependencias:** 5.1

- [ ] Actualizar README.md con nuevos endpoints
- [ ] Ejemplos de uso con cURL
- [ ] Documentar códigos de error posibles
- [ ] Añadir a la colección de Postman si existe

---

## 📊 Métricas de Éxito

- [ ] Todos los tests pasan
- [ ] Coverage de código > 80%
- [ ] Tiempo de respuesta < 2 segundos para importaciones
- [ ] 0 vulnerabilidades de seguridad detectadas
- [ ] Documentación completa y actualizada

## 🚨 Consideraciones Importantes

1. **Rate Limits de Spotify:** La API tiene límites, implementar backoff exponencial
2. **Tokens:** Los tokens expiran en 1 hora, el sistema debe renovarlos automáticamente
3. **Datos faltantes:** No todos los artistas tienen todos los campos, manejar gracefully
4. **CORS:** Asegurarse de que el frontend pueda acceder a los endpoints

## 📝 Notas de Implementación

- Priorizar el manejo de errores descriptivo
- Cada error debe incluir un código único para debugging
- Los logs deben ser estructurados (considera usar winston o pino)
- Considera implementar webhooks para notificar al frontend cuando una importación termine