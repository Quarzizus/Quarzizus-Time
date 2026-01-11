# Quarzizus Time - Modern Metronome

Metrónomo web (SPA) moderno construido con React, TypeScript, Vite y Tailwind CSS.

## Características

- **BPM preciso**: 20-240 BPM con control fino y Tap Tempo inteligente.
- **Compases**: Soporte para 2/4, 3/4, 4/4 .
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
