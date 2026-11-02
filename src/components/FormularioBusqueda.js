'use client';
import { useEffect, useState } from 'react';

export default function FormularioBusqueda({ onBuscar, cargando }) {
  const [hoy, setHoy] = useState(undefined); // se calcula en el navegador para evitar desajustes de hidratación
  const [llegada, setLlegada] = useState('');

  useEffect(() => {
    setHoy(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }, []);

  function enviar(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    onBuscar({
      destino: String(d.get('destino') ?? '').trim(),
      checkIn: d.get('checkIn') || undefined,
      checkOut: d.get('checkOut') || undefined,
      huespedes: Number(d.get('huespedes') || 1),
      precioMax: d.get('precioMax') ? Number(d.get('precioMax')) : undefined,
      servicios: d.getAll('servicios'),
    });
  }

  return (
    <form className="filtros" onSubmit={enviar}>
      <h1>Encontrá dónde dormir</h1>

      <label>
        Destino
        <input name="destino" type="text" maxLength={80} required placeholder="Ej: Bariloche, Argentina" />
      </label>

      <div className="fila">
        <label>
          Llegada
          <input name="checkIn" type="date" min={hoy} required onChange={(e) => setLlegada(e.target.value)} />
        </label>
        <label>
          Salida
          <input name="checkOut" type="date" min={llegada || hoy} required />
        </label>
      </div>

      <div className="fila">
        <label>
          Huéspedes
          <input name="huespedes" type="number" min={1} max={20} defaultValue={2} />
        </label>
        <label>
          Precio máx. por noche (USD)
          <input name="precioMax" type="number" min={1} step={1} placeholder="Sin límite" />
        </label>
      </div>

      <fieldset>
        <legend>Servicios</legend>
        <label className="check"><input type="checkbox" name="servicios" value="wifi" /> Wi-Fi</label>
        <label className="check"><input type="checkbox" name="servicios" value="cocina" /> Cocina</label>
        <label className="check"><input type="checkbox" name="servicios" value="estacionamiento" /> Estacionamiento</label>
      </fieldset>

      <button type="submit" className="primario" disabled={cargando}>
        {cargando ? 'Buscando…' : 'Buscar alojamientos'}
      </button>
      <small className="atribucion">
        Ubicación aproximada por <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>.
      </small>
    </form>
  );
}
