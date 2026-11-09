import { Composition } from "remotion";
import { Plantilla } from "./Plantilla";

export const Raiz: React.FC = () => (
  <Composition
    id="Plantilla"
    component={Plantilla}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
  />
);
