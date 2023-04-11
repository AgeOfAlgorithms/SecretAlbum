import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';

const imgInput = document.getElementById('imgfileinput')
const uploadCanvas = document.getElementById('imgfileoutput')
const canvasWidth = 300;
const canvasHeight = 300;

intialize()

const btnUpload = document.getElementById('uploadbtn');
btnUpload.addEventListener('click', upload);

const btnLogout = document.getElementById('logoutbtn');
btnLogout.addEventListener('click', (click) => {
    window.localStorage.removeItem("CVK");
    window.localStorage.removeItem("UID");
    window.location.replace(window.location.origin);
});

const menuAccount = document.getElementById('accountmenu');
menuAccount.addEventListener('click', showMyAlbum);

const menuSearch = document.getElementById('searchmenu');
menuSearch.addEventListener('click', queryAlbums);

async function queryAlbums() {
    const cvk = BigInt(window.localStorage.getItem("CVK"));
    const uid = window.localStorage.getItem("UID");
    const albumName = window.localStorage.getItem("albumName");
    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");

    // query available album names from the server 
    const form = new FormData();
    form.append("albumName", albumName)
    const resp = await fetch(window.location.origin + `/user/getalbums`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");

    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText)

    // refresh dropdown
    var dropdown = document.getElementById("dropdown")
    if (dropdown) dropdown.remove()
    const search = document.getElementById("search")
    dropdown = document.createElement("select");
    dropdown.id = "dropdown"
    search.appendChild(dropdown)

    for (var i = 0; i < respJson.length; i++) {
        const name = respJson[i]
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option)
    }

    const btnSelect = document.createElement("button");
    btnSelect.id = "btnSelect"
    search.appendChild(btnSelect)
    btnSelect.addEventListener('click', getSelectedAlbum);
}

async function getSelectedAlbum() {
    const dropdown = document.getElementById("dropdown")
    const albumName = dropdown.value
    const form = new FormData();
    const resp = await fetch(window.location.origin + `/user/getselectedalbum?albumName=${albumName}`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

async function registerAlbum() {
    const cvk = BigInt(window.localStorage.getItem("CVK"));
    const uid = window.localStorage.getItem("UID");
    const albumName = window.localStorage.getItem("albumName");
    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    // query available album names from the server 
    const form = new FormData();
    form.append("albumName", albumName)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

function intialize() {
    var cvk = BigInt(window.localStorage.getItem("CVK"));
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) window.location.replace(window.location.origin)

    registerAlbum()
}

imgInput.addEventListener("change", () => {
    uploadCanvas.width = canvasWidth
    uploadCanvas.height = canvasHeight
    const ctx = uploadCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);     // clear the canvas
    const imgInstance = processImage(imgInput.files[0])               // convert img file to an Image instance
    imgInstance.onload = function () {
        let width = imgInstance.naturalWidth;
        let height = imgInstance.naturalHeight
        const [newX, newY, newWidth, newHeight] = getNewSizeAndPlacement(width, height);
        console.log([newX, newY, newWidth, newHeight])
        ctx.drawImage(imgInstance, newX, newY, newWidth, newHeight);
    }
})

async function showMyAlbum() {
    var cvk = BigInt(window.localStorage.getItem("CVK"));
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) return
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    const resp = await fetch(window.location.origin + `/user/getimages?albumId=${albumId}`);
    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText);

    // set up the table and clear it
    var table = document.getElementById("tbl");
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respJson.length; i++) {
        const entry = respJson[i]

        // Create a new row and cells
        const row = document.createElement("tr");
        const imageCell = document.createElement("td");
        const descriptionCell = document.createElement("td");
        const actionCell = document.createElement("td");

        descriptionCell.textContent = entry.description;
        actionCell.textContent = "action";

        row.appendChild(imageCell)
        row.appendChild(descriptionCell)
        row.appendChild(actionCell)
        tbody.appendChild(row);

        // prepare canvas
        let canvas = document.createElement("canvas");
        let canvasName = "myAlbumCanvas" + i.toString()
        canvas.setAttribute("id", canvasName);
        imageCell.appendChild(canvas)
        const rowCanvas = document.getElementById(canvasName)
        rowCanvas.width = 300;
        rowCanvas.height = 300;

        // decrypt image
        var imageKey
        var imageKeyByteArray
        const decryptedSeed = BigInt(await decryptData(entry.seed, BigIntToByteArray(cvk)))
        if (entry.imageKey == "0") {
            imageKey = Point.g.times(decryptedSeed).times(cvk)
            imageKeyByteArray = BigIntToByteArray(imageKey.x)
        }

        // draw decrypted image on canvas
        var ctx = rowCanvas.getContext('2d');
        const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKeyByteArray));
        const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);
        ctx.putImageData(imgData, 0, 0)
    }
}

function verifyLogIn(cvk, uid) {
    if (cvk === null || uid === null) {
        alert("CVK/UID not found, please log in first")
        // window.location.replace(window.location.origin);
        localStorage.setItem("CVK", 1);
        localStorage.setItem("UID", 1);
        localStorage.setItem("albumName", "test");
        return false;
    }
    return true;
}

function processImage(imgFile) {
    const imgUrl = `${URL.createObjectURL(imgFile)}`
    const imgInstance = new Image(150, 150);
    imgInstance.src = imgUrl;
    return imgInstance;
}

function getNewSizeAndPlacement(width, height) {
    var ratio;
    if (width == height) {
        ratio = 1
    }
    else if (width < height) {
        ratio = canvasHeight / height

    } else {
        ratio = canvasWidth / width
    }
    const newHeight = height * ratio
    const newWidth = width * ratio

    const newX = parseInt((canvasWidth - newWidth) / 2)
    const newY = parseInt((canvasHeight - newHeight) / 2)

    return [newX, newY, newWidth, newHeight]
}

async function upload() {
    var cvk = BigInt(window.localStorage.getItem("CVK"));
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    // create image key and encrypt image
    const seed = RandomBigInt();
    const encryptedSeed = await encryptData(seed.toString(), BigIntToByteArray(cvk))
    const imageKey = Point.g.times(seed).times(cvk)
    const imageKeyByteArray = BigIntToByteArray(imageKey.x)
    var ctx = uploadCanvas.getContext('2d');

    const encryptedImgString = await encryptImage(ctx, imageKeyByteArray);

    // get description
    const descriptionInput = document.getElementById('descriptioninput')
    const description = descriptionInput.value;

    // send the image and description to the server
    const form = new FormData();
    form.append("seed", encryptedSeed)
    form.append("description", description)
    form.append("encryptedImg", encryptedImgString);
    const resp = await fetch(window.location.origin + `/user/addImage?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
    // else location.reload();
}

// source: https://alicebobandmallory.com/articles/2010/10/14/encrypt-images-in-javascript
function pixelArrToString(arr) {
    var s = "";
    for (var i = 0; i < arr.length; i += 4) {
        s += (String.fromCharCode(arr[i])
            + String.fromCharCode(arr[i + 1])
            + String.fromCharCode(arr[i + 2])
            + String.fromCharCode(arr[i + 3]));
    }
    return s;
}

function stringToPixelArr(s) {
    var arr = [];
    for (var i = 0; i < s.length; i += 4) {
        for (var j = 0; j < 4; j++) {
            arr.push(s.substring(i + j, i + j + 1).charCodeAt());
        }
    }
    return arr;
}

async function encryptImage(ctx, keyBytes) {
    var ctx = uploadCanvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var pixelArray = imgData.data;
    var imgString = pixelArrToString(pixelArray);
    return await encryptData(imgString, keyBytes);
}

async function decryptImage(encryptedImg, keyBytes) {
    var imgString = await decryptData(encryptedImg, keyBytes)
    var pixelArray = stringToPixelArr(imgString)
    return pixelArray;
}

// use this hash function temporarily until Heimdall gets fixed
const getSHA256Hash = async (input) => {
    const textAsBuffer = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
        .map((item) => item.toString(16).padStart(2, "0"))
        .join("");
    return hash;
};