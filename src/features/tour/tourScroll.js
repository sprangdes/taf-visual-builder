export async function centerTourTarget(target) {
    const element = document.querySelector(target);
    if (!element || typeof element.scrollIntoView !== "function")
        return;
    element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
    });
}
