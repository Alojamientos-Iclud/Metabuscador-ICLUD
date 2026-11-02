// Gemini a veces responde 503 ("alta demanda") o 429 (límite). Son fallas pasajeras:
// se reintenta con espera creciente y, si sigue fallando, se prueba el siguiente modelo.
export function esTransitorio(e) {
  return [429, 500, 503, 504].includes(e?.status) || /UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED/i.test(String(e?.message));
}

const pausaReal = (ms) => new Promise((r) => setTimeout(r, ms));

export async function conReintentos(modelos, tarea, { intentos = 3, pausa = pausaReal } = {}) {
  let ultimoError;
  for (const modelo of modelos) {
    for (let n = 1; n <= intentos; n++) {
      try {
        return await tarea(modelo);
      } catch (e) {
        ultimoError = e;
        if (!esTransitorio(e)) throw e; // error real (clave, modelo inexistente, JSON inválido): no se reintenta
        if (n < intentos) await pausa(1000 * 2 ** (n - 1)); // 1 s, 2 s
      }
    }
    console.warn(`Gemini no disponible con el modelo ${modelo}.`);
  }
  throw ultimoError;
}
