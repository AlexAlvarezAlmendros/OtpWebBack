# Documentación de la API - OtpWebBack

Este documento proporciona detalles sobre los endpoints de la API para la aplicación OtpWebBack.

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
  "userId": "user123"
}
```

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