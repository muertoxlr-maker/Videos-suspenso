import { Composition } from "remotion";
import { Plantilla } from "./Plantilla";
import { AlexShort } from "./videos/alejandro/Alex";
import { TOTAL, FPS } from "./videos/alejandro/story";

// Registra cada short aquí, con su propio id (ver tutorial-caricatura/plantillas/alejandro/Root_ejemplo.tsx).
export const Raiz: React.FC = () => (
  <>
    {/* Ejemplo del tutorial de Crea con LuisPa: Alejandro Magno en Gaugamela (9.8 s) */}
    <Composition id="Alejandro" component={AlexShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    {/* Primera prueba propia: pasillo 3D con personaje plano */}
    <Composition id="Plantilla" component={Plantilla} durationInFrames={150} fps={30} width={1080} height={1920} />
  </>
);
