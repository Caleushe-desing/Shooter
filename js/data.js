/* Plantillas de inspección + un check libre */
window.MEC_TEMPLATES = [
  {
    id: "libre",
    name: "Otro / lo que quieras",
    group: "General",
    hint: "Check libre: cambia los puntos y úsalo para cualquier cosa.",
    items: [
      "Identificación o nombre visible",
      "Estado general (sin daños evidentes)",
      "Limpieza",
      "Piezas, partes o accesorios completos",
      "Funciona o se puede usar bien",
      "Elementos de seguridad en su lugar (si aplica)",
      "Sin fallas, fugas, ruidos o condiciones anormales",
      "El lugar de uso está despejado y es seguro",
      "Hay instrucciones o datos necesarios (si aplica)",
      "Queda listo para usar"
    ]
  },
  {
    id: "escalera-tijera",
    name: "Escalera tijera",
    group: "Altura",
    hint: "Inspección visual y funcional antes de cada uso.",
    items: [
      "Identificación y capacidad de carga visibles",
      "Largueros sin fisuras, abolladuras ni corrosión",
      "Peldaños completos, firmes y antideslizantes",
      "Zapatas / tacos de goma en buen estado",
      "Spreader o traba de apertura funciona y queda bloqueado",
      "Bisagras y remaches sin holgura excesiva",
      "Sin reparaciones improvisadas (alambre, cinta, soldadura casera)",
      "Limpia de grasa, aceite o barro que cause resbalón",
      "Largo adecuado: no se usará el último peldaño como plataforma",
      "Está sobre superficie firme y nivelada"
    ]
  },
  {
    id: "escalera-extensible",
    name: "Escalera extensible / de apoyo",
    group: "Altura",
    hint: "Ángulo 4:1, 3 peldaños sobre el punto de apoyo.",
    items: [
      "Identificación y largo nominal visibles",
      "Largueros rectos, sin grietas ni deformación",
      "Peldaños y ensambles en buen estado",
      "Zapatas antideslizantes presentes y firmes",
      "Cuerda, polea y trava de extensión operan",
      "Ganchos / garras de techo (si aplica) sin desgaste crítico",
      "Trabas de sección superior enganchan en ambos lados",
      "Sin peldaños flojos ni faltantes",
      "Superficie de apoyo estable; se amarrará en la parte superior",
      "No hay líneas eléctricas en la trayectoria"
    ]
  },
  {
    id: "alza-hombre",
    name: "Alza hombre / brazo articulado",
    group: "Altura",
    hint: "Solo personal autorizado. Arnés obligatorio en canastillo.",
    items: [
      "Operador con autorización vigente para este equipo",
      "Manual, carga máxima y número de equipo visibles",
      "Estructura, pasadores y soldaduras sin fisuras visibles",
      "Sin fugas de aceite en cilindros, mangueras o uniones",
      "Neumáticos / orugas con presión y sin cortes graves",
      "Controles de canastillo y de base responden",
      "Paro de emergencia (canastillo y base) corta el movimiento",
      "Alarma de descenso / movimiento funciona",
      "Barandas, puerta o cadena de acceso cierran bien",
      "Punto de anclaje del arnés en buen estado",
      "Sensor de inclinación / nivelación operativo",
      "Batería o combustible suficiente para el trabajo",
      "Área de trabajo despejada; sin líneas eléctricas cercanas",
      "Estabilizadores se despliegan y traban (si el equipo los tiene)"
    ]
  },
  {
    id: "plataforma-tijera",
    name: "Plataforma tijera elevadora",
    group: "Altura",
    hint: "No superar carga ni ocupantes indicados en la placa.",
    items: [
      "Placa de capacidad y cantidad de ocupantes legible",
      "Tijera, pasadores y topes sin fisuras ni holgura anormal",
      "Mangueras y cilindros sin fugas",
      "Piso de plataforma antideslizante y sin huecos",
      "Barandas y puerta de acceso firmes",
      "Controles y paro de emergencia operan",
      "Alarma de descenso funciona",
      "Ruedas, frenos y pothole protection (si aplica) OK",
      "Batería, cables y cargador en buen estado",
      "Área nivelada, sin desniveles ni tapas de cámara inestables"
    ]
  },
  {
    id: "tecle-hidraulico",
    name: "Tecle hidráulico",
    group: "Izaje",
    hint: "Nunca izar personas. No exceder la capacidad.",
    items: [
      "Capacidad de carga (toneladas) visible y legible",
      "Cuerpo y pistón sin fisuras, abolladuras ni fugas",
      "Mangueras, racores y bomba sin filtraciones",
      "Aceite hidráulico en nivel y sin aspecto lechoso",
      "Válvula de retención sostiene la carga de prueba ligera",
      "Gancho con pestillo de seguridad operativo",
      "Cadena o eslinga de izaje en buen estado",
      "Palanca / bomba opera suave, sin saltos",
      "Válvula de alivio no está anulada ni puenteada",
      "Apoyo del tecle estable; no se usará de costado"
    ]
  },
  {
    id: "tecle-cadena",
    name: "Tecle de cadena / polipasto manual",
    group: "Izaje",
    hint: "Revisar eslabones, freno y gancho en cada turno.",
    items: [
      "Placa de capacidad visible",
      "Cadena de carga sin eslabones abiertos, torcidos ni alargados",
      "Cadena de maniobra sin nudos ni desgaste extremo",
      "Gancho superior e inferior con pestillo",
      "Ganchos no están abiertos más de lo permitido (no “boca abierta”)",
      "Freno sostiene la carga; no desliza al soltar",
      "Carcasa y engranajes sin ruidos anómalos ni golpes",
      "Lubricación razonable; sin óxido profundo en la cadena",
      "Tope final de cadena presente",
      "Punto de anclaje / viga capaz para la carga prevista"
    ]
  },
  {
    id: "tecle-electrico",
    name: "Tecle eléctrico / polipasto",
    group: "Izaje",
    hint: "Probar subida, bajada y paro antes de izar.",
    items: [
      "Capacidad y número de serie visibles",
      "Botonera: sube, baja, paro de emergencia",
      "Cable de alimentación y aislación sin cortes",
      "Cadena o cable de izaje sin hilos rotos ni deformación",
      "Gancho con pestillo y giro libre",
      "Freno eléctrico sostiene al cortar comando",
      "Límite de carrera superior funciona",
      "No hay ruidos de caja reductora anómalos",
      "Carro o trolley se desplaza y frena",
      "Puesta a tierra / protección eléctrica aparente"
    ]
  },
  {
    id: "puente-grua",
    name: "Puente grúa / pórtico",
    group: "Izaje",
    hint: "Inspección pre-uso del operador. No reemplaza la inspección certificada.",
    items: [
      "Operador autorizado para este puente",
      "Ruta de izaje despejada; piso libre de personal ajeno",
      "Botonera / radio y paro de emergencia",
      "Alarmas y bocina de movimiento",
      "Gancho, pestillo y bloque inferior",
      "Cable o cadena de izaje sin defectos visibles",
      "Carro y puente se desplazan en ambos sentidos",
      "Límites de carrera y anti-colisión (si existen)",
      "No hay fugas en motor-reductor ni sobrecalentamiento previo",
      "Carga a izar identificada y bajo la capacidad"
    ]
  },
  {
    id: "grua-piso",
    name: "Grúa hidráulica de piso (shop crane)",
    group: "Izaje",
    hint: "Patas extendidas. Carga centrada. Nunca bajo la carga.",
    items: [
      "Capacidad por alcance (placa) legible",
      "Pluma, pasadores y soldaduras sin fisuras",
      "Cilindro y bomba sin fugas",
      "Ruedas y frenos / trabas de rueda",
      "Patas o bases extendidas y firmes",
      "Cadena o gancho de izaje con pestillo",
      "Válvula sostiene; no baja sola",
      "Piso resistente y nivelado",
      "No se usará para izar personas ni para golpear"
    ]
  },
  {
    id: "eslingas",
    name: "Eslingas, estrobos y fajas",
    group: "Izaje",
    hint: "Retirar de servicio ante corte, quemadura o deformación.",
    items: [
      "Identificación de capacidad (ojal / etiqueta) presente",
      "Faja: sin cortes, deshilachado ni quemaduras",
      "Cable: sin hilos rotos, kinks ni aplastamiento",
      "Cadena: sin eslabones alargados, torcidos ni grietas",
      "Ojal, guarda-canto y costuras en buen estado",
      "Ganchos o grilletes compatibles y con seguro",
      "Ángulo de izaje considerado (no aplastar la carga)",
      "Protección de aristas vivas prevista",
      "Almacenada limpia, sin aceite ni nudos permanentes"
    ]
  },
  {
    id: "cadenas-ganchos",
    name: "Cadenas, ganchos y grilletes",
    group: "Izaje",
    hint: "No mezclar grados. Nunca soldar un eslabón.",
    items: [
      "Grado y WLL visibles o identificados",
      "Eslabones sin alargamiento, desgaste ni grietas",
      "Gancho sin abertura excesiva; pestillo OK",
      "Grillete con pasador del tipo correcto (no perno improvisado)",
      "No hay soldaduras ni alambres de “reparación”",
      "Pernos y tuercas apretados, con chaveta si corresponde",
      "Compatible con la eslinga y el punto de izaje",
      "Libre de corrosión profunda"
    ]
  },
  {
    id: "gato-botella",
    name: "Gato hidráulico de botella",
    group: "Hidráulica",
    hint: "Usar torres o soportes. El gato no es un apoyo permanente.",
    items: [
      "Capacidad visible",
      "Pistón y cuerpo sin fugas ni picaduras",
      "Válvula de descarga cierra y abre",
      "Extensión de tornillo (si tiene) en buen estado",
      "Base amplia, sin deformar",
      "Punto de apoyo del vehículo / máquina identificado",
      "Piso firme; no se usará sobre tierra suelta",
      "Torres de sostén disponibles para trabajar bajo carga"
    ]
  },
  {
    id: "gato-carretilla",
    name: "Gato carretilla / cocodrilo",
    group: "Hidráulica",
    hint: "Nunca permanecer bajo el vehículo solo con el gato.",
    items: [
      "Capacidad acorde al vehículo",
      "Ruedas y eje giran; manilla encaja",
      "Sin fugas en el cilindro",
      "Soporte / cuna en buen estado, no resbala",
      "Válvula de bajada controlada, no cae de golpe",
      "Chasis del gato sin soldaduras rotas",
      "Se usarán torres una vez alcanzada la altura"
    ]
  },
  {
    id: "prensa-hidraulica",
    name: "Prensa hidráulica de taller",
    group: "Hidráulica",
    hint: "Usar protección facial. Piezas pueden salir disparadas.",
    items: [
      "Capacidad y estado del manómetro",
      "Mangueras y cilindro sin fugas",
      "Mesa, pasadores y apoyo de pieza firmes",
      "Plato / puntal sin fisuras",
      "Válvula y bomba operan",
      "Protección o pantalla disponible",
      "Área despejada detrás de la prensa",
      "No se prensarán materiales frágiles sin resguardo"
    ]
  },
  {
    id: "andamio",
    name: "Andamio",
    group: "Altura",
    hint: "Montaje según fabricante. Barandas desde 1,8 m.",
    items: [
      "Bases, husillos y placas de apoyo nivelados",
      "Marcos, crucetas y pasadores completos",
      "Plataformas / tablones sin rotura y trabados",
      "Barandas interior, exterior y rodapié",
      "Acceso por escalera interior, no trepar por marcos",
      "Amarres o estabilizadores según altura",
      "No hay sobrecarga de material en la plataforma",
      "Lejos de líneas eléctricas",
      "Ruedas trabadas si es andamio de torre móvil"
    ]
  },
  {
    id: "arnes",
    name: "Arnés y línea de vida",
    group: "Seguridad",
    hint: "Inspección por el usuario antes de cada uso.",
    items: [
      "Etiqueta y fecha de fabricación / vida útil",
      "Cintas sin cortes, deshilachado ni rayos UV extremos",
      "Costuras sin hilos sueltos ni quemaduras",
      "Hebillas, argollas D y ajustadores sin deformar",
      "Argolla dorsal y/o frontal según el trabajo",
      "Cabo de vida y absorbedor sin haber sido activados",
      "Ganchos con seguro doble y cierre completo",
      "Punto de anclaje certificado identificado",
      "Arnés ajusta: no queda suelto ni tira el cuello"
    ]
  },
  {
    id: "compresor",
    name: "Compresor de aire",
    group: "Taller",
    hint: "Drenar condensado. Nunca superar la presión de trabajo.",
    items: [
      "Manómetro de estanque y de línea legibles",
      "Válvula de seguridad no está precintada de más ni anulada",
      "Estanque sin corrosión profunda ni golpes graves",
      "Drenaje de condensado opera (se drena al inicio)",
      "Correas, guardas y anclaje del equipo",
      "Mangueras y acoples sin grietas; acople de seguridad",
      "No hay fugas audibles graves",
      "Área ventilada; no encerrar el equipo",
      "Aceite del compresor (si no es oil-free) en nivel"
    ]
  },
  {
    id: "esmeril-angular",
    name: "Esmeril angular / amoladora",
    group: "Taller",
    hint: "Disco correcto. Guarda puesta. Cara y oídos protegidos.",
    items: [
      "Carcasa, interruptor y cable sin daños",
      "Guarda / protector de disco instalado",
      "Disco para el material y RPM ≥ las de la máquina",
      "Disco sin vencimiento, grietas ni humedad",
      "Bridas y tuerca correctas, disco asienta bien",
      "Empuñadura auxiliar colocada",
      "Prueba en vacío: sin vibración excesiva",
      "EPP: cara, ojos, oídos y guantes adecuados",
      "Chispas no apuntan a personas ni a combustibles"
    ]
  },
  {
    id: "esmeril-banco",
    name: "Esmeril de banco",
    group: "Taller",
    hint: "Apoyapieza a ≤ 3 mm de la piedra. Nunca piedra de costado.",
    items: [
      "Fijación al banco firme",
      "Guardas laterales y protectores presentes",
      "Piedras sin grietas (sonido / visual)",
      "Apoyapieza ajustada cerca de la piedra",
      "Visor transparente en buen estado",
      "Piedras no están desgastadas al plato",
      "Interruptor y puesta a tierra",
      "Área limpia de viruta y trapos"
    ]
  },
  {
    id: "soldadora",
    name: "Soldadora (electrodo / MIG / TIG)",
    group: "Taller",
    hint: "Ventilación, pantalla y riesgo de incendio.",
    items: [
      "Cables de poder y masa sin aislación rota",
      "Conectores y pinza / antorcha en buen estado",
      "Puesta a masa cerca del punto de soldadura",
      "Gas (MIG/TIG): regulador, manguera y fugas",
      "Pantalla o careta con filtro adecuado",
      "Ropa de cuero / ignífuga, no ropa sintética",
      "Extintor y vigilancia de incendio previstos",
      "Extracción o ventilación del humo",
      "No hay solventes ni combustibles en el radio de chispa",
      "Área señalizada para terceros"
    ]
  },
  {
    id: "cilindros-gas",
    name: "Cilindros de gas (oxígeno / acetileno / CO2)",
    group: "Taller",
    hint: "Oxígeno lejos de grasas. Acetileno vertical.",
    items: [
      "Cilindros de pie, encadenados o en carro",
      "Capuchones puestos cuando no se usa",
      "Reguladores del gas correcto, sin aceite ni grasa",
      "Mangueras sin cortes; retroceso / válvulas check (oxiacetileno)",
      "Identificación de gas por color / etiqueta",
      "Vencimiento de prueba hidrostática no superado",
      "Válvulas cierran; no hay fugas con agua jabonosa",
      "Oxígeno separado de combustibles",
      "Área ventilada, lejos de arcos y llamas abiertas"
    ]
  },
  {
    id: "extintor",
    name: "Extintor",
    group: "Seguridad",
    hint: "Uno por zona de riesgo. Acceso libre.",
    items: [
      "Acceso libre; no está tapado ni en el suelo",
      "Precinto y pasador de seguridad presentes",
      "Manómetro en zona verde (si es presurizado)",
      "Tipo (ABC / CO2 / acetato) acorde al riesgo",
      "Manguera, pitón y gatillo sin daños",
      "Etiqueta de última recarga / mantención vigente",
      "Soporte o muro firme; altura razonable",
      "Señalética visible"
    ]
  },
  {
    id: "generador",
    name: "Generador eléctrico",
    group: "Taller",
    hint: "Nunca en recinto cerrado. No retroalimentar el tablero.",
    items: [
      "Exterior, ventilado, lejos de puertas y tomas de aire",
      "Nivel de combustible y de aceite",
      "Estanque y mangueras sin fugas",
      "Escape no apunta a personas ni a ventanas",
      "Conexiones eléctricas secas; no sobrecargar",
      "Puesta a tierra si el fabricante lo exige",
      "Paro de emergencia / llave opera",
      "Extintor cerca",
      "No se conectará a la red de la empresa sin transferencia"
    ]
  },
  {
    id: "taladro-columna",
    name: "Taladro de columna / banco",
    group: "Taller",
    hint: "Pieza amarrada. Pelo recogido. No guantes con broca girando.",
    items: [
      "Fijación al piso o banco",
      "Guarda de mandril / broca (si existe)",
      "Mandril y broca firmes, broca afilada y recta",
      "Prensa o morsa para la pieza disponible",
      "Velocidad acorde al diámetro y material",
      "Interruptor y parada funcionan",
      "Iluminación del punto de trabajo",
      "Viruta se retirará con gancho, no con la mano"
    ]
  },
  {
    id: "herramientas-manuales",
    name: "Herramientas manuales",
    group: "Taller",
    hint: "Carro o maleta del técnico / cuadrilla.",
    items: [
      "Llaves y dados sin grietas ni boca abierta",
      "Alicates y cortes con aislación (si hay riesgo eléctrico)",
      "Martillos: cabeza firme, mango sin astillas",
      "Destornilladores: punta no redondeada, mango intacto",
      "Cinceles sin cabeza de hongo",
      "Torquímetro calibrado / no se usa como palanca",
      "No hay herramientas improvisadas o “hechizas” críticas",
      "Orden: se devuelven al carro; no quedan en alturas"
    ]
  },
  {
    id: "banco-prensa",
    name: "Banco de trabajo y morsa",
    group: "Taller",
    hint: "Superficie firme. Mordazas paralelas.",
    items: [
      "Banco estable, sin balanceo",
      "Morsa anclada, mordazas sin dentado destruido",
      "Husillo de morsa opera",
      "Iluminación suficiente",
      "Tomas eléctricas en buen estado, no sobrecargadas",
      "Sin trampas de viruta ni aceite en el piso del puesto",
      "Protecciones de esmeril o taladro de banco (si están en el mismo puesto)"
    ]
  },
  {
    id: "epp",
    name: "EPP del personal",
    group: "Seguridad",
    hint: "Check diario de la cuadrilla o del ingreso a faena.",
    items: [
      "Casco sin grietas; arnés interno sano",
      "Lentes o pantalla según la tarea",
      "Protección auditiva disponible en zona de ruido",
      "Guantes del tipo correcto (no usar con máquinas rotativas)",
      "Calzado de seguridad con puntera y suela en buen estado",
      "Ropa de trabajo, chaleco o alta visibilidad si hay tránsito",
      "Arnés si hay trabajo en altura",
      "Mascarilla / respirador si hay polvo, humo o solvente"
    ]
  },
  {
    id: "orden-aseo",
    name: "Orden, aseo y patio de taller",
    group: "Seguridad",
    hint: "Inspección de área al inicio de turno.",
    items: [
      "Pisos secos, sin charcos de aceite ni mangueras sueltas",
      "Pasillos y salidas de emergencia libres",
      "Residuos metálicos y trapos con grasa en contenedor",
      "Iluminación general operativa",
      "Extintores y botiquín accesibles",
      "Material no se apila de forma inestable",
      "Pozos, canales y fosos señalizados o tapados",
      "Área de soldadura aislada de combustibles"
    ]
  },
  {
    id: "bloqueo-energi",
    name: "Bloqueo de energías (LOTO)",
    group: "Seguridad",
    hint: "Antes de mantener, desatascar o entrar a un equipo.",
    items: [
      "Equipo identificado y notificado a operación",
      "Se cortó la energía (eléctrica, hidráulica, neumática, gravedad)",
      "Candado y tarjeta personales colocados",
      "Prueba de intento de arranque: no parte",
      "Energías residuales liberadas (presión, condensadores, brazos)",
      "Solo el dueño del candado lo retira",
      "Hay candados de más si interviene más de una persona"
    ]
  },
  {
    id: "camioneta",
    name: "Camioneta / vehículo de servicio",
    group: "Vehículos",
    hint: "Check de salida a terreno.",
    items: [
      "Documentos, seguro y revisión técnica (si aplica)",
      "Luces, frenos, bocina y parabrisas",
      "Neumáticos y rueda de repuesto",
      "Aceite, refrigerante y combustible",
      "Carga y herramientas amarradas en caja / rack",
      "Escalera o tecle de viaje bien sujetos",
      "Botiquín, extintor y triángulos",
      "Conductor con licencia acorde"
    ]
  }
];

window.MEC_VERDICTS = [
  { id: "apto", name: "Apto para uso", hint: "Se puede usar en este turno." },
  { id: "observado", name: "Apto con observaciones", hint: "Usar con restricciones anotadas." },
  { id: "rechazado", name: "No apto / fuera de servicio", hint: "Bloquear y etiquetar. No usar." }
];
