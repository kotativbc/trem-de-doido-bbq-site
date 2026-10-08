/** Link do Google Maps para um ponto; vai na mensagem para o entregador achar o endereço. */
export const mapsPinUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
