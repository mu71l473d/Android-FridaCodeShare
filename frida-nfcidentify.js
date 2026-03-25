//@Author: Rene Bisperink
//@version: 0.1

Java.perform(function () {
    Java.enumerateLoadedClasses({
        onMatch: function(name) {
            if (
                (name.includes("nfc") || name.includes("Nfc") || name.includes("IsoDep")) &&
                !name.includes("$") &&
                !name.toLowerCase().includes("smali")
            ) {
                console.log(name);
            }
        },
        onComplete: function() {}
    });
});
