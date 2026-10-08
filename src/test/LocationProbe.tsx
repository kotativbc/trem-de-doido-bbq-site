import { useLocation } from "react-router-dom";

/** Expõe a rota atual para os testes verificarem navegação. */
const LocationProbe = () => <div data-testid="path">{useLocation().pathname}</div>;

export default LocationProbe;
