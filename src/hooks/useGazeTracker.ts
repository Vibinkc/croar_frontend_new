import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

export interface GazeStatus {
    isLookingAtCamera: boolean;
    lastLookedAwayTime: number | null;
    lookingAwayDuration: number;
}

export const useGazeTracker = (stream: MediaStream | null) => {
    const [status, setStatus] = useState<GazeStatus>({
        isLookingAtCamera: true,
        lastLookedAwayTime: null,
        lookingAwayDuration: 0
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                ]);
                console.log("FaceAPI Models Loaded Successfully");
            } catch (err) {
                console.error("Error loading FaceAPI models:", err);
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        if (!stream) return;

        if (!videoRef.current) {
            videoRef.current = document.createElement('video');
            videoRef.current.muted = true; // IMPORTANT: Prevents echo
            videoRef.current.setAttribute('playsinline', '');
        }

        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing gaze video:", e));

        const detectGaze = async () => {
            if (!videoRef.current || !videoRef.current.srcObject) return;

            try {
                const detection = await faceapi.detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks();

                if (detection && videoRef.current && videoRef.current.srcObject) {
                    const landmarks = detection.landmarks;
                    const nose = landmarks.getNose();
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();

                    // Simple heuristic: if the nose is not centered between eyes horizontally, 
                    // or face is tilted too much, they might be looking away.
                    // More reliably: check the bounding box vs landmarks or orientation.

                    // For now, let's use a simple "Face Orientation" logic based on 
                    // the distance between eyes vs nose position.
                    // Vertical Pitch Check (Looking Down)
                    const eyeMidpointY = (leftEye[0].y + rightEye[3].y) / 2;
                    const noseTipY = nose[3].y;
                    // Distance from eye line to nose tip
                    const verticalDist = noseTipY - eyeMidpointY;
                    const eyeDistance = Math.abs(rightEye[3].x - leftEye[0].x); // Re-using eyeDistance from horizontal check
                    const verticalRatio = verticalDist / eyeDistance;

                    const eyeMidpointX = (leftEye[0].x + rightEye[3].x) / 2;
                    const noseTipX = nose[3].x;
                    const diff = Math.abs(eyeMidpointX - noseTipX);

                    // If diff is too high relative to eye distance, the head is turned.
                    const tiltRatio = diff / eyeDistance;

                    // 0.2 is more sensitive than 0.25
                    // Thresholds
                    const isLookingHorizontal = tiltRatio < 0.22;
                    // If ratio is too small, face is foreshadowed/looking down
                    const isLookingVertical = verticalRatio > 0.25;

                    const isLooking = isLookingHorizontal && isLookingVertical;

                    setStatus(prev => {
                        if (!isLooking) {
                            const now = Date.now();
                            const lastAway = prev.lastLookedAwayTime || now;
                            return {
                                isLookingAtCamera: false,
                                lastLookedAwayTime: lastAway,
                                lookingAwayDuration: now - lastAway
                            };
                        } else {
                            return {
                                isLookingAtCamera: true,
                                lastLookedAwayTime: null,
                                lookingAwayDuration: 0
                            };
                        }
                    });
                } else {
                    // Face Lost (e.g. looking down completely, or out of frame)
                    setStatus(prev => {
                        const now = Date.now();
                        const lastAway = prev.lastLookedAwayTime || now;
                        return {
                            isLookingAtCamera: false,
                            lastLookedAwayTime: lastAway,
                            lookingAwayDuration: now - lastAway
                        };
                    });
                }
            } catch (err) {
                console.error("Gaze detection error:", err);
            }
        };

        intervalRef.current = setInterval(detectGaze, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
                videoRef.current.load(); // Forces cleanup of media resources
            }
        };
    }, [stream]);

    return status;
};
