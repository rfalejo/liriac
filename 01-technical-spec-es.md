# Especificación técnica y arquitectura — liriac

Objetivo: implementar una aplicación TUI para Linux, escrita en Python y gestionada con uv, que permita escribir libros y capítulos con asistencia de IA por streaming, autoguardado idempotente y gestión de contexto (personajes y capítulos).

## Principios de diseño
- Tipado fuerte primero: tipos estrictos en Dominio/Servicios/Infra/TUI; `mypy --strict` obligatorio en CI, uso de `typing_extensions` y contratos con `Protocol`, `TypedDict`, `Literal`, `NewType`.
- Simplicidad primero: almacenamiento en archivos Markdown + metadatos TOML/YAML.
- Asincronía: streaming de IA y autoguardado no bloquean la UI.
- Modularidad: separar Dominio, Servicios, Infraestructura y TUI.
- Extensibilidad: proveedores de IA intercambiables mediante puertos tipados (Protocol).
- Resiliencia: autoguardado idempotente, recuperación tras fallos, no perder texto del usuario.

## Requisitos
- SO: Linux (x86_64), terminal compatible ANSI; sin soporte para macOS/Windows.
- Python: 3.11 o superior.
- Gestor: `uv` para entornos, instalación y ejecución.
- Red: acceso HTTPS a proveedores compatibles con la API de OpenAI; sin modo offline/local.
- Almacenamiento: sistema de archivos del usuario (ej. `~/Documents/liriac`).

## Estructura del proyecto (propuesta)
```
liriac/
├─ pyproject.toml
├─ src/
│  └─ liriac/
│     ├─ __init__.py
│     ├─ cli.py                    # Punto de entrada CLI (Typer)
│     ├─ app.py                    # Arranque de TUI
│     ├─ constants.py
│     ├─ types.py                  # Tipos compartidos fuertemente tipados
│     ├─ errors.py
│     ├─ tui/                      # Presentación (Textual)
│     │  ├─ __init__.py
│     │  ├─ keymap.py
│     │  ├─ messages.py
│     │  ├─ styles/
│     │  │  └─ app.tcss
│     │  └─ screens/
│     │     ├─ home/
│     │     │  ├─ __init__.py
│     │     │  ├─ view.py
│     │     │  └─ controller.py
│     │     ├─ editor/
│     │     │  ├─ __init__.py
│     │     │  ├─ view.py
│     │     │  ├─ controller.py
│     │     │  └─ statusbar.py
│     │     ├─ suggest/
│     │     │  └─ view.py
│     │     └─ context/
│     │        └─ view.py
│     ├─ domain/                   # Entidades y reglas (sin IO)
│     │  ├─ __init__.py
│     │  ├─ entities/
│     │  │  ├─ book.py
│     │  │  ├─ chapter.py
│     │  │  ├─ persona.py
│     │  │  ├─ suggestion.py
│     │  │  └─ context.py
│     │  ├─ value_objects.py
│     │  ├─ ports.py               # Protocols: AIProvider, Repo, Config
│     │  └─ events.py
│     ├─ services/                 # Orquestación/casos de uso
│     │  ├─ __init__.py
│     │  ├─ autosave/
│     │  │  ├─ scheduler.py
│     │  │  ├─ writer.py
│     │  │  └─ snapshots.py
│     │  ├─ suggestions/
│     │  │  ├─ orchestrator.py
│     │  │  ├─ history.py
│     │  │  └─ acceptance.py
│     │  └─ context/
│     │     ├─ builder.py
│     │     ├─ selectors.py
│     │     └─ limits.py
│     ├─ infra/                    # Adaptadores (implementan puertos)
│     │  ├─ __init__.py
│     │  ├─ fs/
│     │  │  ├─ library.py
│     │  │  ├─ books.py
│     │  │  ├─ chapters.py
│     │  │  ├─ state.py
│     │  │  ├─ versions.py
│     │  │  └─ locks.py
│     │  ├─ ai/
│     │  │  ├─ __init__.py
│     │  │  ├─ base.py             # Interfaces/Protocol
│     │  │  ├─ mock.py
│     │  │  └─ openai/
│     │  │     ├─ client.py
│     │  │     ├─ stream.py
│     │  │     ├─ mapper.py
│     │  │     └─ retry.py
│     │  ├─ config/
│     │  │  ├─ __init__.py
│     │  │  ├─ settings.py         # Pydantic (type-safe)
│     │  │  └─ sources.py
│     │  ├─ logging.py             # Logging estructurado
│     │  └─ metrics.py
│     └─ utils/
│        ├─ __init__.py
│        ├─ timers.py              # Debounce/Throttle
│        ├─ io.py
│        ├─ path.py
│        ├─ hashing.py
│        └─ tokens/
│           ├─ __init__.py
│           ├─ heuristics.py
│           └─ tiktoken_adapter.py
├─ docs/
│  ├─ 00-draft.md
│  └─ 01-technical-spec.md
└─ .env.example                    # Variables de entorno (tokens, etc.)
```

## Formato de datos y almacenamiento
- Biblioteca por defecto en el directorio actual (configurable).
- Formato Markdown soportado: CommonMark básico; sin tablas, notas al pie, enlaces u otras extensiones; solo estilos básicos.
- Sin límites de tamaño por capítulo/libro definidos por la app.
- Sin integración de backup/sync (Syncthing/Dropbox) en la app.
- Estructura por libro:
  ```
  ./<slug-libro>/
  ├─ book.toml                 # metadatos del libro (título, autor, fechas, etc.)
  ├─ personas.yaml             # personajes/entidades del mundo
  ├─ chapters/
  │  ├─ 01-la-salida.md
  │  ├─ 02-el-mapa.md
  │  └─ 03-el-puerto.md
  └─ .liriac/
     ├─ suggestions/
     │  ├─ 2025-09-13T12-00-00Z-01.md   # sugerencias aceptadas/rechazadas (log)
     │  └─ ...
     ├─ versions/             # log de versiones (snapshots/diffs); sin deshacer/rehacer
     └─ state.json              # estado UI no crítico (último capítulo abierto, etc.)
  ```
- `book.toml` (ejemplo mínimo):
  ```toml
  title = "El viajero"
  created_at = "2024-09-01"
  chapters = ["01-la-salida.md", "02-el-mapa.md", "03-el-puerto.md"]
  last_opened = "03-el-puerto.md"
  ```
- Las sugerencias rechazadas se conservan en `.liriac/suggestions/` para auditoría.
- Se mantiene un log de versiones en `.liriac/versions/`; no hay deshacer/rehacer.

## Dependencias recomendadas
- TUI:
  - Opción A (recomendada): `textual` (async, composición de pantallas, testing con Pilot).
  - Alternativas: `prompt_toolkit` + `rich`, o `urwid`.
- CLI: `typer` para comandos (`liriac`).
- HTTP/Streaming: `httpx` (async) con soporte streaming.
- Configuración: `pydantic` (settings) + `tomllib` (lectura TOML stdlib) + `tomli-w` (escritura).
- Tokenización (estimación): `tiktoken`.
- Tests: `pytest`, `pytest-asyncio`.
- Tipado: `mypy` (estricto; obligatorio en CI), `typing-extensions`, stubs `types-*`, `pyright` opcional.
- Estilo: `ruff` (linter) y `black` (formateo); regla para impedir `Any` no intencional.

## Arranque y empaquetado con uv
- `pyproject.toml`:
  - Definir proyecto `name = "liriac"`, `requires-python = ">=3.11"`.
  - `dependencies = [...]` según selección.
  - `[project.scripts] liriac = "liriac.cli:app"` (Typer).
- Comandos útiles (Linux + uv):
  ```
  uv venv
  uv sync --all-extras
  uv run liriac
  ```
- Distribución: `uv build` (wheel/sdist). Publicación opcional.

## Arquitectura lógica (capas)
- UI (TUI): pantallas y widgets; no contiene lógica de negocio.
- Servicios de aplicación: orquestan casos de uso (sugerir, aceptar, regenerar, autoguardar).
- Puertos (Ports): interfaces tipadas con `Protocol`/`TypedDict` que definen contratos sin IO.
- Dominio: entidades y reglas puras (sin IO) con invariantes explícitas.
- Infraestructura: adaptadores (IA, FS, config, logging) que implementan Puertos.
- Contratos y tipos: IDs con `NewType`, flags con `Literal`, evitar `Any` implícito.
- Diagrama (texto):
  ```
  TUI ──> Servicios ──> Dominio
    │         │
    │         └───> Puertos (Protocol)
    └───────────────────────┐
                            v
                         Infra (AI/FS/Config/Log) ──> implementa Puertos
  ```

## Modelado de dominio (resumen)
- Entidades:
  - `Book(id, title, created_at, chapters: list[ChapterRef], personas: list[Persona])`
  - `Chapter(id, title, path, text, updated_at)`
  - `Persona(id, name, role, notes, enabled: bool)`
  - `Suggestion(id, text, source, created_at, status: {pending, accepted, rejected})`
  - `ContextProfile(chapters: list[ChapterRef], personas: list[PersonaRef], system_prompt: str)`
- Reglas:
  - La IA solo sugiere al final del capítulo actual.
  - Aceptar integra y limpia el color diferenciado (presentación).
  - Autoguardado idempotente cada 10s o al aceptar; evitar escribir si no cambió el hash del contenido.

## Flujos principales
1. Abrir libro/capítulo:
   - Repositorio FS lista libros → seleccionar → cargar `book.toml` y capítulo activo → render TUI.
2. Generar sugerencia:
   - Construir `ContextProfile` → componer prompt → llamar `AIProvider.stream()` → render tokens en tiempo real → controlar cancelación.
3. Aceptar sugerencia:
   - Fusionar texto en `Chapter.text` → persistir con `AutosaveService` (idempotente) → registrar en `.liriac/suggestions/`.
4. Regenerar:
   - Mantener lista de sugerencias en memoria; navegación 1/2, 2/2.
5. Autoguardado:
   - Temporizador con `debounce(10s)` y `content_hash` para evitar escrituras redundantes.

## Streaming de IA
- Interfaz (Protocol):
  ```python
  class AIProvider(Protocol):
      async def stream(
          self, *, prompt: str, settings: AISettings, context: ContextProfile
      ) -> AsyncIterator[StreamEvent]: ...
  ```
- `StreamEvent`: `delta: str | None`, `usage: Tokens | None`, `done: bool`, `error: str | None`.
- OpenAI/compatibles:
  - `httpx.AsyncClient.stream("POST", url, json=payload, headers=...)`
  - Control de cancelación: `async with anyio.move_on_after(timeout)` o señal TUI (Esc x2).
  - Timeout por defecto: 120s; si hay deltas en curso, no expira hasta finalizar el streaming.
  - Al alcanzar el límite de tokens: truncar con advertencia sutil.
  - Reintento único con backoff corto ante errores de red.
  - Parámetros expuestos: todos los soportados por OpenAI (temperatura, top_p, etc.).
  - Sin presupuesto ni backpressure a nivel de app; errores de rate limit se informan tal cual.

## Autoguardado (detalle)
- Servicio dedicado con:
  - `schedule_save(chapter_id, content)`: aplica `debounce(10s)`.
  - Escribe solo si `sha256(content)` difiere del último guardado.
  - Snapshots en `.liriac/versions/` solo si el diff es >= 100 caracteres.
  - Manejo seguro: escribir a archivo temporal y `os.replace` atómico.
  - Concurrencia: bloqueo de archivo a nivel host (no distribuido); sin merge automático.
  - Estado minimal en `.liriac/state.json` (último abierto; si se pierde, no afecta contenido).

## Gestión de contexto
- Personas: toggles booleanos por capítulo.
- Capítulos incluidos: selección múltiple con límites por tokens.
- Estimación de tokens:
  - Heurística base por longitud + `tiktoken` para precisión real.
- System prompt por libro en archivo Markdown (no editable desde la TUI); se recarga al enviar el prompt.

## Logging y métricas
- Logging estructurado (`json`) con niveles: INFO por defecto, DEBUG opcional.
- Redactar secretos (API keys).
- Métricas locales en `.liriac/metrics.json` (conteo de sugerencias, tiempos), sin telemetría externa.
- Sin rotación automática de logs/metrics; los ficheros pueden crecer sin límite.

## Testing
- Dominio/Servicios: tests unitarios (sin IO).
- Infra: tests de integración con `httpx` + `respx` (mock).
- TUI: pruebas con `textual` Pilot (interacciones básicas, snapshot).
- Mock de AIProvider para flujos offline deterministas.
- Tipado (CI): `mypy --strict` como gate; cobertura de tipos ≥ 90%; `type: ignore` solo con justificación.

## Accesibilidad y UX
- Controles de teclado consistentes y visibles en footers.
- Persistencia de último foco/panel.
- Sin personalización de atajos de teclado.
- Sin accesos alternativos a la tecla Esc.
- Sin temas/íconos/emojis.
- i18n futura; actualmente UX en español.

## Seguridad y privacidad
- API keys solo por variables de entorno o `~/.config/liriac/config.toml` con permisos 600.
- No subir contenido del usuario sin consentimiento explícito.
- Sin política propia de retención con proveedores OpenAI-compatibles; se usan sus valores por defecto y no se envían metadatos adicionales.
- Logs sin datos sensibles.

## Sugerencias de arquitecturas

### A) Textual + httpx + Typer (recomendada) <-- Vamos a usar esto.
- Pros: componentes ricos, async nativo, tests integrados, layout moderno.
- Contras: dependencia específica; curva de aprendizaje moderada.

### B) prompt_toolkit + Rich + httpx
- Pros: control fino del input; ecosistema maduro.
- Contras: más “pegamento” para layout/gestión de pantallas; testing manual más complejo.

### C) curses/urwid minimalista
- Pros: footprint mínimo, sin dependencias modernas.
- Contras: ergonomía menor, menos soporte a async/streaming y testing.

## Roadmap MVP
1. Estructura de proyecto + CLI (`liriac --path .`).
2. Pantalla principal (libros/capítulos) con navegación y abrir capítulo.
3. Editor básico con scroll/cursor, carga/guardado manual.
4. Servicio de autoguardado idempotente (10s) + guardado atómico.
5. Modo sugerencia: prompt, streaming con cancelación, aceptar/regenerar.
6. Gestión de contexto (personas y capítulos) básica.
7. Logs y configuración inicial.
8. Tipado estricto en CI: `mypy --strict`, cobertura de tipos ≥ 90%, sin `Any` implícito.

## Configuración
- Prioridad de configuración:
  1) Flags CLI → 2) Variables de entorno → 3) `~/.config/liriac/config.toml` → 4) Defaults.
- Ejemplo `.env.example`:
  ```
  LIRIAC_LIBRARY_DIR=/home/usuario/Documents/liriac # Si no está configurado, será el current directory.
  LIRIAC_AI_PROVIDER=openai # único soportado por el momento
  OPENAI_MODEL=gpt-5
  OPENAI_API_KEY=sk-*****
  OPENAI_BASE_URL= # opcional, si el endpoint no es de OpenAI
  OPENAI_MAX_TOKENS=512
  OPENAI_REQUEST_TIMEOUT=120
  ```
