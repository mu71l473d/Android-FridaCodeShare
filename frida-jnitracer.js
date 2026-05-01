/*
 * Name: Android JNI tracer
 * Author: René Bisperink
 *
 * Description:
 * This script logs amounts of jni calls
 *
 * frida -U -f com.target.app -l frida-jnitracer.js --no-pause
 */

'use strict';

// ================= CONFIG =================
const MAX_LOG_LINES = 200;
const PRINT_INTERVAL = 3000; // ms
const MAX_ARGS = 4;

// ================= STATE =================
let callStats = {};
let jniMethods = {};
let logLines = 0;

// ================= UTIL =================
function safeRead(ptrVal) {
    try {
        return ptr(ptrVal);
    } catch (e) {
        return ptr("0x0");
    }
}

function readArg(val) {
    try {
        let p = ptr(val);

        if (p.isNull()) return "NULL";

        // Try string
        try {
            return `"${Memory.readUtf8String(p)}"`;
        } catch (_) {}

        return p;
    } catch (e) {
        return val;
    }
}

// ================= DETECT MODULE =================
function detectMainModule() {
    let mods = Process.enumerateModules();

    let candidates = mods.filter(m =>
        m.path.includes("/data/app/") && m.name.endsWith(".so")
    );

    if (candidates.length > 0) {
        candidates.sort((a, b) => b.size - a.size);
        return candidates[0];
    }

    return null;
}

const mainModule = detectMainModule();
console.log("[+] Main module:", mainModule ? mainModule.name : "UNKNOWN");

// ================= FILTER =================
function isAppAddr(addr) {
    const m = Process.findModuleByAddress(addr);
    if (!m) return false;

    if (mainModule) return m.name === mainModule.name;

    return !m.path.startsWith("/system/");
}

// ================= AGGREGATION =================
function recordCall(name) {
    if (!callStats[name]) {
        callStats[name] = 0;
    }
    callStats[name]++;
}

// Periodic print
setInterval(() => {
    console.log("\n==== CALL STATS ====");
    Object.keys(callStats)
        .sort((a, b) => callStats[b] - callStats[a])
        .slice(0, MAX_LOG_LINES)
        .forEach(k => {
            console.log(callStats[k] + "x\t" + k);
        });
}, PRINT_INTERVAL);

// ================= JNI HOOK =================
function hookRegisterNatives() {
    const addr = Module.findExportByName("libart.so", "RegisterNatives");

    if (!addr) {
        console.log("[!] RegisterNatives not found");
        return;
    }

    Interceptor.attach(addr, {
        onEnter(args) {
            const env = args[0];
            const clazz = args[1];
            const methods = args[2];
            const count = args[3].toInt32();

            console.log("[+] RegisterNatives called, count =", count);

            for (let i = 0; i < count; i++) {
                const methodPtr = methods.add(i * Process.pointerSize * 3);

                const namePtr = Memory.readPointer(methodPtr);
                const sigPtr = Memory.readPointer(methodPtr.add(Process.pointerSize));
                const fnPtr = Memory.readPointer(methodPtr.add(Process.pointerSize * 2));

                const name = Memory.readUtf8String(namePtr);
                const sig = Memory.readUtf8String(sigPtr);

                const key = `${name}${sig}`;

                jniMethods[fnPtr] = key;

                console.log(`  ↳ ${key} @ ${fnPtr}`);
            }
        }
    });
}

// ================= STALKER =================
function startStalker() {
    Process.enumerateThreads().forEach(thread => {
        try {
            Stalker.follow(thread.id, {
                events: { call: true },

                onReceive(events) {
                    const parsed = Stalker.parse(events);

                    parsed.forEach(ev => {
                        if (ev[0] !== "call") return;

                        const to = ptr(ev[2]);

                        if (!isAppAddr(to)) return;

                        let name;

                        if (jniMethods[to]) {
                            name = "[JNI] " + jniMethods[to];
                        } else {
                            const sym = DebugSymbol.fromAddress(to);
                            name = sym.name || to.toString();
                        }

                        recordCall(name);
                    });
                }
            });
        } catch (e) {}
    });
}

// ================= NATIVE ARG HOOK =================
function hookExports() {
    if (!mainModule) return;

    const exports = Module.enumerateExports(mainModule.name);

    exports.forEach(exp => {
        if (exp.type !== "function") return;

        try {
            Interceptor.attach(exp.address, {
                onEnter(args) {
                    let argDump = [];

                    for (let i = 0; i < MAX_ARGS; i++) {
                        argDump.push(readArg(args[i]));
                    }

                    let name = exp.name;

                    recordCall(name + "(" + argDump.join(", ") + ")");
                }
            });
        } catch (e) {}
    });
}

// ================= JAVA ↔ JNI TRACE =================
function hookJNITransitions() {
    const symbols = [
        "CallObjectMethod",
        "CallVoidMethod",
        "CallIntMethod",
        "GetStringUTFChars"
    ];

    symbols.forEach(sym => {
        const addr = Module.findExportByName("libart.so", sym);
        if (!addr) return;

        Interceptor.attach(addr, {
            onEnter(args) {
                recordCall("[JAVA->JNI] " + sym);
            }
        });
    });
}

// ================= INIT =================
setTimeout(() => {
    hookRegisterNatives();
    hookJNITransitions();
    hookExports();
    startStalker();

    console.log("[*] Tracing started...");
}, 1000);
