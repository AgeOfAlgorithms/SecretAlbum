import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, BigIntFromByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash, prepareAlbumCanvas, encryptedDefaultImage } from "/utils.js"

export async function showMyAlbum() {
    var cvk = window.sessionStorage.getItem("CVK");
    var uid = window.sessionStorage.getItem("UID");
    verifyLogIn(cvk, uid)
    const albumId = await getSHA256Hash(uid + ":" + cvk)

    // request my images from server
    const resp = await fetch(window.location.origin + `/user/getimages?albumId=${albumId}`);
    const respText = await resp.text();
    if (respText == "--FAILED--") {
        alert("failed.")
        return
    }
    const respJson = JSON.parse(respText);

    // set up the table and clear it
    var table = document.getElementById("myalbumtbl");
    populateTable(table, respJson, cvk, constructTableRow)
}

async function populateTable(table, respJson, cvk, constructTableRow) {
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respJson.length; i++) {
        const entry = respJson[i]

        var [imageCell, actionCell] = constructTableRow(entry.description, tbody);
        var rowCanvas = prepareAlbumCanvas(imageCell, i, canvasWidth, canvasHeight)
        var ctx = rowCanvas.getContext('2d');
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);

        var imageKeyByteArray
        try {
            imageKeyByteArray = await prepareImageKey(entry.encKey, cvk)
            const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKeyByteArray));
            var imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
            ctx.putImageData(imgData, 0, 0)
        }
        catch {
            ctx.drawImage(encryptedDefaultImage, 0, 0, canvasWidth, canvasHeight)
        }

        // make action buttons
<<<<<<< Updated upstream
        createActionButton("Make Public", requestMakePublic, entry.id, actionCell, imageKeyByteArray);
        createActionButton("Delete", requestDelete, entry.id, actionCell, imageKeyByteArray);
=======
        createActionButton("Make Public", requestMakePublic, entry.id, actionCell, imageKey);
        createActionButton("Share With", requestShareWith, entry.id, actionCell, imageKey);
        createActionButton("Delete", requestDelete, entry.id, actionCell, imageKey);
>>>>>>> Stashed changes
    }
}

function constructTableRow(description, tbody) {
    const row = document.createElement("tr");
    const imageCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = description;
    const actionCell = document.createElement("td");
    actionCell.style = "vertical-align: top;"

    row.appendChild(imageCell)
    row.appendChild(descriptionCell)
    row.appendChild(actionCell)
    tbody.appendChild(row);

    return [imageCell, actionCell]
}

function createActionButton(text, requestFunc, imageId, actionCell, imageKeyByteArray) {
    const actionBtn = document.createElement("button");
    actionBtn.textContent = text
    actionBtn.style = 'float: right; margin: 4px'
    actionBtn.addEventListener('click', function () {
        requestFunc(imageId, BigIntFromByteArray(imageKeyByteArray).toString());
    })
    actionCell.appendChild(actionBtn)
    actionCell.appendChild(document.createElement("br"))
}

async function requestMakePublic(imageId, pubKey) {
    // request my images from server
    const form = new FormData();
    const cvk = window.sessionStorage.getItem("CVK");
    const uid = window.sessionStorage.getItem("UID");
    verifyLogIn(cvk, uid)
    const albumId = await getSHA256Hash(uid + ":" + cvk)
    form.append("imageId", imageId)
    form.append("pubKey", pubKey)
    const resp = await fetch(window.location.origin + `/user/makepublic?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

async function requestShareWith(imageId, userList, pubKey) {
    // request my images from server
    const form = new FormData();
    const cvk = window.sessionStorage.getItem("CVK");
    const uid = window.sessionStorage.getItem("UID");
    verifyLogIn(cvk, uid)
    const albumId = await getSHA256Hash(uid + ":" + cvk)
    form.append("imageId", imageId)
    form.append("pubKey", pubKey)
    const resp = await fetch(window.location.origin + `/user/makepublic?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

async function requestDelete(imageId, imageKey) {

}

async function prepareImageKey(encKey, cvk) {
    const imageKey = BigInt(await decryptData(encKey, BigIntToByteArray(BigInt(cvk))))
    const imageKeyByteArray = BigIntToByteArray(imageKey)
    return imageKeyByteArray
}
