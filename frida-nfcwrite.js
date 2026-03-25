//@Author: Rene Bisperink
//@version: 0.1

Java.perform(function () {
    var NfcV = Java.use("android.nfc.tech.NfcV");

    NfcV.transceive.overload('[B').implementation = function (data) {
        console.log("Original transceive called");

        var bytes = Java.array('byte', data);
        console.log("Command: " + bytes);

        // Example: replace with your own command
        var payload = Java.array('byte', [0x02, 0x21, 0x01, 0x02, 0x03, 0x04]);

        console.log("Sending modified payload");
        var result = this.transceive(payload);

        console.log("Result: " + result);
        return result;
    };
});