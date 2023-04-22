import { BigIntToByteArray } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import { canvasWidth, canvasHeight, decryptImage, verifyLogIn, getSHA256Hash, prepareAlbumCanvas, encryptedDefaultImage } from "/utils.js"

export async function queryAlbums() {
    registerAlbum()

    const cvk = window.sessionStorage.getItem("CVK");
    const uid = window.sessionStorage.getItem("UID");
    const userAlias = window.sessionStorage.getItem("userAlias");
    verifyLogIn(cvk, uid)

    // query available user aliases from the server 
    const form = new FormData();
    form.append("userAlias", userAlias)
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
    refreshDropdownOptions(respJson)
}

export async function getSelectedAlbum() {
    const cvk = window.sessionStorage.getItem("CVK");
    const uid = window.sessionStorage.getItem("UID");
    verifyLogIn(cvk, uid)

    const dropdown = document.getElementById("dropdown")
    const userChosen = dropdown.value
    const resp = await fetch(window.location.origin + `/user/getselectedalbum?userAlias=${userChosen}`, {
        method: 'GET',
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
    const respText = await resp.text();
    if (respText == "--FAILED--") alert("failed.")
    const respJson = JSON.parse(respText);

    var selectedAlbumText = document.getElementById("selectedalbumtext");
    selectedAlbumText.textContent = "Viewing " + userChosen + "'s album"

    var table = document.getElementById("viewtbl");
    populateTable(table, respJson, cvk, constructTableRowNoActions)
}

export async function populateTable(table, respJson, cvk, constructTableRow) {
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < respJson.length; i++) {
        const entry = respJson[i]
        var imageCell = constructTableRow(entry.description, tbody, entry.id, entry.pubKey);
        var rowCanvas = prepareAlbumCanvas(imageCell, i, canvasWidth, canvasHeight)
        var ctx = rowCanvas.getContext('2d');
        ctx.clearRect(0, 0, rowCanvas.width, rowCanvas.height);

        try {
            const pubKey = BigInt(entry.pubKey)
            const imageKeyByteArray = BigIntToByteArray(pubKey)
            const pixelArray = new Uint8ClampedArray(await decryptImage(entry.encryptedData, imageKeyByteArray));
            const imgData = new ImageData(pixelArray, rowCanvas.width, rowCanvas.height)
            ctx.putImageData(imgData, 0, 0)
        }
        catch {
            ctx.drawImage(encryptedDefaultImage, 0, 0, canvasWidth, canvasHeight)
        }
    }
}

function constructTableRowNoActions(description, tbody) {
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

    return imageCell
}

export async function registerAlbum() {
    const cvk = window.sessionStorage.getItem("CVK");
    const uid = window.sessionStorage.getItem("UID");
    const userAlias = window.sessionStorage.getItem("userAlias");
    verifyLogIn(cvk, uid)
    const albumId = await getSHA256Hash(uid + ":" + cvk)

    const form = new FormData();
    form.append("userAlias", userAlias)
    const resp = await fetch(window.location.origin + `/user/registeralbum?albumId=${albumId}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) alert("Something went wrong with uploading the image");
}

function refreshDropdownOptions(respJson) {
    var dropdown = document.getElementById("dropdown")
    var options = dropdown.options
    for (var i = options.length; i > 0; i--) {
        options[i - 1].remove()
    }
    for (var i = 0; i < respJson.length; i++) {
        const name = respJson[i]
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option)
    }
}