# CuidadoCerca Mobile

Nueva aplicación Android nativa independiente del prototipo web de la raíz. Está organizada con Expo SDK 58, React Native 0.88, TypeScript y Expo Router; no usa HTML, CSS web ni WebView. La referencia Expo confirma estas versiones del SDK/RN y el paquete recomendado de Expo Router: [SDK 58](https://docs.expo.dev/versions/latest/), [Expo Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/).

## Etapas 1 y 2: base y experiencia de persona mayor

- Selector de experiencia: persona mayor y familiar/cuidador.
- Rutas y barras inferiores nativas diferenciadas para ambos roles.
- Safe areas, componentes nativos, Poppins y paleta CuidadoCerca.
- Preferencia de rol guardada localmente en SQLite.
- Contrato de servicio para autenticación y vínculos; falla explícitamente mientras Django REST no esté disponible.
- Mi día permite añadir, ordenar y completar actividades locales, con fecha/hora opcionales.
- Mi salud permite registrar medicamentos y citas localmente; las tomas se guardan como eventos explícitos de “tomé”, “pospuse” o “no confirmado”. No se infieren dosis ni olvidos.
- Perfil permite persistir modo sencillo, contraste y escala de texto; incluye lectura en voz alta mediante `expo-speech`.
- Expo Camera está configurada y declarada, pero la captura/OCR aún no está conectada a la pantalla.
- El reconocimiento de voz para dictado no está implementado. `expo-speech` proporciona lectura en voz alta (TTS), no transcripción.
- La pantalla SOS explica el estado y limitaciones; no simula llamadas o alertas.
- Las pantallas familiares permanecen vacías/informativas hasta que exista autenticación y un backend de permisos.

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

Las dependencias están instaladas, `expo install --check` y `npm run typecheck` pasan, y Expo ya generó el proyecto nativo `android/`. El perfil `preview` de EAS genera APK sin necesitar el SDK local, pero esta máquina no tiene sesión iniciada en Expo (`eas whoami` responde `Not logged in`), así que aún no se puede lanzar la compilación remota. Para compilar localmente también faltan JDK 17 y Android SDK Platform 37, Build-Tools y Platform-Tools.

## Pendiente

1. Instalar dependencias y ejecutar `expo install --fix`; las versiones de paquetes aún no están verificadas por el resolver de Expo.
2. Completar autenticación y vinculación con un backend Django disponible, con permisos comprobados en servidor.
3. Terminar formularios y calendario, y validar todos los tamaños de texto en dispositivo.
4. Conectar captura de cámara y OCR, y añadir dictado nativo con transcripción editable y confirmación explícita.
5. Implementar acceso familiar revocable y resumen basado únicamente en datos sincronizados y autorizados.
6. Implementar SOS y notificaciones remotas después de disponer de backend y contactos consentidos.
7. Probar navegación y formularios en ambos roles, tamaños de pantalla y escalado tipográfico.
8. Generar y verificar un APK debug.
