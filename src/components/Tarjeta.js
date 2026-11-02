import { urlSegura } from '@/lib/cliente';

function Foto({ src, alt }) {
  const url = urlSegura(src);
  return url
    ? <img className="foto" src={url} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
    : <div className="foto">Sin imagen</div>;
}

function VerOferta({ url }) {
  const seguro = urlSegura(url);
  return seguro ? <a className="ver" href={seguro} target="_blank" rel="noopener noreferrer">Ver oferta</a> : null;
}

// Una oferta devuelta por el metabuscador (RF-01, RF-02)
export function TarjetaResultado({ r, esFavorito, onFavorito }) {
  const seguro = urlSegura(r.url);
  const host = seguro ? new URL(seguro).hostname.replace(/^www\./, '') : '';
  return (
    <li className="tarjeta">
      <Foto src={r.imagen} alt={r.nombre} />
      <div className="cuerpo">
        <h3>{r.nombre}</h3>
        <span className="origen">Oferta de {host}</span>
        <p>{r.descripcion}</p>
        <div className="etiquetas">
          {r.servicios.map((s) => <span key={s} className="etiqueta">{s}</span>)}
        </div>
      </div>
      <div className="lateral">
        <div className="precio">
          <strong>{r.precio}</strong>
          {r.precio !== 'No disponible' && <span>por noche</span>}
        </div>
        <button className="fav" aria-pressed={esFavorito} onClick={onFavorito}>
          {esFavorito ? '♥ Guardado' : '♡ Guardar'}
        </button>
        <VerOferta url={r.url} />
      </div>
    </li>
  );
}

// Un alojamiento guardado por el usuario
export function TarjetaFavorito({ f, onQuitar }) {
  return (
    <li className="tarjeta">
      <Foto src={f.imagenUrl} alt={f.nombreAlojamiento} />
      <div className="cuerpo">
        <h3>{f.nombreAlojamiento}</h3>
        <span className="origen">Guardado el {new Date(f.fechaGuardado).toLocaleDateString('es-AR')}</span>
      </div>
      <div className="lateral">
        <div className="precio">
          <strong>{f.precio != null ? f.precio.toLocaleString('es-AR') : 'No disponible'}</strong>
        </div>
        <button className="fav quitar" onClick={onQuitar}>Quitar</button>
        <VerOferta url={f.urlOrigen} />
      </div>
    </li>
  );
}
