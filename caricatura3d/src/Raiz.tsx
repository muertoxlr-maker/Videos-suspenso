import { Composition } from "remotion";
import { Plantilla } from "./Plantilla";
import { AlexShort } from "./videos/alejandro/Alex";
import { TOTAL, FPS } from "./videos/alejandro/story";
import { PruebaPasillo, PRUEBA_CUADROS } from "./videos/prueba_pasillo/Prueba";
import { TurnoDeLas3, TURNO_CUADROS } from "./videos/turno3/Turno";
import { UltimoVagon, UltimoVagonPortada, VAGON_CUADROS } from "./videos/ultimo_vagon/Vagon";
import { FERIA_CUADROS, Feria, FeriaPortada } from "./videos/feria/Feria";
import { TAQUERIA_CUADROS, Taqueria, TaqueriaPortada } from "./videos/taqueria/Taqueria";
import { VELORIO_CUADROS, Velorio, VelorioPortada } from "./videos/velorio/Velorio";
import { CAMION_CUADROS, Camion, CamionPortada } from "./videos/camion/Camion";
import { NINERA_CUADROS, Ninera, NineraPortada } from "./videos/ninera/Ninera";
import { HojaMovimiento, HojaPersonajes } from "./videos/hoja/HojaPersonajes";
import { GASO_CUADROS, Gasolinera, GasolineraPortada } from "./videos/gasolinera/Gasolinera";

// Registra cada short aquí, con su propio id (ver tutorial-caricatura/plantillas/alejandro/Root_ejemplo.tsx).
export const Raiz: React.FC = () => (
  <>
    {/* Ejemplo del tutorial de Crea con LuisPa: Alejandro Magno en Gaugamela (9.8 s) */}
    <Composition id="Alejandro" component={AlexShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    {/* Historia 2: «Último vagón» (77.6 s) */}
    <Composition id="UltimoVagon" component={UltimoVagon} durationInFrames={VAGON_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="Gasolinera" component={Gasolinera} durationInFrames={GASO_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="GasolineraPortada" component={GasolineraPortada} durationInFrames={GASO_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="Feria" component={Feria} durationInFrames={FERIA_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="Taqueria" component={Taqueria} durationInFrames={TAQUERIA_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="TaqueriaPortada" component={TaqueriaPortada} durationInFrames={TAQUERIA_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="Velorio" component={Velorio} durationInFrames={VELORIO_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="VelorioPortada" component={VelorioPortada} durationInFrames={VELORIO_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="Camion" component={Camion} durationInFrames={CAMION_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="Ninera" component={Ninera} durationInFrames={NINERA_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="NineraPortada" component={NineraPortada} durationInFrames={NINERA_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="CamionPortada" component={CamionPortada} durationInFrames={CAMION_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="FeriaPortada" component={FeriaPortada} durationInFrames={FERIA_CUADROS} fps={30} width={1080} height={1920} />
    <Composition id="HojaMovimiento" component={HojaMovimiento} durationInFrames={150} fps={30} width={1080} height={600} />
    <Composition id="HojaPersonajes" component={HojaPersonajes} durationInFrames={1} fps={30} width={1080} height={1080} />
    <Composition id="UltimoVagonPortada" component={UltimoVagonPortada} durationInFrames={VAGON_CUADROS} fps={30} width={1080} height={1920} />
    {/* Historia 1: «El turno de las 3:00» (75.7 s) */}
    <Composition id="TurnoDeLas3" component={TurnoDeLas3} durationInFrames={TURNO_CUADROS} fps={30} width={1080} height={1920} />
    {/* Prueba de estilo de suspenso (GUIA_DE_ESTILO_SUSPENSO.md): 3 s, sin voz */}
    <Composition id="PruebaPasillo" component={PruebaPasillo} durationInFrames={PRUEBA_CUADROS} fps={30} width={1080} height={1920} />
    {/* Primera prueba propia: pasillo 3D con personaje plano */}
    <Composition id="Plantilla" component={Plantilla} durationInFrames={150} fps={30} width={1080} height={1920} />
  </>
);
