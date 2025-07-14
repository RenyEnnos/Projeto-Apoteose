// js/core/gameLoop.js
export function startGameLoop(update, render) {
    let lastUpdateTime = 0;
    const MS_PER_TICK = 1000; // Game logic updates every 1 second

    function gameLoop(currentTime) {
        // Initialize lastUpdateTime on the first frame
        if (!lastUpdateTime) {
            lastUpdateTime = currentTime;
        }

        // Calculate time elapsed since the last logic update
        const deltaTime = currentTime - lastUpdateTime;

        // If enough time has passed, update the game logic
        if (deltaTime >= MS_PER_TICK) {
            update();
            // Move the last update time forward by one tick interval
            lastUpdateTime += MS_PER_TICK;
        }

        // Render the current state on every frame
        render();

        // Request the next frame
        requestAnimationFrame(gameLoop);
    }

    // Start the loop
    requestAnimationFrame(gameLoop);
}
