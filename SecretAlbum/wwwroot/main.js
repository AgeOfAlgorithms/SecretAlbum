import { verifyLogIn, registerAlbum, } from "/utils.js"
import { showMyAlbum } from "/account.js"
import { upload } from "/upload.js"
import { queryAlbums, getSelectedAlbum } from "/search.js"

intialize()

function intialize() {
    verifyLogIn()
    registerAlbum()
    showMyAlbum()
    const frontPageAlias = document.getElementById("frontpagealias");
    frontPageAlias.textContent = window.sessionStorage.getItem("userAlias");
}

const btnUpload = document.getElementById('uploadbtn');
btnUpload.addEventListener('click', upload);

const btnLogout = document.getElementById('logoutbtn');
btnLogout.addEventListener('click', (click) => {
    if (!confirm("Are you sure you want to log out?")) {
        return
    }
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
