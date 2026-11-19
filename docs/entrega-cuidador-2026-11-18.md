# Actividades, solicitudes y documentos del cuidador

Implementado en los componentes reales de React Native. Referencia: imagen y documento adjuntos del 18/11/2026. Sin botones SOS en estas pantallas; se conserva la restricción global del encabezado familiar.

## Archivos

- `src/screens/CaregiverRecords.tsx`: cabeceras ilustradas, autorización, tarjetas estructuradas, fechas/horas e imágenes reales cuando existen.
- `src/screens/RequestsScreen.tsx`: cabecera común, botones vectoriales de aceptar/rechazar y aparición suave. Conserva el campo de nombre, filtros, historial completo y acciones del repositorio existente.
- `src/ui/FamilySectionHeading.tsx`: nuevo encabezado reutilizable con flecha, ilustración vectorial y etiqueta familiar.
- `src/ui/DocumentViewer.tsx`: nuevo visor modal con imagen proporcional, ampliación 100–400%, desplazamiento y texto guardado. Sin fotografías genéricas.
- `src/ui/SoftAppear.tsx`: animación discreta que respeta la preferencia de movimiento reducido.
- `src/ui/DesignIcon.tsx`: escudo con confirmación añadido al sistema vectorial existente.
- `src/data/caregiverRecords.ts`: extracción de las consultas anteriores, conservando las mismas tablas y permisos share:*; no implementa otro almacenamiento.
- `src/data/database.ts`: columna nullable image_uri; migración repetible sin borrar registros.
- `src/services/DocumentPhoto.ts` y `.web.ts`: conserva nuevas fotografías del escaneo en almacenamiento local. La versión web no simula cámara Android.
- `src/screens/CaptureScreen.tsx`: guarda la fotografía junto al registro confirmado, conserva OCR, impide duplicación por pulsación repetida y mantiene el formulario si falla el guardado.
- `app/(caregiver)/_layout.tsx`: nombres completos Actividades y Documentos, mismos destinos internos.
- `package.json` y `package-lock.json`: expo-file-system 58 declarado como dependencia directa; ya formaba parte de la instalación Expo.
- `.gitignore`: excluye caché local npm.
- `scripts/test-caregiver-records.cjs`: pruebas nuevas de migración, documentos e imágenes, autorizaciones y revocación en SQLite en memoria.

## Conservado

SQLite, registros existentes, permisos y consultas autorizadas, rutas, OCR, dictado, repositorio de solicitudes, sus validaciones y transiciones. No hay sincronización ni notificaciones a otro dispositivo. El perfil Persona mayor mantiene SOS.

La fotografía no se persistía en la versión anterior: solo se guardaba OCR. Los documentos antiguos muestran honestamente que no conservan una imagen; no se puede recuperar una fotografía que nunca se almacenó. El escaneo actual toma una sola fotografía por documento; no se añadió un flujo de varias páginas inexistente.

## Validación

- TypeScript: npm run typecheck (tsc --noEmit), correcto.
- scripts/test-requests.cjs: migración, registros previos, aceptar/rechazar/completar y transiciones inválidas, correcto.
- scripts/test-caregiver-records.cjs: migración repetible, filas antiguas sin foto, referencia original persistida, permiso denegado/autorizado/revocado y actividades con citas independientes, correcto.
- Exportación web y empaquetado JavaScript Android: correctos. Esto no equivale a un APK ni una prueba física en Android.
- Revisión real en navegador a 390 × 844: Actividades, Solicitudes, Documentos, Perfil e Inicio; filtros de solicitudes; modal de confirmación de aceptación cerrado sin guardar; barra inferior; ausencia de SOS.
- La revisión automática bloqueó la prueba del botón Rechazar sobre una solicitud real. No se alteró su estado. La transición sí se comprobó en memoria.

## Límites de la comprobación

La vista actual no tiene documentos compartidos. La captura muestra el estado vacío real, sin insertar ejemplos. Queda pendiente comprobar en Android: cámara y OCR, copia persistente tras cerrar/reabrir, miniatura y zoom de una fotografía real, y TalkBack. El visor y su control de acceso están implementados; no se afirma una prueba física realizada.

La conservación de archivos utiliza la API compatible con SDK 58: [documentación oficial de Expo FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/).

## Capturas reales

- `C:/Users/Andre/Documents/ChatGPT/PROTOTIPADO/cuidador-actividades-redisenadas.jpg`
- `C:/Users/Andre/Documents/ChatGPT/PROTOTIPADO/cuidador-solicitudes-redisenadas.jpg`
- `C:/Users/Andre/Documents/ChatGPT/PROTOTIPADO/cuidador-solicitudes-acciones.jpg`
- `C:/Users/Andre/Documents/ChatGPT/PROTOTIPADO/cuidador-documentos-redisenados.jpg`
