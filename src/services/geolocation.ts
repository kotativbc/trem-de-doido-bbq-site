export interface Position {
  lat: number;
  lng: number;
  /** Precisão estimada em metros. */
  accuracy: number;
}

export type GeolocationFailure = "unsupported" | "denied" | "unavailable" | "timeout";

export const geolocationMessage: Record<GeolocationFailure, string> = {
  unsupported: "Este navegador não permite compartilhar localização. Preencha o endereço manualmente.",
  denied:
    "Permissão de localização negada. Você pode liberar no cadeado da barra de endereço ou preencher o endereço manualmente.",
  unavailable: "Não foi possível descobrir sua localização agora. Preencha o endereço manualmente.",
  timeout: "A localização demorou demais. Tente de novo ou preencha o endereço manualmente.",
};

export class GeolocationError extends Error {
  constructor(readonly failure: GeolocationFailure) {
    super(geolocationMessage[failure]);
    this.name = "GeolocationError";
  }
}

/** Pede a posição uma única vez, só quando o cliente clica no botão. */
export const requestPosition = (
  geo: Geolocation | undefined = typeof navigator !== "undefined" ? navigator.geolocation : undefined,
): Promise<Position> =>
  new Promise((resolve, reject) => {
    if (!geo) {
      reject(new GeolocationError("unsupported"));
      return;
    }
    geo.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => {
        const failure: GeolocationFailure =
          e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable";
        reject(new GeolocationError(failure));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
