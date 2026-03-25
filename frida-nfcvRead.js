//@Author: Rene Bisperink
//@version: 0.1

Java.perform(function () {

    var NfcV = Java.use("android.nfc.tech.NfcV");

    function toHex(byteArray) {
        var result = "";
        for (var i = 0; i < byteArray.length; i++) {
            var b = byteArray[i] & 0xff;
            result += ("0" + b.toString(16)).slice(-2);
        }
        return result;
    }

    NfcV.transceive.overloads.forEach(function (overload) {

        overload.implementation = function (data) {

            console.log("\n==== NFC-V transceive ====");

            try {
                console.log("[+] Request:  " + toHex(data));
            } catch(e) {
                console.log("Failed to parse request");
            }

            var response = overload.call(this, data);

            try {
                console.log("[+] Response: " + toHex(response));
            } catch(e) {
                console.log("Failed to parse response");
            }

            return response;
        };

    });

});
