# Documentación de la API - OtpWebBack

Este documento proporciona detalles sobre los endpoints de la API para la aplicación OtpWebBack.

## Configuración

### Variables de Entorno

Copia `.env.example` a `.env` y configura las siguientes variables:

#### Configuración de Base de Datos
- `MONGO_URI`: URI de conexión a MongoDB
- `PORT`: Puerto del servidor (por defecto 5001)

#### Configuración de Auth0
- `AUTH0_DOMAIN`: Dominio de tu aplicación Auth0
- `AUTH0_AUDIENCE`: Identificador de audiencia de la API
- `AUTH0_CLIENT_ID`: ID del cliente Auth0
- `AUTH0_CLIENT_SECRET`: Secret del cliente Auth0

#### Configuración de Spotify API
Para habilitar la integración con Spotify y el autocompletado de artistas:

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
3. Obtén el Client ID y Client Secret
4. Configura las siguientes variables:
   - `SPOTIFY_CLIENT_ID`: Client ID de tu aplicación Spotify
   - `SPOTIFY_CLIENT_SECRET`: Client Secret de tu aplicación Spotify
   - `SPOTIFY_API_BASE_URL`: https://api.spotify.com/v1 (ya configurado)
   - `SPOTIFY_TOKEN_URL`: https://accounts.spotify.com/api/token (ya configurado)

#### Configuración de Stripe (Sistema de Tickets)
Para habilitar el sistema de venta de entradas con Stripe:

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén tus claves API desde el Dashboard
3. Configura las siguientes variables:
   - `STRIPE_SECRET_KEY`: Secret key de Stripe (sk_test_...)
   - `STRIPE_PUBLISHABLE_KEY`: Publishable key de Stripe (pk_test_...)
   - `STRIPE_WEBHOOK_SECRET`: Secret del webhook (whsec_...)

📖 **Para más detalles sobre el sistema de tickets, consulta [TICKETS_SYSTEM.md](./TICKETS_SYSTEM.md)**

#### Configuración de Email
Para el envío de tickets y confirmaciones por email:
   - `GMAIL_USER`: Tu email de Gmail
   - `GMAIL_APP_PASSWORD`: Contraseña de aplicación de Gmail
   - `EMAIL_FROM_NAME`: Nombre del remitente (opcional)
   - `EMAIL_FROM_ADDRESS`: Email del remitente (opcional)

### Instalación

```bash
npm install
node index.js
```

## URL Base
Todos los endpoints están prefijados con `/api`.

---

## Sistema de Filtros y Paginación

Todos los endpoints GET de recursos (`/api/releases`, `/api/artists`, `/api/events`, `/api/studios`) soportan un sistema completo de filtros y paginación a través de parámetros de consulta (query parameters).

### Filtros Comunes (Disponibles para todos los recursos)

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `count` | Number | Número de elementos por página (máximo 100, por defecto 10) | `?count=20` |
| `page` | Number | Número de página (por defecto 1) | `?page=2` |
| `dateMin` | Date | Fecha mínima (formato ISO 8601) | `?dateMin=2024-01-01` |
| `dateMax` | Date | Fecha máxima (formato ISO 8601) | `?dateMax=2024-12-31` |
| `type` | String | Filtrar por tipo específico del recurso | `?type=Song` |
| `userId` | String | Filtrar por ID de usuario | `?userId=user123` |
| `sortBy` | String | Campo por el cual ordenar | `?sortBy=createdAt` |
| `sortOrder` | String | Orden de clasificación: `asc` o `desc` (por defecto `desc`) | `?sortOrder=asc` |

### Filtros Específicos por Recurso

#### Releases
- `subtitle`: Filtro por subtítulo (búsqueda parcial, insensible a mayúsculas)

#### Artists  
- `genre`: Filtro por género (búsqueda parcial, insensible a mayúsculas)

#### Events
- `location`: Filtro por ubicación (búsqueda parcial, insensible a mayúsculas)

#### Studios
- `location`: Filtro por ubicación (búsqueda parcial, insensible a mayúsculas)

### Ejemplos de Uso de Filtros

```bash
# Obtener los primeros 20 releases de tipo "Song"
GET /api/releases?count=20&type=Song

# Obtener events en Madrid, página 2
GET /api/events?location=madrid&page=2

# Obtener artists de género "Pop" creados en 2024
GET /api/artists?genre=pop&dateMin=2024-01-01&dateMax=2024-12-31

# Obtener releases del usuario específico ordenados por fecha ascendente
GET /api/releases?userId=user123&sortBy=date&sortOrder=asc

# Combinar múltiples filtros
GET /api/releases?type=Album&dateMin=2024-06-01&count=50&subtitle=deluxe
```

### Formato de Respuesta con Filtros

Cuando se usan filtros, la respuesta incluye metadatos de paginación:

```json
{
  "data": [
    // ... array de recursos
  ],
  "pagination": {
    "page": 1,
    "count": 10,
    "total": 45,
    "pages": 5
  },
  "filters": {
    "type": "Song",
    "dateMin": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Recursos

La API proporciona operaciones CRUD estándar para los siguientes recursos:

- Releases
- Artists  
- Events
- Studios
- **Tickets** (Sistema de venta de entradas con Stripe)

---

## Sistema de Tickets 🎫

La API incluye un sistema completo de venta de entradas para eventos con integración de Stripe Checkout.

### Endpoints de Tickets

**Ruta Base**: `/api/tickets`

| Método | Ruta                          | Auth   | Descripción                                    |
|--------|-------------------------------|--------|------------------------------------------------|
| POST   | `/create-checkout-session`    | No     | Crear sesión de pago con Stripe                |
| POST   | `/webhook`                    | No*    | Webhook de Stripe (verificado por firma)       |
| GET    | `/verify/:ticketCode`         | No     | Verificar validez de un ticket                 |
| POST   | `/validate/:ticketCode`       | Admin  | Marcar ticket como usado                       |
| GET    | `/my-tickets`                 | User   | Obtener tickets del usuario                    |
| GET    | `/event/:eventId/sales`       | Admin  | Estadísticas de ventas del evento              |

*El webhook está protegido por verificación de firma de Stripe

### Ejemplo: Crear Sesión de Checkout

```bash
POST /api/tickets/create-checkout-session
Content-Type: application/json

{
  "eventId": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "customerEmail": "usuario@ejemplo.com",
  "customerName": "Juan Pérez"
}
```

📖 **Para documentación completa del sistema de tickets, consulta [TICKETS_SYSTEM.md](./TICKETS_SYSTEM.md)**

---

## Integración con Spotify API

La API incluye endpoints especiales para importar datos desde Spotify y autocompletar formularios.

### Spotify Import Endpoints

**Ruta Base**: `/api/spotify`

| Método | Ruta           | Descripción                                    |
|--------|----------------|------------------------------------------------|
| POST   | `/artist-info` | Importar datos de artista desde Spotify       |
| POST   | `/release-info`| Importar datos de release/álbum desde Spotify |

#### Importar Artista desde Spotify

**POST** `/api/spotify/artist-info`

Importa información de un artista desde Spotify utilizando su URL.

**Cuerpo de la Petición:**
```json
{
  "url": "https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "name": "Adele",
    "genre": "pop, soul, british soul",
    "img": "https://i.scdn.co/image/ab6761610000e5eb68f6e4db3fc6490c263d9f1e",
    "spotifyLink": "https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY",
    "instagramLink": "",
    "twitterLink": "",
    "youtubeLink": "",
    "facebookLink": "",
    "websiteLink": ""
  },
  "source": "spotify"
}
```

#### Importar Release desde Spotify

**POST** `/api/spotify/release-info`

Importa información de un álbum o single desde Spotify utilizando su URL.

**Cuerpo de la Petición:**
```json
{
  "url": "https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "title": "25",
    "subtitle": "",
    "artist": "Adele",
    "date": "2015-11-20T00:00:00.000Z",
    "type": "Album",
    "img": "https://i.scdn.co/image/ab67616d0000b273c33c9b88565486b0b5134b6e",
    "spotifyLink": "https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo",
    "appleMusicLink": "",
    "youtubeMusicLink": "",
    "amazonMusicLink": "",
    "deezerLink": "",
    "soundcloudLink": ""
  },
  "source": "spotify",
  "metadata": {
    "totalTracks": 11,
    "originalType": "album"
  }
}
```

#### Códigos de Error Spotify API

| Código | Error | Descripción |
|--------|-------|-------------|
| `400` | `URL_REQUIRED` | La URL de Spotify es obligatoria |
| `400` | `INVALID_URL_FORMAT` | La URL debe ser una cadena de texto |
| `400` | `INVALID_DOMAIN` | La URL debe ser de spotify.com |
| `400` | `INVALID_SPOTIFY_URL` | Formato de URL de Spotify inválido |
| `400` | `INVALID_URL_TYPE` | La URL debe ser del tipo correcto (artista/álbum) |
| `400` | `URL_TOO_LONG` | La URL es demasiado larga |
| `401` | `SPOTIFY_AUTH_ERROR` | Error de autenticación con Spotify |
| `404` | `ARTIST_NOT_FOUND` | Artista no encontrado en Spotify |
| `404` | `RELEASE_NOT_FOUND` | Release no encontrado en Spotify |
| `429` | `RATE_LIMIT_EXCEEDED` | Demasiadas solicitudes (máx 10/min) |
| `500` | `SPOTIFY_API_ERROR` | Error interno de la API de Spotify |

#### Ejemplos de Uso con cURL

```bash
# Importar artista
curl -X POST https://tu-api.com/api/spotify/artist-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY"}'

# Importar álbum
curl -X POST https://tu-api.com/api/spotify/release-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo"}'
```

#### Limitaciones y Consideraciones

- **Rate Limiting**: Máximo 10 requests por minuto por IP
- **Cache**: Los datos se almacenan en cache durante 1 hora
- **Tipos de URL soportados**: Solo URLs de artistas y álbumes de Spotify
- **Autenticación**: Requiere credenciales de Spotify configuradas en el servidor
- **Mapeo de Tipos**: Singles se mapean como "Song", álbumes y compilaciones como "Album"

---

### Releases

**Ruta Base**: `/api/releases`

| Método | Ruta      | Descripción                  |
|--------|-----------|------------------------------|
| `GET`    | `/`       | Obtener todos los releases (con filtros). |
| `GET`    | `/:id`    | Obtener un release por ID.   |
| `POST`   | `/`       | Crear un nuevo release.      |
| `PATCH`  | `/:id`    | Actualizar un release por ID.|
| `DELETE` | `/:id`    | Eliminar un release por ID.  |

#### Tipos Válidos para Releases
- `Song`
- `Album`  
- `EP`
- `Videoclip`

#### Estructura JSON para Releases

**POST/PATCH Body:**
```json
{
  "title": "Nombre del release",
  "subtitle": "Subtítulo (opcional)",
  "spotifyLink": "https://spotify.com/... (opcional)",
  "youtubeLink": "https://youtube.com/... (opcional)",
  "appleMusicLink": "https://music.apple.com/... (opcional)",
  "instagramLink": "https://instagram.com/... (opcional)",
  "soundCloudLink": "https://soundcloud.com/... (opcional)",
  "beatStarsLink": "https://beatstars.com/... (opcional)",
  "img": "URL de la imagen (requerido)",
  "releaseType": "Song",
  "date": "2025-07-16T00:00:00.000Z",
  "userId": "user123"
}
```

### Artists

**Ruta Base**: `/api/artists`

| Método | Ruta      | Descripción                 |
|--------|-----------|-----------------------------|
| `GET`    | `/`       | Obtener todos los artistas (con filtros). |
| `GET`    | `/:id`    | Obtener un artista por ID.  |
| `POST`   | `/`       | Crear un nuevo artista.     |
| `PATCH`  | `/:id`    | Actualizar un artista por ID.|
| `DELETE` | `/:id`    | Eliminar un artista por ID. |

#### Tipos Válidos para Artists
- `Producer`
- `Singer`
- `Filmmaker`
- `Developer`

#### Estructura JSON para Artists

**POST/PATCH Body:**
```json
{
  "name": "Nombre del artista",
  "genre": "Género musical",
  "spotifyLink": "https://spotify.com/... (opcional)",
  "youtubeLink": "https://youtube.com/... (opcional)",
  "appleMusicLink": "https://music.apple.com/... (opcional)",
  "instagramLink": "https://instagram.com/... (opcional)",
  "soundCloudLink": "https://soundcloud.com/... (opcional)",
  "beatStarsLink": "https://beatstars.com/... (opcional)",
  "img": "URL de la imagen (requerido)",
  "profileUrl": "URL del perfil (opcional)",
  "artistType": "Producer",
  "userId": "user123"
}
```

### Events

**Ruta Base**: `/api/events`

| Método | Ruta      | Descripción                |
|--------|-----------|----------------------------|
| `GET`    | `/`       | Obtener todos los eventos (con filtros). |
| `GET`    | `/:id`    | Obtener un evento por ID.  |
| `POST`   | `/`       | Crear un nuevo evento.     |
| `PATCH`  | `/:id`    | Actualizar un evento por ID. |
| `DELETE` | `/:id`    | Eliminar un evento por ID. |

#### Tipos Válidos para Events
- `Concert`
- `Festival`
- `Showcase`
- `Party`

#### Estructura JSON para Events

**POST/PATCH Body:**
```json
{
  "name": "Nombre del evento",
  "location": "Ubicación del evento",
  "colaborators": "Colaboradores (opcional)",
  "youtubeLink": "https://youtube.com/... (opcional)",
  "instagramLink": "https://instagram.com/... (opcional)",
  "img": "URL de la imagen (requerido)",
  "detailpageUrl": "URL de la página de detalles (opcional)",
  "eventType": "Concert",
  "date": "2025-07-16T00:00:00.000Z",
  "userId": "user123",
  
  "ticketsEnabled": false,
  "ticketPrice": 15.00,
  "totalTickets": 100,
  "availableTickets": 100,
  "ticketsSold": 0,
  "ticketCurrency": "EUR",
  "saleStartDate": "2025-01-15T00:00:00.000Z",
  "saleEndDate": "2025-02-15T23:59:59.000Z"
}
```

**Nota**: Los campos de tickets son opcionales. Si no se proporcionan, el evento no tendrá venta de entradas habilitada.

### Studios

**Ruta Base**: `/api/studios`

| Método | Ruta      | Descripción                 |
|--------|-----------|-----------------------------|
| `GET`    | `/`       | Obtener todos los estudios (con filtros). |
| `GET`    | `/:id`    | Obtener un estudio por ID.  |
| `POST`   | `/`       | Crear un nuevo estudio.     |
| `PATCH`  | `/:id`    | Actualizar un estudio por ID. |
| `DELETE` | `/:id`    | Eliminar un estudio por ID. |

#### Tipos Válidos para Studios
- `Recording`
- `Mixing`
- `Mastering`
- `Post-Production`
- `Live`

#### Estructura JSON para Studios

**POST/PATCH Body:**
```json
{
  "name": "Nombre del estudio",
  "location": "Ubicación del estudio",
  "colaborators": "Colaboradores (opcional)",
  "youtubeLink": "https://youtube.com/... (opcional)",
  "instagramLink": "https://instagram.com/... (opcional)",
  "img": "URL de la imagen (requerido)",
  "detailpageUrl": "URL de la página de detalles (opcional)",
  "studioType": "Recording",
  "userId": "user123"
}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado exitosamente |
| `400` | Bad Request - Parámetros inválidos o datos malformados |
| `401` | Unauthorized - Token de autenticación requerido o inválido |
| `403` | Forbidden - Sin permisos para realizar la acción |
| `404` | Not Found - Recurso no encontrado |
| `500` | Internal Server Error - Error del servidor |

---

## Autenticación

Todos los endpoints excepto GET requieren autenticación mediante JWT token en el header:

```
Authorization: Bearer <your-jwt-token>
```

## Notas Importantes

1. **Paginación**: Siempre usa los parámetros `count` y `page` para manejar grandes conjuntos de datos.
2. **Filtros de Texto**: Los filtros como `subtitle`, `genre`, y `location` son insensibles a mayúsculas y permiten búsquedas parciales.
3. **Fechas**: Usa formato ISO 8601 para todas las fechas (`YYYY-MM-DDTHH:mm:ss.sssZ`).
4. **Límites**: El parámetro `count` está limitado a un máximo de 100 elementos por solicitud.
5. **Campos Requeridos**: Los campos marcados como "requerido" deben incluirse en las solicitudes POST.