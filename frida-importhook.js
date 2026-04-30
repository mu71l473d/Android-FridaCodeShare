/*
 * Name: Android import hook
 * Author: René Bisperink
 *
 * Description:
 * This script logs all functions found based on imports
 *
 * frida -U -f com.target.app -l frida-importhook.js
 */
const modules = Process.enumerateModules();

modules.forEach(module => {
    const imports = Module.enumerateImports(module.name);

    imports.forEach(imp => {
        if (imp.type === 'function') {
            try {
                Interceptor.attach(imp.address, {
                    onEnter(args) {
                        console.log(`[IMPORT CALL] ${imp.name} from ${imp.module}`);
                    }
                });
            } catch (e) {}
        }
    });
});
