/*
 * Name: Android Function logger
 * Author: René Bisperink
 *
 * Description:
 * This script logs all functions found based on exported activities. Lighter than the functionstalker but less complete.
 *
 * frida -U -f com.target.app -l frida-exportedfunctionstalker.js
 */
const modules = Process.enumerateModules();

modules.forEach(module => {
    const exports = Module.enumerateExports(module.name);

    exports.forEach(exp => {
        if (exp.type === 'function') {
            try {
                Interceptor.attach(exp.address, {
                    onEnter(args) {
                        console.log(`[CALL] ${module.name}!${exp.name}`);
                    }
                });
            } catch (err) {
                // some functions can't be hooked
            }
        }
    });
});
