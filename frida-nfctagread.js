//@Author: Rene Bisperink
//@version: 0.1

Java.perform(function () {

    var Tag = Java.use("android.nfc.Tag");

    Tag.getId.overloads.forEach(function (overload) {

        overload.implementation = function () {

            console.log("[+] Tag.getId() called");

            var result = overload.call(this);

            if (result) {
                var hex = "";
                for (var i = 0; i < result.length; i++) {
                    hex += ('0' + (result[i] & 0xff).toString(16)).slice(-2);
                }
                console.log("[+] Tag UID: " + hex);
            } else {
                console.log("[!] Tag UID is null");
            }

            return result;
        };

    });

});
