import AppDocsViewer from "@netless/app-docs-viewer";
import AppMediaPlayer, { setOptions } from "@netless/app-media-player";
import Plyr from "@netless/app-plyr";
import { WindowManager } from "./index";


export const setupBuiltin = () => {
    if (WindowManager.debug) {
        setOptions({ verbose: true });
    }

    WindowManager.register({
        kind: AppDocsViewer.kind,
        src: AppDocsViewer,
    });
    WindowManager.register({
        kind: AppMediaPlayer.kind,
        src: AppMediaPlayer as any,
    });
    WindowManager.register({
        kind: 'video',
        src: Plyr
    })
    WindowManager.register({
        kind: 'audio',
        src: Plyr
    })
};

export const BuiltinApps = {
    DocsViewer: AppDocsViewer.kind as string,
    MediaPlayer: AppMediaPlayer.kind as string,
    Plyr: Plyr.kind as string,
};
