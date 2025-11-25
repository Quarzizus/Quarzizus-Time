# Quarzizus Time - Modern Metronome

Metrónomo web (SPA) moderno construido con React, TypeScript, Vite y Tailwind CSS.

## Características
- **BPM preciso**: 20-240 BPM con control fino y Tap Tempo inteligente.
- **Compases**: Soporte para 2/4, 3/4, 4/4 y 6/8.
- **Subdivisiones**: Negras, Corcheas y Tresillos.
- **Gap Trainer**: Funcionalidad avanzada para silenciar compases cíclicamente y entrenar el tiempo interno.
- **Audio de Alta Precisión**: Motor de audio basado en Web Audio API con scheduling anticipado (lookahead) para evitar jitter.
- **Persistencia**: Guarda automáticamente tu configuración.
- **Diseño Moderno**: UI limpia y responsive con soporte para temas (SCSS + Tailwind).
- **PWA Instalable**: Soporte offline y opción de instalación en escritorio y móvil.

## Estructura del Proyecto

- `src/hooks`: Lógica de negocio (Motor del metrónomo, Scheduler de audio).
- `src/components`: Componentes de UI modulares.
- `src/lib`: Utilidades de audio y matemáticas.
- `src/styles`: Configuración de estilos (Tailwind + SCSS).

## Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre http://localhost:5173 en tu navegador.

3. Construir para producción:
   ```bash
   npm run build
   ```

## Desarrollo

### Tecnologías
- Vite
- React 19
- TypeScript
- Tailwind CSS
- SCSS
- Vite PWA Plugin

### Notas de Implementación
El motor de audio (`useMetronomeEngine`) está desacoplado de la UI. Utiliza un sistema de scheduling con "lookahead" para programar eventos de audio en el futuro cercano, garantizando un timing perfecto independientemente del renderizado de React.

### PWA
La aplicación está configurada como una Progressive Web App. Genera automáticamente el manifest y el service worker al ejecutar `npm run build`.
Para probar la funcionalidad PWA localmente, es necesario servir la carpeta `dist` (p.ej. con `http-server` o `npm run preview`).
