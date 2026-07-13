export function RouteFallback() {
  return (
    <main id="main-content" className="route-fallback" aria-busy="true" aria-label="Carregando página">
      <div className="route-fallback__mark" aria-hidden="true">
        E
      </div>
      <div className="route-fallback__copy">
        <span />
        <span />
      </div>
    </main>
  );
}
