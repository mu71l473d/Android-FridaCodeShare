/*
 * Name: Android Simple Safetynet bypass
 * Author: René Bisperink
 *
 * Description:
 * This script bypasses client-side security checks related to Google 
 * Play Integrity (formerly SafetyNet). 
 *
 * Features:
 * 1. Bypasses local SafetyNet client attestation requests.
 */

Java.perform(function () {
    console.log("[*] --- Safetynet Bypass by RB ---");
    /**
     * 1. SafetyNet Client Bypass (Legacy)
     * Some apps still use the older SafetyNet client for attestation.
     */
    try {
        const SafetyNetClient = Java.use("com.google.android.gms.safetynet.SafetyNetClient");
		// Uses the nonce and apiKey from the code example MainActivity
        SafetyNetClient.attest.overload('[B', 'java.lang.String').implementation = function (nonce, apiKey) {
            console.log("[!] SafetyNet attest() called. Returning fake successful task.");
            const Tasks = Java.use("com.google.android.gms.tasks.Tasks");
            return Tasks.forResult(null); 
        };
    } catch (e) {
        // SafetyNet might not be present in newer apps, that's why we'll bypass Play integrity next
    }

    console.log("[*] Safetynet bypass active. Monitoring for requests...");
});
