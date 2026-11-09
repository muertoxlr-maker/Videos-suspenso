import { Composition } from "remotion";
import { Plantilla } from "./Plantilla";
import { AlexShort } from "./videos/alejandro/Alex";
import { TOTAL, FPS } from "./videos/alejandro/story";
import { PruebaPasillo, PRUEBA_CUADROS } from "./videos/prueba_pasillo/Prueba";

// Registra cada short aquí, con su propio id (ver tutorial-caricatura/plantillas/alejandro/Root_ejemplo.tsx).
export const Raiz: React.FC = () => (
  <>
    {/* Ejemplo del tutorial de Crea con LuisPa: Alejandro Magno en Gaugamela (9.8 s) */}
    <Composition id="Alejandro" component={AlexShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    {/* Prueba de estilo de suspenso (GUIA_DE_ESTILO_SUSPENSO.md): 3 s, sin voz */}
    <Composition id="PruebaPasillo" component={PruebaPasillo} durationInFrames={PRUEBA_CUADROS} fps={30} width={1080} height={1920} />
    {/* Primera prueba propia: pasillo 3D con personaje plano */}
    <Composition id="Plantilla" component={Plantilla} durationInFrames={150} fps={30} width={1080} height={1920} />
  </>
);
