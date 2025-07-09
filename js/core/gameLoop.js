export function startGameLoop(update, render, interval = 1000) {
    let last = performance.now();
    setInterval(() => {
        const now = performance.now();
        const delta = now - last;
        last = now;
        update(delta);
    }, interval);
    function frame() {
        render();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
