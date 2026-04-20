interface SpeechRecognitionEvent extends Event {
    results: {
        length: number;
        item(index: number): {
            length: number;
            item(index: number): {
                transcript: string;
                confidence: number;
            };
            [index: number]: {
                transcript: string;
                confidence: number;
            };
            isFinal: boolean;
        };
        [index: number]: {
            length: number;
            item(index: number): {
                transcript: string;
                confidence: number;
            };
            [index: number]: {
                transcript: string;
                confidence: number;
            };
            isFinal: boolean;
        };
    };
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
        webkitAudioContext: typeof AudioContext;
    }
}

export {};
