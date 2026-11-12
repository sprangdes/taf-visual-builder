export function getTourGesture(deltaX, deltaY, threshold = 40) {
    if (Math.abs(deltaY) < threshold || Math.abs(deltaX) > Math.abs(deltaY))
        return null;
    return deltaY > 0 ? "collapse" : "expand";
}
