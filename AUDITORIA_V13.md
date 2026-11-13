# Auditoría y avance V13 — CuidadoCerca

**Proyecto:** Expo / React Native / TypeScript / Expo Router / SQLite en `mobile-app`. Se conserva la arquitectura existente y no se modifica el prototipo web.

| Requisito V13 | Estado actual | Archivos relacionados | Qué falta | Acción necesaria |
|---|---|---|---|---|
| Mantener arquitectura móvil existente | **Implementada y comprobada estáticamente**: configuración y `tsc --noEmit` pasan | `package.json`, `app.json`, `app/_layout.tsx`, `src/data/database.ts` | Aún no se probó en dispositivo Android | Revisar compilación tras aprobación del preview y probar en teléfono |
| Identidad, navegación, Poppins y componentes nativos | **Parcialmente implementada**: tokens, fuente, Safe Area, tabs por rol, SOS persistente y componentes comunes escalables | `src/ui/theme.ts`, `src/ui/NativeScreens.tsx`, `app/(senior)/_layout.tsx`, `app/(caregiver)/_layout.tsx` | Los controles específicos de algunas pantallas aún no consumen toda la escala/contraste; falta QA visual Android | Ajustar componentes restantes al revisar en dispositivo |
| Inicio y Mi día | **Parcialmente implementada**: SQLite, agenda hoy/7 días, alta/edición/eliminación/completado/posposición y accesos a salud, captura y SOS | `src/screens/SeniorHomeScreen.tsx`, `src/screens/SeniorDayScreen.tsx`, `src/services/LocalReminders.ts` | Falta validar fechas, conteos y notificaciones en Android; lectura completa del día no está conectada | Prueba funcional del ciclo completo en dispositivo |
| Salud: medicamentos y citas | **Parcialmente implementada**: formularios con revisión, registros SQLite, eventos declarados por la persona, citas y recordatorios locales diarios | `src/screens/SeniorHealthScreen.tsx`, `src/data/database.ts`, `src/services/LocalReminders.ts` | Falta editar/eliminar medicamentos y citas, documentos/preguntas de cita y validar permisos/notificaciones; no hay sincronización | Completar gestión de citas y pruebas con Android |
| Captura inteligente, cámara y OCR | **Parcialmente implementada**: cámara, permiso, OCR nativo configurado, texto corregible, confirmación y lista local de documentos | `src/screens/CaptureScreen.tsx`, `app.json`, `src/data/database.ts` | No ejecutado en Android; fotos son temporales y solo se persiste el texto confirmado | Probar permisos, captura y OCR real en dispositivo; decidir retención de imágenes |
| Dictado en español | **Parcialmente implementada**: reconocimiento por acción explícita, estados, transcripción editable y alternativa escrita | `src/ui/VoiceAssistant.tsx`, `app.json` | Sin prueba con servicio de voz de Android; no disponible en Expo Go estándar | Validar en compilación nativa y revisar fallos/idioma |
| SOS táctil y comando de voz | **Parcialmente implementada**: contacto local, confirmación y apertura del marcador; escucha por voz solo tras pulsar | `src/screens/SosScreen.tsx`, `src/ui/NativeScreens.tsx`, `src/ui/VoiceAssistant.tsx` | No se inicia llamada ni se envían SMS/ubicación; falta prueba en teléfono y comprobación de teléfono disponible | Probar llamadas asistidas y dejar límites explícitos |
| Experiencia familiar, permisos y solicitudes | **Parcialmente implementada**: navegación separada, solicitudes guardadas localmente y permisos locales revocables | `src/screens/CaregiverHomeScreen.tsx`, `src/ui/NativeScreens.tsx`, `app/(caregiver)/*`, `src/data/database.ts` | Sin cuentas vinculadas, backend, servicio de sincronización ni datos compartidos; rutas de familiar muestran estados vacíos honestos | Integrar backend/autorización real antes de compartir información |
| Perfil, privacidad y accesibilidad | **Parcialmente implementada**: modo sencillo, contraste, escala persistida, TTS, contacto SOS y preferencias locales de compartir | `src/ui/NativeScreens.tsx`, `src/accessibility/AccessibilityContext.tsx` | Aplicación global incompleta en estilos específicos; falta verificación TalkBack y siete principios por tarea | QA con texto grande, lector de pantalla y personas usuarias |
| Validación Android y varios tamaños | **APK debug/preview compilado; flujos todavía no comprobados en teléfono** | `dist/CuidadoCerca-v13.apk`, `app.json`, pantallas nativas | Sin ejecución real en 360/390 dp, cámara, micrófono, navegación, notificaciones, TalkBack ni alturas diversas | Instalar y probar en dispositivo; la compilación por sí sola no demuestra esos flujos |

## Comprobación realizada en esta etapa

- `node node_modules/typescript/bin/tsc --noEmit`: sin errores.
- Render de la maqueta de revisión: generado como imagen estática.
- `preview-v13.html`: maqueta independiente navegable con vistas de persona mayor y familiar; el JavaScript embebido pasó comprobación de sintaxis.
- `node node_modules/expo/bin/cli config --type public`: configuración leída correctamente; `expo install --check` no pudo completarse porque el entorno bloqueó la conexión de red.
- EAS Build Android `preview` finalizó correctamente (build ID: `2ad968ae-d930-4277-8aa9-f063b7b757c1`).
- APK descargado en `dist/CuidadoCerca-v13.apk`; se verificó presencia del manifiesto Android y archivos DEX.
- No se ejecutó en emulador ni se probaron cámara/voz/OCR en un teléfono Android.
- No se modificó la web vecina al proyecto.

`preview-v13.html` y la imagen `preview-v13.png` son maquetas ilustrativas para revisar jerarquía y estilo. No son capturas del binario ni muestran registros precargados reales. El APK de esta versión ya fue generado; las funciones nativas requieren validación en un teléfono.
