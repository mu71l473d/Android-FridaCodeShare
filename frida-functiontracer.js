// frida -U -f com.target.app -l frida-functiontracer.js --no-pause

'use strict';

const LOG_LIMIT = 10000; // prevent infinite spam
let logCount = 0;

// --- Step 1: Detect main app module ---
function detectMainModule() {
    const modules = Process.enumerateModules();

    // Heuristic 1: prefer modules in /data/app (APK native libs)
    let candidates = modules.filter(m =>
        m.path.includes("/data/app/") &&
        m.name.endsWith(".so")
    );

    if (candidates.length > 0) {
        // Pick the largest (usually main lib)
        candidates.sort((a, b) => b.size - a.size);
        return candidates[0];
    }

    // Heuristic 2: fallback to anything not system-related
    candidates = modules.filter(m =>
        !m.path.startsWith("/system/") &&
        !m.path.startsWith("/apex/") &&
        m.name.endsWith(".so")
    );

    if (candidates.length > 0) {
        candidates.sort((a, b) => b.size - a.size);
        return candidates[0];
    }

    return null;
}

const mainModule = detectMainModule();

if (!mainModule) {
    console.log("[!] Could not detect main module, tracing all non-system libs");
} else {
    console.log("[+] Main module detected:", mainModule.name, mainModule.base);
}

// --- Step 2: Module filter ---
function isAppModule(address) {
    const module = Process.findModuleByAddress(address);
    if (!module) return false;

    // If we found main module → only trace that
    if (mainModule) {
        return module.name === mainModule.name;
    }

    // Otherwise fallback filter
    const name = module.name;

    return !(
        name.startsWith("libc") ||
        name.startsWith("libm") ||
        name.startsWith("libdl") ||
        name.startsWith("liblog") ||
        name.startsWith("libandroid") ||
        name.startsWith("linker") ||
        name.startsWith("libart")
    );
}

// --- Step 3: Pretty print ---
function formatCall(from, to) {
    const toModule = Process.findModuleByAddress(to);

    let symbol = DebugSymbol.fromAddress(to);
    let name = symbol && symbol.name ? symbol.name : "sub_" + to;

    return `[CALL] ${toModule ? toModule.name : "unknown"}!${name}`;
}

// --- Step 4: Follow threads ---
function followThread(threadId) {
    Stalker.follow(threadId, {
        events: {
            call: true
        },

        onReceive: function (events) {
            const parsed = Stalker.parse(events);

            for (let i = 0; i < parsed.length; i++) {
                const event = parsed[i];

                if (event[0] !== "call") continue;

                const from = ptr(event[1]);
                const to = ptr(event[2]);

                if (!isAppModule(to)) continue;

                if (logCount++ > LOG_LIMIT) {
                    console.log("[!] Log limit reached, stopping stalker.");
                    Stalker.unfollow(threadId);
                    return;
                }

                console.log(formatCall(from, to));
            }
        }
    });
}

// --- Step 5: Start tracing ---
function startTracing() {
    const threads = Process.enumerateThreads();

    console.log("[*] Found threads:", threads.length);

    threads.forEach(thread => {
        try {
            console.log("[*] Following thread:", thread.id);
            followThread(thread.id);
        } catch (e) {
            console.log("[!] Failed to follow thread:", thread.id);
        }
    });
}

// Delay slightly to let libs load
setTimeout(startTracing, 1000);
