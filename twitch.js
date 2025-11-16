import tmi from 'tmi.js';

const ENERGY_COOLDOWN = 10 * 60 * 1000; // 10 minutes in milliseconds
const recentChatters = new Map();

export function initTwitch(channel, onChatter) {
    const client = new tmi.Client({
        options: { debug: false },
        connection: {
            secure: true,
            reconnect: true
        },
        channels: [channel]
    });

    client.connect().catch(console.error);

    client.on('message', (channel, tags, message, self) => {
        if (self) return;

        console.log(`[${tags['display-name']}]: ${message}`);

        const userId = tags['user-id'];
        const username = tags['display-name'];
        const now = Date.now();

        const lastChatter = recentChatters.get(userId);

        if (!lastChatter || now - lastChatter.lastMessageTimestamp > ENERGY_COOLDOWN) {
            const chatterData = {
                id: userId,
                username: username,
                color: tags['color'] || '#FFFFFF',
                lastMessageTimestamp: now,
            };
            recentChatters.set(userId, chatterData);
            onChatter(chatterData);
        }
    });
}