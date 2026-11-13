# CuidadoCerca Mobile

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
