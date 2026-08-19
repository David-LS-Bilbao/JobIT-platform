# Spec: Auth (M01)

## Objetivo

Permitir que un candidato se registre, inicie sesión y cierre sesión de forma segura. Proteger las rutas que requieren identidad verificada. Garantizar que las contraseñas nunca se almacenen en texto plano y que toda validación crítica ocurra en el servidor.

## Usuario afectado

Candidato tech que necesita una cuenta para acceder a su perfil, ofertas guardadas, match y dashboard.

## Flujo principal

### Registro

1. El candidato accede a la pantalla de registro.
2. Introduce email y contraseña.
3. El sistema valida formato y requisitos mínimos de contraseña en el servidor.
4. Si el email ya existe, devuelve error genérico que no confirme ni descarte su existencia (prevención de enumeración de usuarios).
5. Si los datos son válidos, crea el usuario con contraseña hasheada.
6. El candidato queda autenticado y se le redirige al dashboard o al formulario de perfil inicial.

### Login

1. El candidato accede a la pantalla de login.
2. Introduce email y contraseña.
3. El servidor verifica credenciales.
4. Si son correctas, crea sesión o emite token según implementación futura.
5. El candidato accede a su zona privada.

### Logout

1. El candidato cierra sesión.
2. El servidor revoca el refresh token en DB (campo revokedAt no nulo) y elimina la cookie del cliente.
3. El candidato queda sin acceso a rutas privadas.

### Protección de ruta privada

1. El candidato intenta acceder a una ruta privada sin sesión activa.
2. El servidor devuelve 401 Unauthorized.
3. Tras login correcto, puede redirigir de vuelta al destino original.

## Flujos alternativos

- Email inválido: error de validación visible en pantalla, sin llamada al servidor si la validación frontend lo detecta antes.
- Contraseña demasiado débil: error descriptivo que indica requisitos mínimos.
- Email ya registrado: error genérico que no confirme ni descarte la existencia del email (prevención de enumeración de usuarios).
- Credenciales incorrectas en login: error genérico sin revelar si el email existe.
- Sesión expirada: redirigir al login con mensaje informativo.

## Estrategia de sesión

- **Access token**: JWT firmado, válido 15 minutos, payload `{ sub: userId }`.
- **Refresh token**: token de alta entropía, válido 7 días, almacenado como hash en DB (nunca en texto plano).
- **Transporte**: refresh token en cookie HttpOnly, SameSite=Lax; Secure únicamente en producción.
- **Hashing de contraseñas**: bcryptjs, factor de coste 12.
- **Referencia**: ADR-0006 (decisiones de sesión y tokens).

## Modelo de datos conceptual

### User

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| email | string | Único, normalizado a minúsculas |
| passwordHash | string | Hash seguro (bcrypt o argon2 futuro) |
| createdAt | datetime | Automático |
| updatedAt | datetime | Automático |
| role | enum | `CANDIDATE` por defecto en MVP |

No se almacena la contraseña en texto plano. El campo `role` prepara la futura distinción entre candidato, recruiter y admin sin implementarla todavía.

### RefreshToken

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Clave primaria |
| userId | UUID | Clave foránea a User |
| tokenHash | string | Hash del token (nunca texto plano) |
| expiresAt | datetime | Expiración del token |
| revokedAt | datetime\|null | Nulo hasta revocación explícita |
| createdAt | datetime | Automático |

## Endpoints previstos

| Método | Ruta | Descripción |
|---|---|---|
| POST | /auth/register | Registro de nuevo candidato |
| POST | /auth/login | Login con email y contraseña |
| POST | /auth/logout | Cierre de sesión |
| POST | /auth/refresh | Renovación del access token mediante la cookie `refresh_token`. Especificado en [`session-continuity-401-recovery.md`](session-continuity-401-recovery.md) |
| GET | /auth/me | Datos del usuario autenticado (ruta privada) |

Todos los endpoints de mutación validan en el servidor. El frontend no es fuente de verdad para validaciones de seguridad.

## Pantallas previstas

- **Registro**: formulario con email, contraseña y confirmación de contraseña. Enlace a login.
- **Login**: formulario con email y contraseña. Enlace a registro y a recuperación futura.
- **Ruta protegida genérica**: redirección al login si no hay sesión.
- **Estado de carga**: indicador visible durante llamadas de auth.
- **Estado de error**: mensajes claros, sin revelar información sensible.

## Reglas de negocio

- Un email solo puede tener una cuenta activa.
- El email se normaliza a minúsculas antes de almacenar.
- Las contraseñas se hashean antes de persistir. Nunca en texto plano.
- El servidor valida siempre. La validación de frontend es solo UX.
- Las sesiones/tokens tienen caducidad. No son indefinidos.
- El logout invalida la sesión en el servidor, no solo en el cliente.
- Los errores de autenticación no revelan si el email existe (prevención de enumeración).
- El userId se extrae siempre del access token verificado en el servidor. Nunca se acepta del body ni de la query de la petición.

## Validaciones

| Campo | Regla |
|---|---|
| email | Formato de email válido, requerido, normalizado a minúsculas |
| contraseña | Mínimo 8 caracteres, al menos una mayúscula y un número |
| confirmación | Igual a contraseña (validación UX en frontend, también en backend) |

## Errores

| Situación | Mensaje orientativo | Notas |
|---|---|---|
| Email ya registrado | "No ha sido posible completar el registro" | No confirmar ni descartar la existencia |
| Credenciales incorrectas | "Email o contraseña incorrectos" | Mensaje genérico |
| Email inválido | "Introduce un email válido" | Puede validarse en frontend |
| Contraseña débil | "La contraseña no cumple los requisitos mínimos" | Con indicación de requisitos |
| Sesión expirada | "Tu sesión ha caducado. Inicia sesión de nuevo" | |
| Error de servidor | "Ha ocurrido un error. Inténtalo más tarde" | Sin exponer detalles técnicos |

## Seguridad mínima

- Contraseñas hasheadas con función de coste adaptable (bcrypt o argon2 a definir en ADR).
- Rate limiting en endpoints de login y registro para prevenir fuerza bruta. Diferido: no entra en criterios de aceptación ni tests de Sprint 01.
- No exponer en errores si un email existe o no.
- Tokens/sesiones con tiempo de expiración.
- HTTPS obligatorio en producción.
- No almacenar contraseñas, tokens en logs ni en respuestas de API.
- Validación siempre en el servidor.

## Criterios de aceptación

- [x] Un candidato puede registrarse con email y contraseña válidos.
- [x] Un candidato no puede registrarse con un email ya existente.
- [x] Un candidato puede iniciar sesión con credenciales correctas.
- [x] Un candidato no puede iniciar sesión con credenciales incorrectas.
- [x] El logout revoca el refresh token en DB (revokedAt no nulo) y elimina la cookie del cliente.
- [x] Una ruta privada devuelve 401 Unauthorized si no hay token válido.
- [x] Las contraseñas se almacenan hasheadas.
- [x] Los errores no revelan existencia de emails.
- [x] Un candidato no puede registrarse con una contraseña que no cumpla los requisitos mínimos de seguridad (mínimo 8 caracteres, al menos una mayúscula y un número).

## Tests mínimos

- Registro con datos válidos → usuario creado, sesión iniciada.
- Registro con email ya existente → error sin confirmar existencia.
- Registro con contraseña débil → error con indicación de requisitos.
- Login con credenciales correctas → sesión activa.
- Login con contraseña incorrecta → error genérico.
- Login con email inexistente → error genérico (mismo mensaje que contraseña incorrecta).
- Logout → refresh token revocado en DB (campo revokedAt no nulo) y cookie eliminada del cliente.
- Acceso a ruta privada sin token → 401 Unauthorized.
- Verificar que la contraseña almacenada es un hash, no texto plano.

## Fuera de alcance

- OAuth (Google, GitHub, LinkedIn).
- MFA (autenticación multifactor).
- Recuperación de contraseña por email.
- Gestión de sesiones múltiples.
- Bloqueo de cuenta por intentos fallidos.
- Panel de administración de usuarios.
- Roles recruiter o empresa.

## Auditoría requerida

- [ ] Quality/security documental.
- [ ] Tests y verificaciones locales.
- [ ] Revisión humana.
