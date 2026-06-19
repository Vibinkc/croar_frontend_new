// Ambient declarations for the Web Speech API (SpeechRecognition).
// These globals are not part of the standard TS DOM lib, so we declare them here.

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

declare var SpeechRecognition: SpeechRecognitionStatic;
declare var webkitSpeechRecognition: SpeechRecognitionStatic;

interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
    webkitAudioContext: typeof AudioContext;
}
