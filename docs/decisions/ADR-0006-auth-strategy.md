# ADR-0006: Estrategia de autenticación

## Estado

Aceptada.

## Contexto

La spec funcional de auth (M01) define: registro, login, logout, rutas privadas, contraseñas hasheadas, validación server-side y errores genéricos que no revelan si un email existe. Establece también que las sesiones o tokens tienen caducidad, que el logout invalida la sesión en el servidor y que el frontend no es fuente de verdad para autorización.

El backend es Express (ADR-0005). El frontend previsto es Next.js (ADR-0002). El despliegue será en VPS con Nginx (ADR-0002). Frontend Next.js y API Express serán aplicaciones separadas. La topología final de dominios y orígenes se definirá en el Sprint 00 técnico y en el sprint de despliegue; no se asume aquí si correrán en el mismo origen, subdominios distintos u orígenes completamente separados.

El MVP es candidate-first. La estrategia de auth debe ser segura desde el inicio, sin complejidad prematura, y debe permitir logout real desde el servidor.

## Decisión

**Enfoque híbrido: JWT access token de vida corta + refresh token persistente en cookie HttpOnly.**

- **Access token**: JWT firmado, vida corta (15 minutos orientativo). Se gestiona en memoria del cliente o mediante una capa server-side de Next.js si se adopta ese patrón. Se envía en cada petición autenticada mediante cabecera `Authorization: Bearer`. No se almacena en localStorage ni en sessionStorage.
- **Refresh token**: token opaco o JWT de vida larga, almacenado en cookie HttpOnly y Secure en producción. El atributo SameSite se definirá en Sprint 00 según la topología final de dominios: preferiblemente same-site mediante reverse proxy Nginx; si hubiera cross-site real, se usará SameSite=None con mitigación CSRF explícita. Permite emitir nuevos access tokens sin que el candidato vuelva a introducir sus credenciales.
- **Almacenamiento del refresh token en servidor**: se persiste en base de datos (hasheado), asociado al usuario. Esto permite revocación explícita en logout, rotación y expiración controlada.
- **Logout**: invalida el refresh token en la base de datos y elimina la cookie del cliente. El logout es real y efectivo en el servidor, no solo en el cliente.

**Reglas no negociables:**

- Las contraseñas se hashean con bcrypt o argon2 antes de persistirse. Nunca en texto plano.
- Los tokens no se almacenan en localStorage ni en sessionStorage.
- Las rutas privadas se protegen en backend mediante middleware de verificación de token. El frontend puede redirigir al login, pero la protección real es siempre del lado del servidor.
- El frontend no es fuente confiable de autorización.
- Los errores de login/registro no revelan si un email existe en el sistema.

No se implementa nada en esta fase. Esta decisión orienta el Sprint 00 técnico.

## Consecuencias positivas

- **Logout real**: el refresh token persiste en DB, por lo que el servidor puede revocarlo de forma efectiva. A diferencia de un JWT puro stateless, el logout no depende solo de la expiración del token.
- **Superficie de ataque reducida**: access token de vida corta limita el daño en caso de filtración. El refresh token en cookie HttpOnly no es accesible desde JavaScript.
- **Sin localStorage**: elimina el riesgo de robo de tokens por XSS en el cliente.
- **Revocación y rotación**: el almacenamiento del refresh token en DB permite revocar sesiones individuales, implementar rotación (nuevo refresh token en cada uso) y detectar reutilización sospechosa en el futuro.
- **Encaje con Next.js + Express**: las cookies HttpOnly funcionan bien con este patrón. La configuración de SameSite y CORS se definirá en Sprint 00 según la topología final de dominios, priorizando una arquitectura same-site mediante Nginx para simplificar la configuración.
- **Extensible**: soporta sesiones múltiples, expiración por inactividad y roles futuros sin cambiar la arquitectura base.

## Riesgos

- **CSRF**: el uso de cookies expone a ataques CSRF. La mitigación depende de la topología final: si frontend y API comparten dominio raíz vía Nginx, SameSite=Strict o Lax es suficiente. Si hubiera cross-site real (subdominios distintos u orígenes separados), se necesitaría SameSite=None + Secure + token CSRF explícito en cabecera. La estrategia concreta debe decidirse en Sprint 00 técnico una vez conocida la topología.
- **CORS y cookies**: si Next.js y la API Express corren en orígenes distintos, las cookies pueden bloquearse según el navegador. La solución preferida es servir ambos bajo el mismo dominio raíz mediante Nginx. Si no es posible, se requerirá `credentials: 'include'` en el cliente y `Access-Control-Allow-Credentials: true` en el servidor, con origen permitido explícito. A definir en Sprint 00.
- **Persistencia del refresh token**: añade una tabla en DB y lógica de limpieza de tokens expirados. Es complejidad extra respecto a un JWT puro stateless, asumida deliberadamente por seguridad.
- **Rotación del refresh token**: si se implementa rotación, hay que manejar el caso de dos peticiones simultáneas con el mismo token. A resolver en implementación.
- **Hash de contraseñas**: la elección entre bcrypt y argon2 se deja para el Sprint 00 técnico. Ambas son válidas; argon2 es más moderna pero requiere dependencias nativas. La decisión debe documentarse antes de implementar.

## Alternativas consideradas

### JWT stateless puro

Access token JWT de vida larga, sin refresh token, sin estado en servidor.

| Criterio | JWT híbrido (elegido) | JWT stateless puro |
|---|---|---|
| Seguridad | Alta (vida corta + revocación) | Media (no revocable antes de expirar) |
| Logout real | Sí (revocación en DB) | No (solo expiración del token) |
| Expiración | Configurable, controlada | Solo por TTL del token |
| Refresh | Sí, con rotación posible | No (o token de vida muy larga) |
| Complejidad MVP | Media | Baja |
| Almacenamiento seguro | Cookie HttpOnly | Cookie o localStorage |
| CSRF | Requiere mitigación | Requiere mitigación (si cookie) |

Descartado porque el logout real es un requisito de la spec (M01): "el logout invalida la sesión en el servidor". Un JWT stateless no permite eso sin lista negra, que es esencialmente lo mismo que persistir el token.

### Sesiones seguras con almacenamiento en servidor (express-session / iron-session)

Sesión clásica: el servidor mantiene el estado de sesión completo, el cliente solo guarda un identificador de sesión en cookie HttpOnly.

| Criterio | JWT híbrido (elegido) | Sesiones en servidor |
|---|---|---|
| Seguridad | Alta | Alta |
| Logout real | Sí | Sí (destruir sesión) |
| Escalabilidad | Mejor (stateless en API) | Requiere store compartido |
| Encaje con Next.js | Bueno | Bueno (next-auth, iron-session) |
| CSRF | Requiere mitigación | Requiere mitigación |
| Deploy en VPS | Flexible | Requiere Redis o DB de sesiones |
| Ecosistema Express | Maduro | Maduro |

Descartado para el MVP porque el patrón JWT + refresh token encaja mejor con una API REST que puede escalar hacia móvil u otros clientes en el futuro, sin depender de un store de sesiones compartido. Se puede reevaluar si el equipo decide usar Next.js App Router con Server Actions, donde las sesiones de servidor encajan de forma más natural.

## Impacto en specs

- **Auth (M01)**: todos los requisitos de la spec quedan cubiertos por esta estrategia: login con token, logout real, rutas privadas en backend, contraseñas hasheadas, errores genéricos.
- **Todos los módulos privados (M02-M06)**: el middleware de verificación del access token protege cada ruta autenticada en Express (ADR-0005).
- **Saved Jobs (M04)**: la separación de datos por usuario depende de que el `userId` provenga del token verificado en el servidor, no del cliente.
- **Dashboard (M06)**: los datos agregados del dashboard se sirven solo al candidato autenticado identificado por el token.

## Impacto en futuro Sprint 00 técnico

Al iniciar implementación, el Sprint 00 técnico deberá:

1. Elegir la librería de JWT (ej: `jsonwebtoken` + `@types/jsonwebtoken` o equivalente moderno).
2. Elegir bcrypt o argon2 para hash de contraseñas y documentar la decisión.
3. Crear la tabla `RefreshToken` en el schema de Prisma (o equivalente) con campos: id, userId, tokenHash, expiresAt, createdAt, revokedAt.
4. Implementar el middleware Express de verificación del access token.
5. Configurar las cookies: HttpOnly, Secure en producción, SameSite según topología final de dominios.
6. Decidir la estrategia de mitigación de CSRF según la topología: SameSite=Strict/Lax si same-site; token CSRF explícito si cross-site.
7. Configurar CORS en Express solo si frontend y API corren en orígenes distintos; priorizar arquitectura same-site mediante Nginx.
8. Implementar la lógica de rotación del refresh token si se decide activarla desde el inicio.

Nada de lo anterior se implementa en esta fase documental.
