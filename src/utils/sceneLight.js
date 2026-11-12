import { mixColor } from "./weatherScene";
const PALETTE = {
    day: ["#173871", "#2a5895", "#4777b0"],
    dawn: ["#1f2d5c", "#6a5a8c", "#d4917c"],
    dusk: ["#1c2252", "#744a7a", "#cf7c62"],
    night: ["#050a1a", "#0b1530", "#17254a"],
    stormDay: ["#0c111b", "#1a2131", "#2b3242"],
    stormNight: ["#04060c", "#0a0e18", "#131a28"],
};
const mixPalette = (a, b, t) => a.map((color, index) => mixColor(color, b[index], t));
/** Combines time of day with how stormy the period is into the colours used by every layer. */
export function getSceneLight(daylight, darkness) {
    const twilightPalette = daylight.phase === "dawn" || (daylight.phase !== "dusk" && daylight.sunX < 0.5) ? PALETTE.dawn : PALETTE.dusk;
    let sky = mixPalette(PALETTE.day, twilightPalette, daylight.twilight);
    sky = mixPalette(sky, PALETTE.night, daylight.night);
    sky = mixPalette(sky, mixPalette(PALETTE.stormDay, PALETTE.stormNight, daylight.night), darkness);
    const warm = daylight.sunX < 0.5 ? "#ffd0a6" : "#ffb98f";
    const moonLight = mixColor("#3e4a68", "#aab8d8", daylight.moon ? daylight.moon.illumination : 0.25);
    let cloudLight = mixColor("#ffffff", warm, daylight.twilight);
    cloudLight = mixColor(cloudLight, moonLight, daylight.night);
    const lightX = daylight.night > 0.5 && daylight.moon ? daylight.moon.x : daylight.sunX;
    const baseElevation = daylight.night > 0.5 ? 30 : daylight.twilight > 0.5 ? 12 : 20 + 40 * Math.max(0, daylight.sun);
    return {
        sky,
        cloudLight,
        stormShade: mixColor("#596075", "#262b3a", daylight.night),
        azimuth: Math.round(180 + 180 * lightX),
        elevation: Math.round(Math.max(8, baseElevation - darkness * 20)),
        night: daylight.night,
    };
}
