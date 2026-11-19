# Rediseño de consultas familiares

Referencia aprobada por la solicitud: cabecera con ilustración vectorial, tarjetas individuales y acciones reales. Sin SOS. Conservar rutas y permisos share:*.

1. Probar migración repetible y documentos antiguos; consultas autorizadas, denegadas y revocadas en SQLite en memoria.
2. Extraer las mismas consultas a caregiverRecords.ts con campos estructurados para presentación; agregar image_uri nullable sin perder filas.
3. Guardar futuras fotografías en el directorio persistente usando expo-file-system ya instalado por Expo. Mantener OCR y confirmación; mostrar honestamente documentos antiguos sin foto.
4. Reutilizar cabecera familiar en actividades, solicitudes y documentos. Crear visor modal con zoom, proporción original y cierre accesible; revalidar autorización antes de abrirlo y cerrar al perder foco.
5. Mantener responder/aceptar/rechazar/completar existentes; rediseñar botones y etiquetas sin modificar transiciones.
6. Ejecutar TypeScript, pruebas SQLite, exportación web y navegación visual. Capturar las tres pantallas reales sin datos ficticios. Cámara/archivos nativos necesitan prueba Android.
