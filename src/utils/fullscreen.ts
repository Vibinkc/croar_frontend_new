/**
 * Utility to manage full-screen mode
 */
export const toggleFullScreen = (element: HTMLElement = document.documentElement) => {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

export const enterFullScreen = (element: HTMLElement = document.documentElement) => {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
};

export const exitFullScreen = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
            console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
        });
    }
};
