/*
 * Name: Android Function logger
 * Author: René Bisperink
 *
 * Description:
 * This script logs all functions found based on stalker. Very prone to crashing
 *
 * frida -U -f com.target.app -l frida-functionstalker.js --no-pause
 */

const mainThread = Process.enumerateThreads()[0].id;

Stalker.follow(mainThread, {
    events: {
        call: true,   // capture function calls
        ret: false,
        exec: false,
        block: false,
        compile: false
    },

    onReceive: function (events) {
        const parsed = Stalker.parse(events);
        parsed.forEach(event => {
            if (event[0] === 'call') {
                const from = ptr(event[1]);
                const to = ptr(event[2]);

                console.log(`[CALL] ${from} -> ${to}`);
            }
        });
    }
});
