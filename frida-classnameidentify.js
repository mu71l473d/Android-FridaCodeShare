//@Author: Rene Bisperink
//@version: 0.1

Java.perform(function () {
    Java.enumerateLoadedClasses({
        onMatch: function(name) {
            if (
                (name.includes("x") || name.includes("y") || name.includes("z")) &&
                !name.includes("$") &&
                !name.toLowerCase().includes("smali")
            ) {
                console.log(name);
            }
        },
        onComplete: function() {}
    });
});
