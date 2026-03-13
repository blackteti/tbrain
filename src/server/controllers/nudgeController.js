import cron from 'node-cron';
import { getDb } from '../database/schema.js';

// FEAST Framework & Nudge Theory integration
// Runs every Monday at 08:00 AM
cron.schedule('0 8 * * 1', async () => {
    console.log('[Cron] Initiating Monday Morning Behavioral Analysis...');
    
    try {
        const db = getDb();
        
        // 1. Gather week data (Simplified for example)
        // Get failed habits
        const failedHabits = db.exec(`
            SELECT * FROM Habits_Goals 
            WHERE status = 'active' AND current_streak = 0
        `);

        // 2. Determine appropriate Nudge Strategy based on FEAST (Easy, Attractive, Social, Timely)
        if (failedHabits.length > 0 && failedHabits[0].values.length > 0) {
            const habits = failedHabits[0].values;
            
            habits.forEach(habitRow => {
                const habitName = habitRow[2]; // Assuming order from schema
                
                // Prompt internally or use predefined heuristic
                const frictionFinderNudge = generateFrictionFinder(habitName);
                const twoMinuteResetNudge = generateTwoMinuteReset(habitName);

                // Here we would typically push this to a notification service (Web Push API)
                // or store it in the DB to be retrieved by the Dashboard.
                console.log(`[Nudge Generated] Pattern: ${frictionFinderNudge.type} - Message: ${frictionFinderNudge.prompt}`);
                console.log(`[Nudge Generated] Pattern: ${twoMinuteResetNudge.type} - Message: ${twoMinuteResetNudge.prompt}`);
            });
        }
        
    } catch (e) {
        console.error('[Cron] Nudge controller failed:', e);
    }
});

// "Friction Finder Prompt": Analisa hábitos falhos e sugere remoção de atritos.
function generateFrictionFinder(habitName) {
    return {
        type: 'FrictionFinder',
        prompt: `It looks like you struggled with "${habitName}" last week. Let's make it easier (FEAST: Easy). What is the smallest obstacle stopping you right now? Can you prepare your environment tonight?`
    };
}

// "Two-Minute Reset Prompt": Envia uma notificação leve para retomar sem culpa.
function generateTwoMinuteReset(habitName) {
    return {
        type: 'TwoMinuteReset',
        prompt: `You missed "${habitName}". That's okay. Can you commit to doing it for just 2 minutes today? No pressure for more.`
    };
}

export default { generateFrictionFinder, generateTwoMinuteReset };
