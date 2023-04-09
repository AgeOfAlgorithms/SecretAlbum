import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';

const img_input = document.getElementById('imgfileinput')
const img_output_canvas = document.getElementById('imgfileoutput')
img_output_canvas.width = 300;
img_output_canvas.height = 300;
var ctx = img_output_canvas.getContext('2d');

intialize()

const btn_upload = document.getElementById('uploadbtn');
btn_upload.addEventListener('click', upload);

const btn_logout = document.getElementById('logoutbtn');
btn_logout.addEventListener('click', (click) => {
    window.localStorage.removeItem("CVK");
    window.localStorage.removeItem("UID");
    window.location.replace(window.location.origin);
});

const btn_account = document.getElementById('accountbtn');
btn_account.addEventListener('click', (click) => {
    showMyAlbum();
});


async function intialize() {
    var cvk = window.localStorage.getItem("CVK");
    var uid = window.localStorage.getItem("UID");
    if (!verifyLogIn(cvk, uid)) window.location.replace(window.location.origin)
}

img_input.addEventListener("change", () => {
    const ctx = img_output_canvas.getContext('2d');
    ctx.clearRect(0, 0, img_output_canvas.width, img_output_canvas.height);     // clear the canvas
    const img_instance = processImage(img_input.files[0])                       // convert img file to an Image instance
    img_instance.onload = function () {
        let width = img_instance.naturalWidth;
        let height = img_instance.naturalHeight
        const [new_width, new_height] = resizeImage(width, height);
        ctx.drawImage(img_instance, 0, 0, new_width, new_height);
    }
})

async function showMyAlbum() {
    var cvk = window.localStorage.getItem("CVK");
    cvk = BigIntToByteArray(BigInt(cvk));
    var uid = window.localStorage.getItem("UID");

    if (!verifyLogIn(cvk, uid)) return

    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall
    const resp = await fetch(window.location.origin + `/user/getdata?albumId=${albumId}`);
    const resp_text = await resp.text();
    if (resp_text == "--FAILED--") {
        alert("failed.")
        return
    }
    const resp_json = JSON.parse(resp_text);

    // set up the table and clear it
    var table = document.getElementById("tbl");
    var tbody = table.getElementsByTagName("tbody")[0];
    while (table.rows.length > 1) table.rows[1].remove();

    for (var i = 0; i < resp_json.length; i++) {
        const entry = resp_json[i]

        // Create a new row and cells
        var row = document.createElement("tr");
        var imageCell = document.createElement("td");
        var descriptionCell = document.createElement("td");
        var actionCell = document.createElement("td");

        imageCell.textContent = "image";
        descriptionCell.textContent = entry.description;
        actionCell.textContent = "action";

        row.appendChild(imageCell)
        row.appendChild(descriptionCell)
        row.appendChild(actionCell)
        tbody.appendChild(row);
    }
}

function verifyLogIn(cvk, uid) {
    if (cvk === null || uid === null) {
        alert("CVK/UID not found, please log in first")
        // window.location.replace(window.location.href + "index.html");
        localStorage.setItem("CVK", 1);
        localStorage.setItem("UID", 1);
        return false;
    }
    return true;
}

function processImage(img_file) {
    const img_url = `${URL.createObjectURL(img_file)}`
    const img_instance = new Image(150, 150);
    img_instance.src = img_url;
    return img_instance;
}

function resizeImage(width, height) {
    var ratio;
    if (width < height) {
        ratio = img_output_canvas.height / height
    } else {
        ratio = img_output_canvas.width / width
    }
    const new_height = height * ratio
    const new_width = width * ratio
    return [new_width, new_height]
}

async function upload() {
    console.log("debug upload");

    var cvk = window.localStorage.getItem("CVK");
    cvk = BigIntToByteArray(BigInt(cvk));
    var uid = window.localStorage.getItem("UID");

    if (!verifyLogIn(cvk, uid)) return; //window.location.replace(window.location.origin + "/index.html");

    // get album Id by hashing the uid & cvk
    const albumId = await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall

    // create image key and encrypt image
    const seed = RandomBigInt();
    const image_key = Point.g.times(seed).times(cvk)
    const image_key_byte_array = BigIntToByteArray(image_key.x)
    const encrypted_img_string = await encryptImage(ctx, image_key_byte_array);

    // get description
    const description_input = document.getElementById('descriptioninput')
    const description = description_input.value;

    // send the image and description to the server
    const form = new FormData();
    form.append("seed", seed)
    form.append("description", description)
    form.append("encryptedImg", encrypted_img_string);
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
    // Removes alpha to save space.
    for (var i = 0; i < arr.length; i += 4) {
        s += (String.fromCharCode(arr[i])
            + String.fromCharCode(arr[i + 1])
            + String.fromCharCode(arr[i + 2]));
    }
    return s;
}

async function encryptImage(ctx, cvk) {
    var img_data = ctx.getImageData(0, 0, img_output_canvas.width, img_output_canvas.height);
    var pixel_array = img_data.data;
    var img_string = pixelArrToString(pixel_array);
    return await encryptData(img_string, cvk);
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