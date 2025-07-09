export function startGameLoop(update, render, interval = 1000) {
    let last = Date.now();
    function loop() {
        const now = Date.now();
        const delta = now - last;
        last = now;
        update(delta);
        render();
    }
    return setInterval(loop, interval);
}
