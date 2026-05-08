import mongoose from 'mongoose';
import { environment } from './config/environment';
import { Leccion } from './models/Leccion';
import { Ejercicio } from './models/Ejercicio';
import { Usuario } from './models/Usuario';
import { Insignia, BadgeCondition } from './models/Insignia';

// ── Shared seed types ─────────────────────────────────────────────────────────

interface EjercicioSeed {
  tipo: 'opcionMultiple' | 'rellenarHuecos' | 'arrastrarSoltar' | 'emparejar' | 'construirComando' | 'detectarError';
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string | string[];
  explicacion: string;
  orden: number;
}

interface LeccionSeed {
  titulo: string;
  descripcion: string;
  xpRecompensa: number;
  orden: number;
  ejercicios: EjercicioSeed[];
}

// ── Lesson + exercise definitions ────────────────────────────────────────────

const BASICO_SEED: LeccionSeed[] = [
  {
    titulo: '¿Qué es un repositorio?',
    descripcion: 'Aprende qué es un repositorio Git, por qué existe y cómo organiza el historial de cambios de tu proyecto.',
    xpRecompensa: 30,
    orden: 1,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué es un repositorio Git?',
        opciones: [
          'Una carpeta especial donde Git guarda el historial completo de cambios de un proyecto',
          'Un servidor remoto donde se almacenan los archivos en la nube',
          'Un editor de código integrado con control de versiones',
          'Una copia de seguridad automática del sistema operativo',
        ],
        respuestaCorrecta: 'Una carpeta especial donde Git guarda el historial completo de cambios de un proyecto',
        explicacion: 'Un repositorio es una carpeta .git que Git crea dentro de tu proyecto. Contiene todo el historial de cambios, ramas y configuración.',
        orden: 1,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Dónde guarda Git la información del repositorio dentro de tu proyecto?',
        opciones: [
          'En una carpeta oculta llamada .git',
          'En un archivo llamado git.config en el escritorio',
          'En la nube de GitHub automáticamente',
          'En el registro del sistema operativo',
        ],
        respuestaCorrecta: 'En una carpeta oculta llamada .git',
        explicacion: 'Git crea una carpeta oculta .git en la raíz de tu proyecto. Dentro de ella está todo el historial, las ramas y la configuración local.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuál de estas afirmaciones sobre Git es correcta?',
        opciones: [
          'Git registra quién hizo cada cambio, cuándo y por qué',
          'Git solo funciona conectado a internet',
          'Git solo puede manejar proyectos de programación',
          'Git borra automáticamente los archivos antiguos para ahorrar espacio',
        ],
        respuestaCorrecta: 'Git registra quién hizo cada cambio, cuándo y por qué',
        explicacion: 'Cada commit en Git guarda el autor, la fecha y el mensaje del cambio. Puedes trabajar completamente sin conexión: Git es un sistema distribuido.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Inicializar un proyecto: git init',
    descripcion: 'Aprende a crear un repositorio Git desde cero con git init y entiende qué ocurre en tu sistema de archivos.',
    xpRecompensa: 40,
    orden: 2,
    ejercicios: [
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando que convierte una carpeta normal en un repositorio Git vacío.',
        opciones: [],
        respuestaCorrecta: 'git init',
        explicacion: 'git init crea la carpeta .git dentro del directorio actual y lo convierte en un repositorio Git. Solo necesitas ejecutarlo una vez por proyecto.',
        orden: 1,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué ocurre exactamente al ejecutar git init?',
        opciones: [
          'Se crea una carpeta .git con la estructura interna del repositorio',
          'Se sube el proyecto automáticamente a GitHub',
          'Se descargan todas las dependencias del proyecto',
          'Se crea un commit inicial con todos los archivos del proyecto',
        ],
        respuestaCorrecta: 'Se crea una carpeta .git con la estructura interna del repositorio',
        explicacion: 'git init solo crea la carpeta .git. Los archivos de tu proyecto no quedan en el repositorio hasta que los añadas con git add y hagas un commit.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: 'Acabas de crear una carpeta llamada "mi-proyecto". ¿Cuál es el orden correcto para inicializar Git?',
        opciones: [
          'Entrar en la carpeta y ejecutar git init',
          'Ejecutar git init y luego entrar en la carpeta',
          'Ejecutar git start dentro de la carpeta',
          'Crear la carpeta .git manualmente y configurarla',
        ],
        respuestaCorrecta: 'Entrar en la carpeta y ejecutar git init',
        explicacion: 'Primero navega con cd mi-proyecto y después ejecuta git init. Git inicializa el repositorio en el directorio de trabajo actual.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Seguimiento de archivos: git add',
    descripcion: 'Descubre el área de staging y cómo preparar cambios para el próximo commit usando git add.',
    xpRecompensa: 50,
    orden: 3,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué hace el área de staging (índice) en Git?',
        opciones: [
          'Guarda temporalmente los cambios que quieres incluir en el próximo commit',
          'Publica los cambios directamente en GitHub',
          'Borra los archivos que no quieres versionar',
          'Comprime el proyecto para ahorrar espacio en disco',
        ],
        respuestaCorrecta: 'Guarda temporalmente los cambios que quieres incluir en el próximo commit',
        explicacion: 'El staging area (o índice) es como un "borrador" del commit. Solo los cambios en staging se incluirán en el próximo git commit.',
        orden: 1,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para añadir TODOS los archivos modificados del proyecto al área de staging.',
        opciones: [],
        respuestaCorrecta: 'git add .',
        explicacion: 'git add . añade todos los archivos nuevos y modificados del directorio actual. También puedes usar git add -A para incluir también los archivos eliminados.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuál es la diferencia entre git add index.html y git add .?',
        opciones: [
          'El primero añade solo index.html, el segundo añade todos los cambios del directorio actual',
          'No hay diferencia, ambos hacen exactamente lo mismo',
          'El primero crea un commit automáticamente, el segundo no',
          'git add . es un error de sintaxis en Git',
        ],
        respuestaCorrecta: 'El primero añade solo index.html, el segundo añade todos los cambios del directorio actual',
        explicacion: 'Con git add puedes seleccionar archivos concretos para staging. Esto te permite crear commits más pequeños y descriptivos.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Guardar cambios: git commit',
    descripcion: 'Aprende a crear commits con mensajes descriptivos y entiende por qué un buen historial de commits importa.',
    xpRecompensa: 60,
    orden: 4,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué guarda permanentemente un commit en Git?',
        opciones: [
          'Una instantánea del estado de los archivos en staging en ese momento',
          'Solo los archivos que han cambiado desde el último commit',
          'Una copia comprimida de todo el disco duro',
          'Los cambios pendientes de subir a GitHub',
        ],
        respuestaCorrecta: 'Una instantánea del estado de los archivos en staging en ese momento',
        explicacion: 'Cada commit es una fotografía del proyecto. Git almacena el estado completo de todos los archivos que estaban en staging, junto al autor, fecha y mensaje.',
        orden: 1,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para crear un commit con el mensaje "Añadir página de inicio".',
        opciones: [],
        respuestaCorrecta: 'git commit -m "Añadir página de inicio"',
        explicacion: 'La opción -m permite escribir el mensaje del commit directamente en la línea de comandos. Sin -m, Git abre el editor de texto configurado.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuál de estos mensajes de commit es más útil para el equipo?',
        opciones: [
          'Corregir error de validación en el formulario de registro',
          'cambios',
          'arreglado',
          'wip',
        ],
        respuestaCorrecta: 'Corregir error de validación en el formulario de registro',
        explicacion: 'Un buen mensaje de commit describe QUÉ se cambió y POR QUÉ. Mensajes como "cambios" o "wip" no aportan información útil cuando revisas el historial meses después.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Subir cambios: git push',
    descripcion: 'Aprende a publicar tus commits locales en un repositorio remoto como GitHub usando git push.',
    xpRecompensa: 60,
    orden: 5,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué hace git push?',
        opciones: [
          'Sube los commits locales al repositorio remoto',
          'Descarga los últimos cambios del repositorio remoto',
          'Crea un nuevo repositorio en GitHub',
          'Fusiona dos ramas del proyecto',
        ],
        respuestaCorrecta: 'Sube los commits locales al repositorio remoto',
        explicacion: 'git push envía los commits que tienes en local pero que aún no están en el remoto. Es el paso final para compartir tu trabajo con el equipo.',
        orden: 1,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para subir la rama "main" al remoto llamado "origin".',
        opciones: [],
        respuestaCorrecta: 'git push origin main',
        explicacion: 'El formato es: git push <remoto> <rama>. "origin" es el nombre por defecto del repositorio remoto y "main" es el nombre de la rama principal.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: 'Antes de hacer git push, ¿qué debes haber hecho?',
        opciones: [
          'Haber creado commits con los cambios que quieres subir',
          'Haber iniciado sesión en GitHub desde el navegador',
          'Haber descargado todos los cambios remotos primero',
          'Haber eliminado los archivos temporales del proyecto',
        ],
        respuestaCorrecta: 'Haber creado commits con los cambios que quieres subir',
        explicacion: 'git push solo envía commits. Si tus cambios no están commiteados, no se subirán. El flujo habitual es: git add → git commit → git push.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Actualizar tu copia: git pull',
    descripcion: 'Aprende a descargar y fusionar los cambios del repositorio remoto en tu copia local con git pull.',
    xpRecompensa: 60,
    orden: 6,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué hace git pull?',
        opciones: [
          'Descarga los commits remotos y los fusiona con tu rama local',
          'Sube tus commits locales al repositorio remoto',
          'Crea una copia del repositorio en una nueva carpeta',
          'Revierte todos los cambios no commiteados',
        ],
        respuestaCorrecta: 'Descarga los commits remotos y los fusiona con tu rama local',
        explicacion: 'git pull es la combinación de git fetch (descarga) + git merge (fusión). Actualiza tu rama local con los últimos cambios del remoto.',
        orden: 1,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: 'Trabajas en equipo y un compañero hizo push de nuevos commits. ¿Qué comando ejecutas antes de empezar a trabajar?',
        opciones: [
          'git pull',
          'git push',
          'git init',
          'git reset',
        ],
        respuestaCorrecta: 'git pull',
        explicacion: 'Siempre haz git pull al empezar tu jornada de trabajo para tener los últimos cambios del equipo. Así evitas conflictos innecesarios.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuál es la diferencia entre git pull y git fetch?',
        opciones: [
          'git fetch solo descarga, git pull descarga y fusiona automáticamente',
          'git fetch es más rápido porque no descarga archivos grandes',
          'git pull es para ramas locales, git fetch es para ramas remotas',
          'No hay diferencia, son alias del mismo comando',
        ],
        respuestaCorrecta: 'git fetch solo descarga, git pull descarga y fusiona automáticamente',
        explicacion: 'Con git fetch ves los cambios remotos sin aplicarlos. Con git pull los aplicas directamente. git fetch es útil para revisar cambios antes de integrarlos.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Ignorar archivos: .gitignore',
    descripcion: 'Aprende a excluir archivos y carpetas del control de versiones usando el archivo .gitignore.',
    xpRecompensa: 50,
    orden: 7,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Para qué sirve el archivo .gitignore?',
        opciones: [
          'Decirle a Git qué archivos y carpetas debe ignorar y no versionar',
          'Listar los colaboradores del repositorio',
          'Configurar el servidor remoto de GitHub',
          'Establecer los permisos de lectura y escritura del repositorio',
        ],
        respuestaCorrecta: 'Decirle a Git qué archivos y carpetas debe ignorar y no versionar',
        explicacion: '.gitignore contiene patrones de nombres de archivo. Git ignora cualquier archivo que coincida con esos patrones, como node_modules/, .env o archivos .log.',
        orden: 1,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuál de estos archivos es MÁS importante incluir en .gitignore?',
        opciones: [
          '.env (variables de entorno con contraseñas y claves API)',
          'index.html (la página principal del proyecto)',
          'README.md (la documentación del proyecto)',
          'package.json (la configuración de dependencias)',
        ],
        respuestaCorrecta: '.env (variables de entorno con contraseñas y claves API)',
        explicacion: 'Nunca versiones archivos .env con credenciales. Si subes una clave API a GitHub, cualquiera puede verla. Los otros archivos sí deben versionarse.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el patrón que ignoraría la carpeta "node_modules" y todos su contenido en .gitignore.',
        opciones: [],
        respuestaCorrecta: 'node_modules/',
        explicacion: 'El "/" al final indica que es una carpeta. node_modules/ puede contener miles de archivos; siempre se ignora y se regenera con npm install.',
        orden: 3,
      },
    ],
  },
];

const INTERMEDIO_SEED: LeccionSeed[] = [
  {
    titulo: 'Crear y cambiar ramas',
    descripcion: 'Aprende qué son las ramas Git, cómo crearlas y cómo moverte entre ellas para desarrollar en paralelo.',
    xpRecompensa: 50,
    orden: 1,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuál es la ventaja principal de trabajar con ramas en Git?',
        opciones: [
          'Desarrollar funcionalidades en paralelo sin afectar la rama principal',
          'Acelerar la conexión con el repositorio remoto',
          'Reducir el tamaño de los commits automáticamente',
          'Sincronizar cambios con otros desarrolladores en tiempo real',
        ],
        respuestaCorrecta: 'Desarrollar funcionalidades en paralelo sin afectar la rama principal',
        explicacion: 'Las ramas permiten aislar el trabajo: puedes crear una rama para una funcionalidad, hacer commits, y fusionarla a main solo cuando esté lista.',
        orden: 1,
      },
      {
        tipo: 'arrastrarSoltar' as const,
        enunciado: 'Ordena los pasos para crear la rama "feature/login" y hacer tu primer commit en ella:',
        opciones: ['git add .', 'git branch feature/login', 'git commit -m "Add login"', 'git checkout feature/login'],
        respuestaCorrecta: ['git branch feature/login', 'git checkout feature/login', 'git add .', 'git commit -m "Add login"'],
        explicacion: 'Primero creas la rama con git branch, luego cambias a ella con git checkout. Después trabajas con normalidad: git add y git commit.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para crear la rama "hotfix" y cambiar a ella en un solo paso.',
        opciones: [],
        respuestaCorrecta: 'git checkout -b hotfix',
        explicacion: 'git checkout -b crea la nueva rama y cambia a ella de inmediato. Es equivalente a ejecutar git branch + git checkout por separado.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Fusionar ramas: git merge',
    descripcion: 'Combina el trabajo de distintas ramas con git merge y entiende cuándo Git crea un merge commit o hace fast-forward.',
    xpRecompensa: 60,
    orden: 2,
    ejercicios: [
      {
        tipo: 'emparejar' as const,
        enunciado: 'Conecta cada término de git merge con su significado:',
        opciones: ['fast-forward', 'merge commit', 'rama origen'],
        respuestaCorrecta: [
          'fast-forward||Integra commits avanzando el puntero sin crear un commit extra',
          'merge commit||Commit especial con dos padres que une dos historiales divergentes',
          'rama origen||La rama cuyos cambios quieres incorporar en la rama actual',
        ],
        explicacion: 'Si main no tiene commits nuevos desde que creaste la rama, Git hace fast-forward. Si los historiales divergieron, crea un merge commit.',
        orden: 1,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: 'Estás en la rama "main". ¿Qué comando fusiona los cambios de "feature/login" en main?',
        opciones: [
          'git merge feature/login',
          'git merge main feature/login',
          'git push feature/login main',
          'git checkout feature/login main',
        ],
        respuestaCorrecta: 'git merge feature/login',
        explicacion: 'git merge se ejecuta desde la rama destino (main) e indica la rama origen cuyos cambios quieres incorporar.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para fusionar la rama "develop" en tu rama actual.',
        opciones: [],
        respuestaCorrecta: 'git merge develop',
        explicacion: 'git merge <rama> integra los commits de <rama> en la rama donde estás. Asegúrate de estar en la rama destino antes de ejecutarlo.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Resolver conflictos de fusión',
    descripcion: 'Aprende qué son los conflictos de fusión, por qué ocurren y cómo resolverlos paso a paso.',
    xpRecompensa: 70,
    orden: 3,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Cuándo produce Git un conflicto de fusión?',
        opciones: [
          'Cuando dos ramas modificaron las mismas líneas de un mismo archivo',
          'Cuando una rama tiene más commits que la otra',
          'Cuando el repositorio no está conectado a internet',
          'Cuando el nombre de las ramas contiene caracteres especiales',
        ],
        respuestaCorrecta: 'Cuando dos ramas modificaron las mismas líneas de un mismo archivo',
        explicacion: 'Git puede fusionar automáticamente cambios en distintas zonas del archivo. El conflicto aparece cuando ambas ramas tocaron exactamente las mismas líneas.',
        orden: 1,
      },
      {
        tipo: 'arrastrarSoltar' as const,
        enunciado: 'Ordena los pasos para resolver un conflicto de fusión:',
        opciones: ['Ejecutar git commit para finalizar el merge', 'Editar el archivo y eliminar los marcadores', 'Ejecutar git merge y ver el conflicto', 'Ejecutar git add con el archivo resuelto'],
        respuestaCorrecta: ['Ejecutar git merge y ver el conflicto', 'Editar el archivo y eliminar los marcadores', 'Ejecutar git add con el archivo resuelto', 'Ejecutar git commit para finalizar el merge'],
        explicacion: 'Después de resolver los marcadores <<<<<<, ======= y >>>>>>>, añades el archivo con git add y completas el merge con git commit.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Tras resolver un conflicto manualmente, ¿qué comando marca el archivo como resuelto en Git?',
        opciones: [],
        respuestaCorrecta: 'git add',
        explicacion: 'git add le dice a Git que has resuelto el conflicto en ese archivo y está listo para el commit de merge.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Explorar el historial: git log',
    descripcion: 'Aprende a leer el historial de commits, filtrar resultados y visualizar el árbol de ramas con git log.',
    xpRecompensa: 50,
    orden: 4,
    ejercicios: [
      {
        tipo: 'emparejar' as const,
        enunciado: 'Conecta cada opción de git log con lo que hace:',
        opciones: ['--oneline', '--graph', '--author'],
        respuestaCorrecta: [
          '--oneline||Muestra cada commit en una línea con su hash abreviado',
          '--graph||Dibuja el árbol de ramas y merges en la terminal',
          '--author||Filtra los commits por nombre o email del autor',
        ],
        explicacion: 'Combinar --oneline --graph ofrece una vista compacta y visual del historial, muy útil para entender la estructura de ramas.',
        orden: 1,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué muestra git log por defecto?',
        opciones: [
          'El historial de commits con hash, autor, fecha y mensaje de cada uno',
          'Solo los archivos modificados en el último commit',
          'Los commits pendientes de subir al repositorio remoto',
          'Las ramas activas ordenadas por fecha de creación',
        ],
        respuestaCorrecta: 'El historial de commits con hash, autor, fecha y mensaje de cada uno',
        explicacion: 'git log sin opciones muestra los commits en orden cronológico inverso (más reciente primero), con hash completo, autor, fecha y mensaje.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para ver el historial de forma compacta con el árbol de ramas en texto.',
        opciones: [],
        respuestaCorrecta: 'git log --oneline --graph',
        explicacion: '--oneline comprime cada commit en una línea y --graph añade el árbol visual. Juntos son la forma habitual de explorar el historial.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Guardar trabajo temporal: git stash',
    descripcion: 'Guarda cambios sin commitear con git stash para poder cambiar de contexto y recuperarlos después.',
    xpRecompensa: 60,
    orden: 5,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Para qué se usa git stash?',
        opciones: [
          'Guardar temporalmente cambios sin hacer commit y dejar el directorio limpio',
          'Eliminar permanentemente los cambios no deseados',
          'Comprimir el repositorio para ahorrar espacio en disco',
          'Crear una rama automáticamente a partir de los cambios actuales',
        ],
        respuestaCorrecta: 'Guardar temporalmente cambios sin hacer commit y dejar el directorio limpio',
        explicacion: 'git stash aparta tus cambios en una pila temporal. Tu directorio vuelve al estado del último commit, permitiéndote cambiar de rama sin hacer un commit a medias.',
        orden: 1,
      },
      {
        tipo: 'arrastrarSoltar' as const,
        enunciado: 'Ordena los pasos para guardar tu trabajo en stash, atender una urgencia en main y luego recuperarlo:',
        opciones: ['git stash pop', 'git checkout main', 'git stash', 'git checkout feature'],
        respuestaCorrecta: ['git stash', 'git checkout main', 'git checkout feature', 'git stash pop'],
        explicacion: 'Guardas con git stash, cambias a main para atender la urgencia, vuelves a tu rama feature y recuperas los cambios con git stash pop.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe el comando para recuperar el último stash guardado y eliminarlo de la pila.',
        opciones: [],
        respuestaCorrecta: 'git stash pop',
        explicacion: 'git stash pop aplica el stash más reciente y lo borra de la pila. Si quieres mantenerlo, usa git stash apply en su lugar.',
        orden: 3,
      },
    ],
  },
];

const EXPERTO_SEED: LeccionSeed[] = [
  {
    titulo: '¿Qué es GitHub Actions?',
    descripcion: 'Descubre qué es GitHub Actions, para qué sirve y cuáles son sus componentes principales.',
    xpRecompensa: 60,
    orden: 1,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué es GitHub Actions?',
        opciones: [
          'Una plataforma de CI/CD integrada en GitHub para automatizar workflows',
          'Un editor de código online integrado en GitHub',
          'Una alternativa a Git que solo funciona desde la web',
          'Un repositorio público de plantillas de README',
        ],
        respuestaCorrecta: 'Una plataforma de CI/CD integrada en GitHub para automatizar workflows',
        explicacion: 'GitHub Actions permite automatizar tareas (tests, builds, despliegues) que se disparan ante eventos del repositorio (push, PR, schedule, etc.).',
        orden: 1,
      },
      {
        tipo: 'emparejar' as const,
        enunciado: 'Conecta cada componente de GitHub Actions con su definición:',
        opciones: ['workflow', 'job', 'step', 'runner'],
        respuestaCorrecta: [
          'workflow||Conjunto de jobs definido en un fichero YAML que se dispara ante un evento',
          'job||Conjunto de steps que se ejecutan en el mismo runner',
          'step||Unidad mínima de ejecución dentro de un job (un comando o una action)',
          'runner||Servidor que ejecuta los jobs (ubuntu-latest, windows, macOS)',
        ],
        explicacion: 'Un workflow contiene jobs; cada job contiene steps; cada step se ejecuta en un runner (máquina virtual gestionada por GitHub o self-hosted).',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Dónde se guardan los workflows en un repositorio?',
        opciones: [
          '.github/workflows/*.yml',
          '.git/workflows/*.yml',
          'workflows/*.yml en la raíz del repo',
          'actions/*.yml',
        ],
        respuestaCorrecta: '.github/workflows/*.yml',
        explicacion: 'GitHub busca automáticamente los workflows en la carpeta .github/workflows/ del repositorio. Cada fichero .yml o .yaml es un workflow distinto.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Estructura de un workflow YAML',
    descripcion: 'Aprende la sintaxis básica de un workflow: name, on, jobs, steps y errores típicos de YAML.',
    xpRecompensa: 70,
    orden: 2,
    ejercicios: [
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe la ruta relativa de la carpeta donde GitHub busca los workflows.',
        opciones: [],
        respuestaCorrecta: '.github/workflows',
        explicacion: 'GitHub Actions detecta automáticamente cualquier fichero .yml o .yaml dentro de .github/workflows/ del repositorio.',
        orden: 1,
      },
      {
        tipo: 'detectarError' as const,
        enunciado: 'Identifica la línea con error de sintaxis YAML en este workflow:',
        opciones: [
          'name: CI',
          'on: push',
          'jobs:',
          '  build:',
          '    runs-on ubuntu-latest',
          '    steps:',
          '      - uses: actions/checkout@v4',
          '      - run: npm test',
        ],
        respuestaCorrecta: ['4'],
        explicacion: 'En YAML los pares clave-valor llevan ":". La línea correcta es "    runs-on: ubuntu-latest" — faltan los dos puntos tras runs-on.',
        orden: 2,
      },
      {
        tipo: 'construirComando' as const,
        enunciado: 'Construye el comando shell que un step ejecutaría para correr los tests con npm.',
        opciones: ['npm', 'test', 'install', 'run', 'ci', 'pip', 'yarn', 'build'],
        respuestaCorrecta: ['npm', 'test'],
        explicacion: 'En un step de GitHub Actions se ejecuta con "run: npm test". El comando shell por sí solo es "npm test".',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Triggers y eventos',
    descripcion: 'Aprende a disparar workflows con push, pull_request, schedule y workflow_dispatch.',
    xpRecompensa: 70,
    orden: 3,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué evento dispara un workflow al subir commits a una rama?',
        opciones: ['push', 'commit', 'merge', 'update'],
        respuestaCorrecta: 'push',
        explicacion: 'El evento "push" dispara el workflow cada vez que se sube uno o más commits al repositorio. Puedes filtrarlo por ramas o paths.',
        orden: 1,
      },
      {
        tipo: 'emparejar' as const,
        enunciado: 'Conecta cada trigger con su comportamiento:',
        opciones: ['push', 'pull_request', 'schedule', 'workflow_dispatch'],
        respuestaCorrecta: [
          'push||Se ejecuta al subir commits a una rama',
          'pull_request||Se ejecuta al abrir o actualizar una pull request',
          'schedule||Se ejecuta en intervalos programados con sintaxis cron',
          'workflow_dispatch||Permite lanzar el workflow manualmente desde la UI de GitHub',
        ],
        explicacion: 'Los triggers más usados: push y pull_request para CI; schedule para tareas periódicas (limpieza, dependabot); workflow_dispatch para despliegues manuales.',
        orden: 2,
      },
      {
        tipo: 'rellenarHuecos' as const,
        enunciado: 'Escribe la palabra clave de YAML que define qué eventos disparan un workflow.',
        opciones: [],
        respuestaCorrecta: 'on',
        explicacion: 'La clave "on:" enumera los eventos que disparan el workflow. Puede ser un string ("on: push"), una lista, o un objeto con filtros.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Jobs y steps',
    descripcion: 'Domina cómo se organizan los jobs en paralelo y secuencial, y cómo se construyen los steps.',
    xpRecompensa: 80,
    orden: 4,
    ejercicios: [
      {
        tipo: 'opcionMultiple' as const,
        enunciado: 'Si un workflow tiene 2 jobs sin dependencias entre ellos, ¿cómo se ejecutan por defecto?',
        opciones: [
          'En paralelo, cada uno en su propio runner',
          'En serie, en el orden declarado',
          'Solo se ejecuta el primero',
          'Aleatoriamente',
        ],
        respuestaCorrecta: 'En paralelo, cada uno en su propio runner',
        explicacion: 'Por defecto los jobs se ejecutan en paralelo. Para forzar orden, usa "needs: <otro_job>" para crear dependencias.',
        orden: 1,
      },
      {
        tipo: 'construirComando' as const,
        enunciado: 'Construye un step que use la action oficial de checkout v4 (formato "uses").',
        opciones: ['uses:', 'actions/checkout@v4', 'run:', 'name:', 'shell:', 'actions/setup-node@v4', 'with:'],
        respuestaCorrecta: ['uses:', 'actions/checkout@v4'],
        explicacion: 'Un step con "uses: actions/checkout@v4" descarga el código del repo dentro del runner. Es el primer step en casi todos los jobs de CI.',
        orden: 2,
      },
      {
        tipo: 'arrastrarSoltar' as const,
        enunciado: 'Ordena los pasos típicos de un job de CI de Node.js:',
        opciones: [
          'Hacer checkout del código',
          'Instalar dependencias',
          'Configurar la versión de Node.js',
          'Ejecutar los tests',
        ],
        respuestaCorrecta: [
          'Hacer checkout del código',
          'Configurar la versión de Node.js',
          'Instalar dependencias',
          'Ejecutar los tests',
        ],
        explicacion: 'Primero el checkout, luego setup-node (define la versión), después npm ci/install, y finalmente npm test. El orden importa: las dependencias necesitan Node configurado.',
        orden: 3,
      },
    ],
  },
  {
    titulo: 'Pipeline CI/CD completo',
    descripcion: 'Une todo: dependencias entre jobs, despliegue tras tests y errores comunes en pipelines reales.',
    xpRecompensa: 90,
    orden: 5,
    ejercicios: [
      {
        tipo: 'detectarError' as const,
        enunciado: 'Este pipeline tiene 2 errores. Identifica las líneas que están mal:',
        opciones: [
          'name: Deploy',
          'on:',
          '  push:',
          '    branches: [main]',
          'jobs:',
          '  test:',
          '    runs-on: ubuntu-latest',
          '    steps:',
          '      - uses: actions/checkout@v4',
          '      - run: npm test',
          '  deploy:',
          '    needs: tests',
          '    runs-on: ubuntu-latest',
          '    steps:',
          '      - uses actions/checkout@v4',
          '      - run: npm run deploy',
        ],
        respuestaCorrecta: ['11', '14'],
        explicacion: 'Línea 12 (índice 11): "needs: tests" debería ser "needs: test" — el job se llama "test", no "tests". Línea 15 (índice 14): falta los dos puntos en "uses actions/checkout@v4" — debe ser "uses: actions/checkout@v4".',
        orden: 1,
      },
      {
        tipo: 'construirComando' as const,
        enunciado: 'Construye la línea YAML que hace que un job dependa del job llamado "test".',
        opciones: ['needs:', 'test', 'depends:', 'on:', 'after:', 'requires:', 'tests'],
        respuestaCorrecta: ['needs:', 'test'],
        explicacion: 'En GitHub Actions la palabra clave es "needs:" seguida del nombre del job (o lista de nombres). El job actual no se ejecuta hasta que los listados terminen con éxito.',
        orden: 2,
      },
      {
        tipo: 'opcionMultiple' as const,
        enunciado: '¿Qué ocurre cuando un job tiene "needs: build" y el job "build" falla?',
        opciones: [
          'El job actual no se ejecuta — se marca como skipped',
          'El job actual se ejecuta igualmente',
          'El job actual reintenta automáticamente el job "build"',
          'GitHub elimina el workflow del repositorio',
        ],
        respuestaCorrecta: 'El job actual no se ejecuta — se marca como skipped',
        explicacion: 'Por defecto "needs" implica éxito. Si quieres ejecutar incluso ante fallo, usa "if: always()" o "if: failure()" según el caso.',
        orden: 3,
      },
    ],
  },
];

// ── Insignias seed ────────────────────────────────────────────────────────────

interface InsigniaSeed {
  nombre: string;
  descripcion: string;
  icono: string;
  condicion: BadgeCondition;
}

const INSIGNIAS_SEED: InsigniaSeed[] = [
  { nombre: 'Primer paso',        descripcion: 'Completa tu primera lección',                          icono: 'shield-check',     condicion: 'primera_leccion' },
  { nombre: 'Maestro Básico',     descripcion: 'Completa todas las lecciones del nivel básico',          icono: 'book-open',        condicion: 'nivel_basico' },
  { nombre: 'Maestro Intermedio', descripcion: 'Completa todas las lecciones del nivel intermedio',      icono: 'git-branch',       condicion: 'nivel_intermedio' },
  { nombre: 'Maestro Experto',    descripcion: 'Completa todas las lecciones del nivel experto',         icono: 'star',             condicion: 'nivel_experto' },
  { nombre: 'Constancia',         descripcion: 'Mantén una racha de 7 días seguidos',                  icono: 'flame',            condicion: 'racha_7' },
  { nombre: 'Imparable',          descripcion: 'Mantén una racha de 30 días seguidos',                 icono: 'zap',              condicion: 'racha_30' },
  { nombre: 'Sensei Git',         descripcion: 'Completa todas las lecciones de GitLearn',               icono: 'trophy',           condicion: 'todas_lecciones' },
];

async function seedInsignias(): Promise<void> {
  console.log('\n── INSIGNIAS ──');
  let creadas = 0;
  for (const ins of INSIGNIAS_SEED) {
    const existing = await Insignia.findOne({ condicion: ins.condicion }).lean();
    if (existing) {
      console.log(`  ⟳ Ya existe: "${ins.nombre}" — saltando`);
      continue;
    }
    await Insignia.create(ins);
    console.log(`  ✓ Insignia: "${ins.nombre}" (${ins.condicion})`);
    creadas++;
  }
  console.log(`✓ Insignias creadas: ${creadas}`);
}

// ── Seed runner ───────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  await mongoose.connect(environment.mongodbUri);
  console.log('✓ MongoDB connected');

  await seedInsignias();

  // Find a profesor/admin to use as author
  const autor = await Usuario.findOne({ rol: { $in: ['profesor', 'administrador'] } }).lean();
  if (!autor) {
    console.error('✗ No hay ningún usuario con rol "profesor" o "administrador". Crea uno primero.');
    process.exit(1);
  }
  console.log(`✓ Usando autor: ${autor.nombre} (${autor.rol})`);

  let leccionesCreadas = 0;
  let ejerciciosCreados = 0;

  const batches: Array<{ nivel: string; data: LeccionSeed[] }> = [
    { nivel: 'básico', data: BASICO_SEED },
    { nivel: 'intermedio', data: INTERMEDIO_SEED },
    { nivel: 'experto', data: EXPERTO_SEED },
  ];

  for (const { nivel, data } of batches) {
    console.log(`\n── ${nivel.toUpperCase()} ──`);
    for (const lesson of data) {
      const existing = await Leccion.findOne({ titulo: lesson.titulo, nivel }).lean();
      if (existing) {
        console.log(`  ⟳ Ya existe: "${lesson.titulo}" — saltando`);
        continue;
      }

      const leccion = await Leccion.create({
        titulo: lesson.titulo,
        descripcion: lesson.descripcion,
        nivel,
        estado: 'publicada',
        autorId: autor._id,
        xpRecompensa: lesson.xpRecompensa,
        orden: lesson.orden,
      });
      leccionesCreadas++;

      for (const ej of lesson.ejercicios) {
        await Ejercicio.create({
          leccionId: leccion._id,
          tipo: ej.tipo,
          enunciado: ej.enunciado,
          opciones: ej.opciones,
          respuestaCorrecta: ej.respuestaCorrecta,
          explicacion: ej.explicacion,
          orden: ej.orden,
        });
        ejerciciosCreados++;
      }

      console.log(`  ✓ Lección ${lesson.orden}: "${lesson.titulo}" (${lesson.ejercicios.length} ejercicios)`);
    }
  }

  console.log(`\n✓ Seed completado: ${leccionesCreadas} lecciones, ${ejerciciosCreados} ejercicios creados`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('✗ Error en seed:', err);
  process.exit(1);
});
