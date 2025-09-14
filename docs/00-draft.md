# Metadata
Nombre de proyecto: liriac
Descripción: aplicación TUI para la escritura de libros sin salir de la terminal con IA completion. Permitirá al usuario crear y editar libros y capítulos.

## Editor de texto (Modo manual)
Interfaz mínima estilo máquina de escribir, WYSIWYG estilo Microsoft Word. No habrá herramientas de edición avanzadas, como búsqueda, reemplazo, etc. Únicamente recorrer el libro, mover el cursor y editar libremente en cualquier parte de este.

## Sugerencias por IA (Modo sugerencia)
Activada por Shift+Tab, desplegará un diálogo de prompt en la parte infeior de la interfaz y el usuario ingresará su prompt para solicitar la continuación del texto, Enter envía el prompt, desactiva el input y muestra:

```
Generando... 128 tokens [Esc x 2] Detener <- actualizado en vivo junto con el streaming.
```

El usuario podrá crear, editar y eliminar los personajes y detalles del ambiente que pertenecen a un libro, dándalo la posibilidad de configurar el contexto de la IA (activando y desactivando qué capítulos y detalles del mundo debe tomar en cuenta para la siguiente sugerencia). Por ejemplo, en en un capítulo dado, el usuario podrá desactivar personajes que no aparecen en dicho capítulo para mejorar la calidad de las sugerencias, así mismo, podrá escoger qué capítulos enviar en el contexto. Especialmente útil en libros largos, donde quizá se requiera de contexto los últimos 3 capítulos, aunque por defecto intentará enviar todo el libro.

La IA únicamente podrá sugerir la continuación de la último parte escrita del libro, esta no podrá realizar ediciones en partes previas.

Al realizar la IA una sugerencia, esta aparecerá como si fuese la verdadera continuación de la parte anterior, pero con un color ligeramente distinto al texto original. El usuario podrá escoger entre aceptar, regenerar y cancelar la sugerencia. Al regenerar, las sugerencias se irán acumulando y el usuario puede deslizar con el teclado las sugerencias (1/2, 2/2, etc). Al aceptar una sugerencia, las demás se eliminarán (pero quedarán almacenadas en un archivo log que puede verse desde el explorar de archivos del SO). Al aceptar una sugerencia, se agregará al archivo .md del capítulo y el cambio de color desaparecerá.

Tendrá soporte para streaming y atajo de teclado para detener la generación, descartarla o aceptarla, por ejemplo, si el usuario detiene la generación, esto no se toma como un fallo, sino como un "detente ahí y decido qué hago", la escritura de texto parará y el escrito no se perderá, a no ser que el usuario lo elimine y por ende este salga de la lista de sugerencias, bajando el número de las sugerencias totales.

## Autoguardado
Al aceptar una sugerencia, idempotente cada 10 segundos. Por ahora no habrá soporte para revertir y rehacer cambios.

## Pantallas

### Pantalla principal (Selección de libro y capítulo)
```
┌─ liriac — Biblioteca ───────────────────────────────────────────────────────────────────────────────────┐
│ Libros                                          Capítulos del libro seleccionado                        │
│ ┌───────────────────────────────────────────┐   ┌─────────────────────────────────────────────────────┐ │
│ │ > El viajero                              │   │ > Cap 01: La salida                                 │ │
│ │   La ciudad invisible                     │   │   Cap 02: El mapa                                   │ │
│ │   Bosque de vidrio                        │   │   Cap 03: El puerto                                 │ │
│ └───────────────────────────────────────────┘   └─────────────────────────────────────────────────────┘ │
│                                                                                                         │
│ Detalles: Creado: 2024-09-01 • Capítulos: 27 • Último abierto: Cap 03                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Enter] Abrir capítulo   [n] Nuevo libro   [c] Nuevo capítulo   [r] Renombrar   [Del] Eliminar          │
│ [Tab] Cambiar panel      [Esc] Salir                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Editor (Modo manual)
```
┌─ liriac — Libro: "El viajero" — Capítulo 03: "El puerto" ─────────────────────────────────────────────┐
│                                                                                                       │
│  El muelle olía a sal y a madera húmeda.                                                              │
│  Las gaviotas trazaban círculos perezosos sobre el agua plana, y las sogas crujían con cada balanceo. │
│                                                                                                       │
│  Camila ajustó el cuaderno contra el pecho y respiró hondo antes de dar el primer paso.               │
│  No esperaba respuestas, solo el rumor del mar y el golpe sordo de sus botas.                         │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
│                                                                                                       │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Modo: Manual  •  Libro: El viajero  •  Cap: 03  •  Ln 12, Col 1  •  Autoguardado: activo (cada 10 s) │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Modo sugerencia (Prompt y streaming)
```
┌─ liriac — Libro: "El viajero" — Capítulo 03: "El puerto" ─────────────────────────────────────────────┐
│                                                                                                       │
│  El muelle olía a sal y a madera húmeda.                                                              │
│  Las gaviotas trazaban círculos perezosos sobre el agua plana, y las sogas crujían con cada balanceo. │
│                                                                                                       │
│  Camila ajustó el cuaderno contra el pecho y respiró hondo antes de dar el primer paso.               │
│  > La brisa le trajo un susurro distante, como si el océano                                           │
│  > le hubiese guardado un secreto demasiado tiempo.                                                   │
│                                                                                                       │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Prompt: "Continúa con tensión creciente y un detalle sensorial"                                       │
│ Generando... 128 tokens [Esc x 2] Detener      Sugerencias 1/2  ← →                                   │
│ [a] Aceptar   [r] Regenerar   [c] Cancelar     [Shift+Tab] Alternar modo  [F10] Contexto              │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Nota:
- El texto sugerido por IA se visualiza con color ligeramente distinto al original. Al aceptar, se integra al capítulo y pierde el color diferenciado.

### Gestión de contexto (Personajes y capítulos)
```
┌─ Contexto de IA - Libro: "El viajero" — Capítulo 03: "El puerto"──────────────────────────────────────┐
│                                                                                                       │
│ Personajes (Espacio: activar/desactivar)                    Capítulos incluidos (Espacio: alternar)   │
│ ┌───────────────────────────────────────────────────────┐   ┌───────────────────────────────────────┐ │
│ │ [x] Camila (protagonista)                             │   │ [x] Cap 01: La salida                 │ │
│ │ [x] Tomás (hermano)                                   │   │ [x] Cap 02: El mapa                   │ │
│ │ [ ] Silvia (antagonista)                              │   │ [x] Cap 03: El puerto                 │ │
│ │ [ ] Capitán Herrera                                   │   │ [ ] Cap 04: La tormenta               │ │
│ │ [x] Gaviotas (ambiente)                               │   │ [ ] Cap 05: El faro                   │ │
│ └───────────────────────────────────────────────────────┘   └───────────────────────────────────────┘ │
│                                                                                                       │
│ System prompt: 2.2k Tokens estimados: 3.1k  • Límite: 8k                                              │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Enter] Guardar cambios   [Esc] Cerrar   [Tab] Cambiar panel                                          │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Nota:
- La configuración del contexto se guarda a nivel de capítulo

### Indicadores de autoguardado (al aceptar sugerencias o haber escrito nuevo texto en los últimos 10seg)
```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Modo: Sugerencia • Autoguardado: guardando...                                                         │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Indicadores de autoguardado desaparece después de autoguardado completo
```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Modo: Sugerencia                                                                                      │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```