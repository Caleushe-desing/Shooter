/* Puntos genéricos: sirven para lo que se quiera inspeccionar */
window.MEC_TEMPLATES = [
  {
    id: "libre",
    name: "Inspección",
    group: "General",
    hint: "Úsalo para lo que quieras: un equipo, un lugar, una herramienta u otra cosa.",
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
  }
];

window.MEC_VERDICTS = [
  { id: "apto", name: "Apto", hint: "Se puede usar." },
  { id: "observado", name: "Apto con observaciones", hint: "Usar con las notas anotadas." },
  { id: "rechazado", name: "No apto", hint: "No usar hasta corregir." }
];
