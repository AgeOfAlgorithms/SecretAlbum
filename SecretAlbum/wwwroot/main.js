import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn } from "/utils.js"
import { showMyAlbum } from "/account.js"
import { upload } from "/upload.js"
import { queryAlbums, registerAlbum, getSelectedAlbum } from "/search.js"

intialize()

function intialize() {
    var cvk = window.sessionStorage.getItem("CVK");
    var uid = window.sessionStorage.getItem("UID");
    verifyLogIn(cvk, uid)
    registerAlbum()
    showMyAlbum()
    const frontPageAlias = document.getElementById("frontpagealias");
    frontPageAlias.textContent = window.sessionStorage.getItem("userAlias");
}

const btnUpload = document.getElementById('uploadbtn');
btnUpload.addEventListener('click', upload);

const btnLogout = document.getElementById('logoutbtn');
btnLogout.addEventListener('click', (click) => {
    window.sessionStorage.removeItem("CVK");
    window.sessionStorage.removeItem("UID");
    window.sessionStorage.removeItem("userAlias");
    window.location.replace(window.location.origin);
});

const menuAccount = document.getElementById('accountmenu');
menuAccount.addEventListener('click', showMyAlbum);

const menuSearch = document.getElementById('searchmenu');
menuSearch.addEventListener('click', queryAlbums);

const btnSelect = document.getElementById("btnSelect");
btnSelect.addEventListener('click', getSelectedAlbum);
