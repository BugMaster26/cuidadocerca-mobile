# CuidadoCerca Mobile

## Pruebas en el navegador

Desde la carpeta del proyecto, ejecuta `npm ci` la primera vez y luego
`npm run web`. Abre [CuidadoCerca en el navegador](http://localhost:8080).
Recarga después de guardar cambios. Usa siempre la misma dirección y perfil
del navegador para recuperar los registros locales de SQLite.

La captura manual y las confirmaciones de formularios están disponibles en la
web. El escaneo con OCR y los avisos del sistema se comprueban en Android.

Nueva aplicación Android nativa independiente del prototipo web de la raíz. Está organizada con Expo SDK 58, React Native 0.88, TypeScript y Expo Router; no usa HTML, CSS web ni WebView. La referencia Expo confirma estas versiones del SDK/RN y el paquete recomendado de Expo Router: [SDK 58](https://docs.expo.dev/versions/latest/), [Expo Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/).

## Estado actual V13

- Selector de experiencia: persona mayor y familiar/cuidador.
- Rutas y barras inferiores nativas diferenciadas para ambos roles.
- Safe areas, componentes nativos, Poppins y paleta CuidadoCerca.
- Preferencia de rol guardada localmente en SQLite.
- Contrato de servicio para autenticación y vínculos; falla explícitamente mientras Django REST no esté disponible.
- Mi día permite añadir, ordenar y completar actividades locales, con fecha/hora opcionales.
- Mi salud permite registrar medicamentos y citas localmente; las tomas se guardan como eventos explícitos de “tomé”, “pospuse” o “no confirmado”. No se infieren dosis ni olvidos.
- Perfil permite persistir modo sencillo, contraste y escala de texto; incluye lectura en voz alta mediante `expo-speech`.
- Captura inteligente con cámara, OCR nativo, dictado, edición y confirmación antes del guardado local.
- Reconocimiento de voz en español por acción explícita; siempre existe alternativa manual.
- SOS con contacto local, confirmación y apertura del marcador; no llama ni envía alertas en segundo plano.
- Recordatorios locales de actividades y medicamentos sujetos a permisos de Android.
- Las pantallas familiares permanecen vacías/informativas hasta que exista autenticación y un backend de permisos; no se presentan datos ficticios.
- Vista previa navegable en `preview-v13.html` y composición visual en `preview-v13.png`.

El prototipo original en `../index.html`, `../app.js` y `../styles.css` permanece intacto como referencia.

## Dependencias y compilación

Desde esta carpeta:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' exec -- expo install --fix
& 'C:\Program Files\nodejs\npm.cmd' run typecheck
& 'C:\Program Files\nodejs\npm.cmd' exec -- expo prebuild --platform android
& 'C:\Program Files\nodejs\npm.cmd' exec expo run:android
```

Expo SDK 58 requiere Node 22.13 o superior y Android SDK Platform 37 para compilar; la documentación de Expo indica Android 7+ como versión mínima de ejecución. La compilación local se realiza con `npx expo run:android`, que genera el proyecto nativo si aún no existe: [versiones Expo](https://docs.expo.dev/versions/latest/), [compilación local](https://docs.expo.dev/guides/local-app-development/).

Las dependencias están instaladas y `node node_modules/typescript/bin/tsc --noEmit` pasa. Expo puede leer la configuración con `node node_modules/expo/bin/cli config --type public`. El perfil `preview` de EAS generó el APK Android V13 con build ID `2ad968ae-d930-4277-8aa9-f063b7b757c1`; el archivo descargado queda fuera del repositorio porque `.gitignore` excluye `dist/` y `*.apk`. La validación en teléfono de cámara, OCR, voz, notificaciones y TalkBack sigue pendiente.

## Pendiente de validación e integración

1. Probar navegación, formularios y escalado en teléfonos de 360 y 390 dp.
2. Validar cámara, OCR, dictado y notificaciones con permisos reales de Android.
3. Completar autenticación, vinculación y permisos revocables con un backend Django disponible.
4. Probar TalkBack, modo sencillo, contraste, lectura en voz alta y los flujos SOS en dispositivo.

## Ampliación de CuidadoCerca

La app original ya contaba con dos modos, SQLite, agenda, salud, captura, dictado y SOS mediante el marcador. Las pantallas familiares de solicitudes, documentos y actividades eran informativas. La ampliación conserva Expo SDK 58, Expo Router, TypeScript, Poppins y los módulos nativos existentes. No requiere instalar dependencias adicionales.

- Solicitudes locales: Mi familia registra el tipo de ayuda, detalle y fecha opcional. En el modo familiar se puede aceptar indicando responsable, rechazar o marcar atendida. La persona mayor puede cancelar y consultar el historial. Ambos modos utilizan la misma base SQLite del dispositivo. Un nombre ingresado localmente no acredita identidad.
- Persistencia: la migración agrega las columnas anulables scheduled_at y responder a care_requests y conserva los registros existentes. RequestsRepository define las operaciones de la interfaz. Su adaptador local usa SQLite y condiciona las transiciones al estado actual.
- Servicios: catálogo inicial consultable por texto, categoría y distrito. Los teléfonos proceden de https://www.gob.pe/547. Solo se ofrece mapa para registros con dirección.
- Seguridad digital y ayuda: accesos desde Inicio, con orientación por temas, lectura opcional y tutorial. La primera pantalla enlaza con la ayuda y sus ajustes de letra y contraste.
- Recordatorios: las nuevas notificaciones usan un texto genérico. Las notificaciones ya programadas antes del cambio podrían conservar su texto hasta que se vuelvan a programar.

### Ejecución y validación

Desde la carpeta mobile-app, ejecuta npm ci y npm run android en un equipo con JDK, SDK de Android y un dispositivo o emulador. La cámara, OCR y dictado requieren un build con sus módulos nativos. Usa npm run build:apk con acceso al proyecto EAS y el perfil preview para solicitar el APK.

La prueba node scripts/test-requests.cjs usa Node con node:sqlite y verifica la migración sobre una base previa, su repetición y las transiciones de solicitud. Ejecuta npm run typecheck para revisar TypeScript.

### Alcance pendiente

La vinculación autenticada, recepción entre dispositivos, notificaciones familiares y los permisos de documentos compartidos requieren infraestructura de cuentas, transporte y autorización. Las pantallas familiares de documentos, actividades, medicamentos y resumen todavía son informativas. Quedan pendientes el catálogo completo de Lima Norte, ubicación y mensajes de voz en asistencia, y la comprobación integral de accesibilidad, permisos y flujos nativos en Android.

### Datos del directorio nacional

- El catálogo nacional de trámites está en src/data/nationalProcedures.ts. Para actualizar una ficha, comprueba su portal oficial y actualiza el enlace, modalidad y texto juntos. No copies costos, horarios o plazos de una fuente cuya vigencia no puedas establecer.
- El selector usa una instantánea local de la copia pública de códigos INEI de https://github.com/jmc-software-x/public-ubigeo-pe/blob/main/data/ubigeo-inei.json. Contiene 1.874 distritos. No representa las altas territoriales posteriores a la instantánea. Se corrigió la entrada duplicada del código 010000 a Amazonas. La capa pública de MINSA rechazó la descarga en este entorno.
- El catálogo nacional orienta por enlaces oficiales. El inventario de sedes físicas sigue siendo parcial y se basa principalmente en Lima. No hay consulta en tiempo real a RENIPRESS. La ampliación de búsqueda no calcula distancias.
- Para revisar el HTML, desde mobile-app ejecuta node scripts/serve-review.cjs y abre http://127.0.0.1:8091/services.
