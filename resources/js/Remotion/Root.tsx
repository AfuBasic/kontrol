import { registerRoot, Composition } from 'remotion';
import { CinematicEstate } from './CinematicEstate';

export default function RemotionRoot() {
    return (
        <>
            <Composition id="CinematicEstate" component={CinematicEstate} durationInFrames={360} fps={30} width={1280} height={720} />
        </>
    );
}

// Automatically register if running inside Remotion CLI
try {
    registerRoot(RemotionRoot);
} catch (e) {
    // Suppress registry errors when importing in standard web bundle
}
