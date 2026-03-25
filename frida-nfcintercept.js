//@Author: Rene Bisperink
//@version: 0.1
Java.perform(function () {

    var NFCmech = Java.use("android.nfc.tech.NFCmech");

    NFCmech.transceive.overload('[B').implementation = function(data) {

        console.log("[+] NFC transceive called");

        var hex = "";
        for (var i = 0; i < data.length; i++) {
            hex += ('0' + (data[i] & 0xFF).toString(16)).slice(-2);
        }

        console.log("Sent: " + hex);

        var result = this.transceive(data);

        var hex2 = "";
        for (var i = 0; i < result.length; i++) {
            hex2 += ('0' + (result[i] & 0xFF).toString(16)).slice(-2);
        }

        console.log("Received: " + hex2);

        return result;
    };

});
