// RNF-04: validación de entrada. Lo inválido se rechaza sin llegar a Tavily ni Gemini.
export const SERVICIOS_VALIDOS = ['wifi', 'cocina', 'estacionamiento'];

export const REGLAS ={
  destinoMin: 2,
  destinoMax: 80,
  maxNoches: 30,
  maxAnticipacionDias: 365,
  minHuespedes: 1,
  maxHuespedes: 10,
  precioMinNoche: 10,
  precioMaxNoche: 10_000_000,
}

const hoyAR = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

const RE_DESTINO = /^ [\p{L}\p{N}\s,.'’-]+$/u; // evita meter instrucciones raras en la consulta
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function validarFiltros(b) {
  if (!b || typeof b !== 'object') return { error: 'Solicitud inválida.' };

  const destino = typeof b.destino === 'string' ? b.destino.trim() : '';
  if (!destino || destino.length < REGLAS.destinoMin || destino.length > REGLAS.destinoMax || !RE_DESTINO.test(destino)) {
    return { campo: 'destino',
    error: 'Ingresá un destino de hasta 80 caracteres (solo letras, números y signos simples).' };
  }

  const huespedes = Number(b.huespedes ?? 1);
  if (!Number.isInteger(huespedes) || huespedes < REGLAS.minHuespedes || huespedes > REGLAS.maxHuespedes) {
    return { error: 'La cantidad de huéspedes debe estar entre 1 y 20.' };
  }

  let precioMax = null;
  if (b.precioMax !== undefined && b.precioMax !== null && b.precioMax !== '') {
    precioMax = Number(b.precioMax);
    if (!Number.isFinite(precioMax) || precioMax > REGLAS.precioMaxNoche) {
      return { error: 'El precio máximo debe ser un número valido.' };
    }
    if (precioMax < REGLAS.precioMinNoche){
      return{
        campo: 'precioMax',
        error: 'Menos de USD ${REGLAS.precioMinNoche} es improbable en cualquier opción.'
      };
    }
  }

  const fecha = (v) => {
    if (v === undefined || v === null || v === '') return null;
    if (typeof v !== 'string' || !RE_FECHA.test(v)) return false;
    const parseada = new Date(`${v}T00:00:00.000Z`);
    if (Number.isNaN(parseada.getTime()) || parseada.toISOString().slice(0, 10) !== v) return false;
    return v;
  };
  const checkIn = fecha(b.checkIn);
  const checkOut = fecha(b.checkOut);
  if (checkIn === false || checkOut === false) return { error: 'Las fechas deben tener formato AAAA-MM-DD.' };
  
  if (!checkIn || !checkOut) return { error: 'Indicá fecha de llegada y de salida para comprobar disponibilidad.' };
  
  if (checkOut <= checkIn) return { error: 'La salida debe ser posterior a la llegada.' };
  
  const hoy =  hoyAR();
  if (checkIn < hoy){
    return {campo: 'checkIn', error: 'No puedes llegar antes que hoy.'}
  }

  const noches = (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000;
   if (noches > REGLAS.maxNoches) {
    return { campo: 'checkOut', error: `Dificilmente habra una estadia de ${REGLAS.maxNoches} noches disponible.` };
  }

  const diasHastaLlegada = (Date.parse(checkIn) - Date.now()) / 86_400_000;
    if (diasHastaLlegada > REGLAS.maxAnticipacionDias) {
    return { campo: 'checkIn', error: 'Solo buscamos hasta 12 meses adelante.' };
  }
  

  let servicios = [];
  if (b.servicios !== undefined) {
    if (!Array.isArray(b.servicios) || !b.servicios.every((s) => SERVICIOS_VALIDOS.includes(s))) {
      return { error: 'Servicios inválidos.' };
    }
    servicios = [...new Set(b.servicios)];
  }

  return { valor: { destino, huespedes, precioMax, checkIn, checkOut, servicios } };
}
