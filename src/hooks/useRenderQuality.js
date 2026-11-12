import { useEffect, useState } from "react";
import { isInteractionHeld } from "./useInteractionHold";
const MIN_FPS = 40;
const SAMPLE_MS = 1500;
const SETTLE_MS = 1200;
/** Resolves with the frame rate, or null when the sample was disturbed by user input. */
function measureFps(durationMs) {
    return new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = (now) => {
            if (isInteractionHeld() || document.hidden) {
                resolve(null);
                return;
            }
            frames += 1;
            if (now - start < durationMs)
                requestAnimationFrame(tick);
            else
                resolve((frames * 1000) / (now - start));
        };
        requestAnimationFrame(tick);
    });
}
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
function readOverride() {
    if (typeof window === "undefined")
        return null;
    const value = new URLSearchParams(window.location.search).get("fx");
    return value === "full" || value === "reduced" || value === "lite" ? value : null;
}
/**
 * Samples the frame rate whenever the scene changes and steps the visual quality down when
 * the device cannot keep up, so editing stays responsive on slower hardware. Quality is only
 * ever lowered within a session. `?fx=full|reduced|lite` forces a level (useful for QA).
 */
export function useRenderQuality(animated, sceneKey) {
    const [override] = useState(readOverride);
    const [quality, setQuality] = useState(override ?? "full");
    useEffect(() => {
        if (override || quality === "lite")
            return;
        if (quality === "full" && !animated)
            return;
        if (typeof window === "undefined" || typeof requestAnimationFrame === "undefined")
            return;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
            return;
        let cancelled = false;
        (async () => {
            for (let attempt = 0; attempt < 5 && !cancelled; attempt += 1) {
                await wait(SETTLE_MS);
                if (cancelled)
                    return;
                const fps = await measureFps(SAMPLE_MS);
                if (cancelled || fps === null)
                    continue;
                if (fps < MIN_FPS)
                    setQuality(quality === "full" ? "reduced" : "lite");
                return;
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [animated, override, quality, sceneKey]);
    return quality;
}
