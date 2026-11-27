export interface NetworkSnapshot {
  /** Hay una interfaz de red activa (wifi, datos…). */
  connected: boolean;
  /** Si esa red llega a internet; null si el sistema aún no lo sabe. */
  internetReachable: boolean | null;
}

export interface NetworkMonitor {
  current(): Promise<NetworkSnapshot>;
  /** Devuelve la función para cancelar la suscripción. */
  subscribe(listener: (snapshot: NetworkSnapshot) => void): () => void;
}
