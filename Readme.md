# Documentación de la API - OtpWebBack

Este documento proporciona detalles sobre los endpoints de la API para la aplicación OtpWebBack.

## URL Base
Todos los endpoints están prefijados con `/api`.

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
| `GET`    | `/`       | Obtener todos los releases.  |
| `GET`    | `/:id`    | Obtener un release por ID.   |
| `POST`   | `/`       | Crear un nuevo release.      |
| `PATCH`  | `/:id`    | Actualizar un release por ID.|
| `DELETE` | `/:id`    | Eliminar un release por ID.  |

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
  "video": "URL del video (opcional)",
  "releaseType": "Song", // Options: "Song", "Album", "EP", "Videoclip"
  "date": "2025-07-16T00:00:00.000Z",
  "userId": "user123"
}
```

### Artists

**Ruta Base**: `/api/artists`

| Método | Ruta      | Descripción                 |
|--------|-----------|-----------------------------|
| `GET`    | `/`       | Obtener todos los artistas. |
| `GET`    | `/:id`    | Obtener un artista por ID.  |
| `POST`   | `/`       | Crear un nuevo artista.     |
| `PATCH`  | `/:id`    | Actualizar un artista por ID.|
| `DELETE` | `/:id`    | Eliminar un artista por ID. |

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
  "artistType": "Producer", // Options: "Producer", "Singer", "Filmmaker", "Developer"
  "userId": "user123"
}
```

### Events

**Ruta Base**: `/api/events`

| Método | Ruta      | Descripción                |
|--------|-----------|----------------------------|
| `GET`    | `/`       | Obtener todos los eventos. |
| `GET`    | `/:id`    | Obtener un evento por ID.  |
| `POST`   | `/`       | Crear un nuevo evento.     |
| `PATCH`  | `/:id`    | Actualizar un evento por ID. |
| `DELETE` | `/:id`    | Eliminar un evento por ID. |

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
  "eventType": "Concert", // Options: "Concert", "Festival", "Showcase", "Party"
  "date": "2025-07-16T00:00:00.000Z",
  "userId": "user123"
}
```

### Studios

**Ruta Base**: `/api/studios`

| Método | Ruta      | Descripción                 |
|--------|-----------|-----------------------------|
| `GET`    | `/`       | Obtener todos los estudios. |
| `GET`    | `/:id`    | Obtener un estudio por ID.  |
| `POST`   | `/`       | Crear un nuevo estudio.     |
| `PATCH`  | `/:id`    | Actualizar un estudio por ID. |
| `DELETE` | `/:id`    | Eliminar un estudio por ID. |

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
  "studioType": "Recording", // Options: "Recording", "Mixing", "Mastering", "Post-Production", "Live"
  "userId": "user123"
}
```