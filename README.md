# ICLUD · Metabuscador de alojamientos (Next.js)

Next.js junta frontend y backend en **un solo proyecto y un solo comando**:

```
Navegador (React)  →  POST /metabuscar  →  SerpApi / Google Hotels  →  Navegador
```

Solo los usuarios y sus favoritos se guardan en base de datos (Prisma + SQLite).

## Cómo ponerlo en marcha

Necesitás Node.js 20.9 o superior (`node -v`) y una clave de [SerpApi](https://serpapi.com/manage-api-key) para consultar Google Hotels.

```bash
npm install
```

Copiá `.env.example` como `.env` (en la raíz del proyecto):

- Windows (CMD): `copy .env.example .env`
- Mac / Linux: `cp .env.example .env`

Completá `SERPAPI_API_KEY` y `JWT_SECRET`. Para generar el `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Después:

```bash
npm run db:init     # crea la base de datos (una sola vez)
npm run dev         # abre http://localhost:3000
```

Otros comandos: `npm test` (pruebas), `npm run build` y `npm start` (versión de producción).

## Estructura

```
├── prisma/schema.prisma        DER: Usuario 1—N Favorito
├── test/                       pruebas automáticas
└── src/
    ├── app/
    │   ├── layout.js, page.js, globals.css
    │   ├── metabuscar/route.js         POST /metabuscar (único endpoint de búsqueda)
    │   └── api/
    │       ├── auth/ (registro, login, logout, yo)
    │       └── favoritos/ (GET, POST, DELETE /[id])
    ├── components/             Buscador, FormularioBusqueda, Tarjeta, DialogoAuth
    ├── servicios/
    │   └── serpapi.js          búsqueda Google Hotels, precios en USD y enlaces de oferta
    └── lib/
        ├── metabuscar.js       orquesta: validar → Google Hotels + tarifa consultada
        ├── validar.js          validación de entrada (RNF-04)
        ├── limitador.js        límite de búsquedas por IP
        ├── auth.js, db.js, http.js, cliente.js
```

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| "No pudimos completar la búsqueda" | Mirá la terminal: la línea `Fallo en /metabuscar: ...` dice el motivo |
| Error de SerpApi | Verificá `SERPAPI_API_KEY`, el estado de tu cuenta y el límite de búsquedas |
| `@prisma/client did not initialize yet` | Corré `npx prisma generate` |
| Falta configurar `SERPAPI_API_KEY` | Creá una clave en SerpApi, completá esa variable en `.env` y reiniciá `npm run dev`. |
| Cambiaste el `.env` y no se nota | Reiniciá `npm run dev` |

## Decisiones para defender en la evaluación

- **Tarifas**: las búsquedas de Google Hotels se realizan con fechas específicas y se descartan propiedades sin tarifa por noche comprobable.
- **Moneda**: se solicita USD a SerpApi/Google Hotels y se descartan resultados sin precio numérico.
- **Enlaces**: se usa el enlace del proveedor cuando está presente; si no, se abre Google Hotels con el alojamiento, fechas y huéspedes de la búsqueda.
- **Credenciales**: `SERPAPI_API_KEY` permanece solo en el servidor, dentro de `.env`.
- **Validación**: destino ≤ 80 caracteres, huéspedes de 1 a 20, precio positivo, fechas obligatorias y estadías de hasta 90 noches.
- **Caché**: se solicitan resultados frescos (`no_cache=true`, además de `cache: 'no-store'`); hay un límite de 10 por minuto por IP.
- **Servicios**: se muestran solo si la lista de comodidades de Google Hotels confirma los servicios solicitados.
