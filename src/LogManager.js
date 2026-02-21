export const LogManager = {
    log: (event) => {
        console.log(`[GAME_LOG] ${new Date().toISOString()}: ${event}`);
    }
};
