Guía técnica para un LLM especializado en código — Proyecto: Metrónomo MVP (React + SCSS + shadcn/otra UI moderna)

Propósito: este documento sirve como prompt / guía de trabajo para un LLM especializado en código que va a implementar y mantener el metrónomo MVP descrito previamente. Contiene requisitos (funcionales y no funcionales), arquitectura, detalles de UI/UX, contratos técnicos, criterios de aceptación, ejemplos de prompts para el LLM, y pruebas mínimas.
Instrucción del cliente: tomar en cuenta todo lo no opcional del diseño del metrónomo (BPM, compases, acentos, sonidos, gap/mute por compases, visualización, subdivisiones básicas, tap tempo, transporte, persistencia simple, estabilidad de audio), y usar React como framework y SCSS para estilos. Se puede usar shadcn o otra librería moderna de componentes — elegir una y documentar decisiones.

1. Resumen del producto (MVP)

Un metrónomo web (SPA) capaz de:

Ajustar BPM (20–240, control fino ±1).

Seleccionar compases básicos: 4/4, 3/4, 2/4, 6/8.

Acentuar el primer tiempo (sonido diferenciado y volumen independiente).

Soportar sonidos: click agudo (beat) y click grave (acento), volumen independiente.

Implementar Gap / Mute: X compases ON, Y compases OFF (configurable).

Visualización clara: BPM grande, indicador de beats/subdivisiones, indicador ON/OFF de gap.

Subdivisiones: negra, corchea, tresillo de negra (mínimo).

Tap tempo.

Play/Stop, reset compás, conteo previo (pre-roll 1 compás).

Persistencia simple (último BPM, subdivisión, configuración de gap).

Audio estable: baja latencia, sin drift en largas sesiones.

2. Requisitos funcionales (RFR)

Cada ítem será verificable mediante pruebas unitarias/integración o manuales.

BPM

Rango: 20–240.

UI: input numérico (editable), control ±1 (botones) y slider.

Precisión: update inmediato; control fino con flechas/rueda.

Compás

Soportar: 4/4, 3/4, 2/4, 6/8.

Mostrar número de pulsos por compás en UI.

Acentuación

Primer beat con sonido distinto (más grave) y control de volumen propio.

Opción por defecto: acento en beat 1.

Sonidos

Dos samples/sintetizadores simples: click (agudo), accent (grave).

Control de volumen separado (master, accent, beat).

Gap / Mute

Configurable: onBars (n compases con metrónomo) y offBars (n compases en silencio).

Ejemplo UI: inputs numéricos para on/off; toggle para activar/desactivar.

Visual: mostrar estado actual (p. ej. barra con color) y contador de compases restante en ciclo.

Visualización

BPM grande y legible.

Indicador de beats: serie de puntos o barras que se iluminan por beat y subdivisión.

Mostrar compás actual (1..N).

Mostrar ON/OFF del gap y número de compases restantes hasta cambio.

Subdivisiones

Seleccionar: negra, corchea, tresillo de negra.

Visual y auditiva (click para subdivisiones si aplica).

Tap Tempo

Detectar taps del usuario y calcular BPM promedio.

Validar rango 20–240.

Transporte

Play / Stop.

Reset compás -> reinicia contador de beat al 1.

Pre-roll: 1 compás contado antes de arrancar (opcional por defecto activo).

Persistencia

Guardar en localStorage: último BPM, subdivisión, compás seleccionado, gap config, volumenes.

Cargar en inicialización.

Estabilidad de audio

Usar AudioContext + scheduler (see detalle técnico) para programar clicks con anticipación (lookahead) y evitar jitter.

Evitar uso de setInterval para disparo sonoro directo.

3. Requisitos no funcionales (NFR)

Latencia: audibles libres de jitter en navegación moderna; scheduling con AudioContext para estabilidad.

Compatibilidad: Desktop (Chrome, Firefox, Edge), soporte básico en Safari (notar restricciones de autoplay).

Accesibilidad: controles accesibles por teclado; etiquetas ARIA en botones y sliders; contraste suficiente.

Performance: UI ligera (<200ms para renderes interactivos), uso mínimo de memoria.

Seguridad: sin dependencias externas remotas para sonidos; todo local.

Internacionalización: textos en español por defecto; estructura para traducir.

Testabilidad: componentes con hooks separados para lógica (p. ej. useMetronomeEngine) para facilitar tests.

4. Arquitectura propuesta
   4.1. Estructura general (carpetas)

/src
/components
/PlayerControls
/BpmControl
/TimeSignatureSelector
/SubdivisionSelector
/GapConfig
/Visualizer
/VolumeControls
/hooks
useMetronomeEngine.ts
useAudioScheduler.ts
usePersistedState.ts
/styles
\_variables.scss
main.scss
/lib
audioUtils.ts
mathUtils.ts
/pages
App.tsx
index.tsx

4.2. División de responsabilidad

UI components: presentación + callbacks.

useMetronomeEngine: orquesta la lógica del metrónomo (BPM → scheduling, compás, gaps, subdivisiones, acentos).

useAudioScheduler: abstracción sobre AudioContext y programación de eventos (lookahead, buffer).

Persistence: usePersistedState(key, default) (localStorage wrapper).

Visualización: componente puro que recibe estado (beatIndex, subdivisionIndex, isGapOn, barsLeft).

5. Detalles técnicos importantes
   5.1. Audio: WebAudio API + Scheduler

Crear AudioContext al primer Play (para evitar bloqueo por autoplay).

Implementar un scheduler con

lookahead (p. ej. 25 ms)

scheduleAheadTime (p. ej. 0.1–0.5 s)

setInterval del scheduler en background que programa los OscillatorNode o AudioBufferSourceNode al AudioContext.currentTime + offset.

Preferible: sintetizar click con OscillatorNode (short burst) o usar pequeños AudioBuffers generados al init (faster).

Avoid playing clicks with setTimeout at audio time — usar AudioContext scheduling.

Para acento: variar frecuencia/shape o usar buffer distinto.

5.2. Timing y conteo de compases

Calcular secondsPerBeat = 60 / bpm.

Mantener variables:

currentBarIndex (0..)

currentBeatInBar (0..beatsPerBar-1)

subdivisionIndex (if appl)

Implementar contador de compases ON/OFF: cuando onBars completado -> switch to offBars silence while still advancing bar counters (visual must continue).

5.3. Tap tempo

Recibir timestamps de taps, calcular intervalos entre taps recientes (últimos 4), promedio y convertir a BPM.

Ignorar taps con intervalos fuera de rango plausible (menos de 60ms o mayor a 3s).

5.4. Persistencia

Guardar un objeto metronomeSettings en localStorage.

version field para migraciones futuras.

Guardar en cada cambio crítico (debounced).

5.5. Accesibilidad

Todos los controles con aria-label.

Teclas rápidas: espacio -> Play/Stop; T -> Tap tempo; ↑/↓ -> BPM ±1; R -> reset.

6. UI / Componentes (especificación)

Header: título, estado (Running / Stopped), tempo grande.

BpmControl: número editable, +/− botones, slider.

TimeSignatureSelector: dropdown con 2/4, 3/4, 4/4, 6/8.

SubdivisionSelector: radio buttons — negra, corchea, tresillo.

VolumeControls: master, accent, beat sliders.

GapConfig: inputs onBars y offBars, toggle Active.

Visualizer: row of beat dots with highlight; subdiv tick marks.

Transport: Play / Stop, Reset, Pre-roll toggle.

TapTempoButton: botón grande para tocar; mostrar BPM calculado.

SettingsPanel: persistencia, about.

Estilos: SCSS para variables y temas; si se usa shadcn, envolver componentes presentacionales con shadcn primitives y usar SCSS para layout y overrides. (Decisión: elegir 1 — preferencia del equipo: si quieren componentes muy diseñados y rápida construcción, usar shadcn + Tailwind; si quieren SCSS puro, usar una librería como Chakra UI o Radix + SCSS para estilos. Aquí presumiremos SCSS + shadcn primitives integration option — documentar elección en el repo.)

7. Contratos / API entre componentes

useMetronomeEngine → expone:

start(): void

stop(): void

isRunning: boolean

bpm: number

setBpm(n: number)

timeSignature: { beatsPerBar: number, noteValue: number }

subdivision: "quarter" | "eighth" | "triplet"

onBars: number, offBars: number, gapActive: boolean

tapTempo(t: number): void

volume: { master, accent, beat }

currentBeatIndex, currentBarIndex, isGapOn

UI consumes exclusivamente esta API (se facilita testing).

8. Tests mínimos (unit + integration)

Unit:

mathUtils.secondsPerBeat(bpm) correct.

tapTempo : con timestamps produce BPM esperada.

gap state machine : onBars/offBars cycles correct.

Integration:

useMetronomeEngine progression: inicia y avanza beats correctly (usar mocked AudioContext/time).

Persistencia: settings persisted and reloaded.

E2E (opcional después): checks Play/Stop, Tap tempo, change BPM, gap behavior.

9. Criterios de aceptación (QA)

Al 120 BPM en 4/4 con subdivisión corchea el click suena en intervalos de 0.5 s.

Acento en beat 1 suena con timbre/volumen distinto del resto.

Gap configurado a 2 on / 2 off alterna cada 2 compases; cuando en OFF no se oyen clicks, pero la visualización avanza y muestra estado OFF.

Tap tempo con 4 taps regulares en 500ms produce 120 BPM.

Guardar y recargar la página conserva último BPM, subdivisión y gap config.

Riot tests manuales: sin drift en sesiones de >10 minutos.

10. Recomendaciones de implementación (paso a paso)

Crear repo + config (Vite, TypeScript, React).

Implementar la estructura de carpetas y useMetronomeEngine interfaz (sin audio).

Mock UI con placeholders; enlazar controles a state.

Implementar scheduler con AudioContext (sintetizador de click).

Implementar gap logic y visualización.

Añadir persistencia localStorage.

Polishing: SCSS theming, accesibilidad, tests.

Revisión de performance y latencia; ajustar scheduleAheadTime.

13. Reglas de estilo / convenciones

TypeScript estricto (strict: true).

Prefer functional components + hooks.

Componentes pequeños y testables.

CSS: SCSS con variables en \_variables.scss.

Naming: BEM-like para clases si no se usa utility-first.

Commits: mensajes convencionales (feat:, fix:, chore:).

Documentación: README con run/build/test.

14. Entregables mínimos

Repo con:

src/ completo.

README.md con instrucciones de run/test.

Tests unitarios para las funciones críticas.

SCSS theming y UI básica.

Demo funcional: Play/Stop, BPM, compás, subdivisión, gap, tap tempo, persistencia.

15. Consideraciones finales / restricciones

Evitar dependencias que añad antilatencia (p. ej. no usar setInterval en el audio path).

El LLM debe generar código con useMetronomeEngine desacoplado de la UI (separación de concerns).

Si se elige shadcn (Tailwind), documentar la mezcla con SCSS (o preferir otra librería para mantener SCSS coherente).

Mantener la implementación lo más simple posible manteniendo la robustez del timing.
