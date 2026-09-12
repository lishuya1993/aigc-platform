import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';
// Keep this protocol aligned with ruoyi-ui. The keys are the project's default
// transport pair; deployments can override them with VITE_APP_RSA_* variables.
const env = import.meta.env || {};
const requestPublicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDQCko21IcYUy6sMeJzYXzjorqskNhJ504qFge+7X9kjFkQw5yDk2QLWhwLoi1KWWP7fSzTNvM8j+k+c3sgL+UgQ3iRX6ZDA/DoP7nhL3XM1+ickoL9xtWG1hBgbljEUABpGWS5y6pY/lbesNVZhmcG9twF/DhQj63HpZuEzTLOBQIDAQAB';
'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDvEDuRIOM3oZPWj9Ukoc5pQklR4PFH6/clnjeFqjDLIgDyQvjxhgqAZQA+E9eD6qu6FsXPmK8djcL+nh3cFHz4pX473jDvO3Sve+8yL3VRQ0n2pRgQ2a01MJsy+WwTZCBYWf0VnLRIvANUoWQgy9vz94q7Va44dg7A1/3ICf+xAwIDAQAB';
const responsePrivateKey = env.VITE_APP_RSA_PRIVATE_KEY ||
    'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAObq7yrxfvyieZtTjAYyrdvi59tYTXxjO5ajmPCRSXBY9M9wQ1tli297JN6mnY53UJMNyOFNSZVi8WSFoIXjpR87FmvChJlzeN/dZdd3SEs48Ee66XKeSePYqxa8oO5GKDsnajgpsOHKXSeeVSIysiIPS2/WsEqk0In9P4w3RsRFAgMBAAECgYBiMEWwce24SPICnRzuScBpvmsudrbEDIH7BOd0a6LZlcnLJwZN7JmJlshPsHNQb+WgEf135+BBGEhioPtn0yuTdEuKP4kB9UdYUKiayWCoWhJpesv7sAD4RDClV7dhuV+gcd1AXD+YzyRIPbGm0VC2U+4q8/+UPRpVjqskbLVTgQJBAPRpou7g3S8n4XB527kqD8I3+ZYwMxZhszwhrCDpJU319+ucmpLVwYIzDmZVeID2QQdUaDfIEViFHu95xDrGiUCQQDx3YOKn3yaEctk/ERVn7hDAyAXUbd8/pv2b24/M/l1ZevlsFem8U4Jk5Mu64t3z3YGJoymEjQmbucwT01iKhehAkEAxlnccsRmfFh/KkqauKE4M4++NTAd9zlInpUsmZ+cN8UEGnF2RTEzRKBrLOt1uWCqBB7PGiE6DVTVjr7FAQPrSQJAT5yeY87DcONSk9cFlzmPqV8p/QME5rvYEnHzVBKDlkUKNPyqnWToTvaoh9U4fyNmsfeWbEOprszqhFhWHG3GgQJAK8+ynmyFhaw63+Hx2KU5zR4hVuQso2IzrEurGxCxybV6mR7VBerb4502+EPx3PmOgxQL+niUFhcMWxcvBFP9+A==';
function rsa(value, key, decrypt = false) {
    const crypt = new JSEncrypt();
    if (decrypt)
        crypt.setPrivateKey(key);
    else
        crypt.setPublicKey(key);
    return decrypt ? crypt.decrypt(value) : crypt.encrypt(value);
}
function aesKey() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return CryptoJS.enc.Utf8.parse(Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''));
}
function encryptBody(value, key) {
    const plain = typeof value === 'string' ? value : JSON.stringify(value);
    return CryptoJS.AES.encrypt(plain, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString();
}
function decryptBody(value, key) {
    return CryptoJS.AES.decrypt(value, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString(CryptoJS.enc.Utf8);
}
export async function secureFetch(input, init = {}) {
    const headers = new Headers(init.headers || {});
    headers.set('clientid', 'aigc-web');
    const method = String(init.method || 'GET').toUpperCase();
    const canEncrypt = method === 'POST' || method === 'PUT' || method === 'DELETE';
    const isFormData = init.body instanceof FormData;
    let body = init.body;
    // ENCRYPTION DISABLED - pass through
    if (canEncrypt && body != null && !isFormData) {
        // body encryption skipped
    }
    const response = await fetch(input, { ...init, headers, body });
    const responseKey = response.headers.get('encrypt-key');
    if (!responseKey || !response.body)
        return response;
    const encryptedAesKey = rsa(responseKey, responsePrivateKey, true);
    if (!encryptedAesKey)
        return response;
    const encrypted = await response.text();
    const plain = decryptBody(encrypted, CryptoJS.enc.Base64.parse(encryptedAesKey));
    return new Response(plain, { status: response.status, statusText: response.statusText, headers: response.headers });
}
