export async function centerTourTarget(target: string): Promise<void> {
  const element = document.querySelector(target);
  if (!element || typeof element.scrollIntoView !== "function") return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
}
