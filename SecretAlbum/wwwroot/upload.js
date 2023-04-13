import { encryptData, decryptData } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/AES.js";
import { BigIntToByteArray, RandomBigInt } from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Tools/Utils.js";
import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, encryptImage, verifyLogIn, getSHA256Hash } from "/utils.js"

export const imgInput = document.getElementById('imgfileinput')
export const uploadCanvas = document.getElementById('imgfileoutput')

imgInput.addEventListener("change", () => {
    uploadCanvas.width = canvasWidth
    uploadCanvas.height = canvasHeight
    const ctx = uploadCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);         // clear the canvas
    const imgInstance = processImage(imgInput.files[0])     // convert img file to an Image instance
    imgInstance.onload = function () {
        let width = imgInstance.naturalWidth;
        let height = imgInstance.naturalHeight
        const [newX, newY, newWidth, newHeight] = getNewSizeAndPlacement(width, height);
        ctx.drawImage(imgInstance, newX, newY, newWidth, newHeight);
    }
})

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

export async function upload() {
    var cvk = window.localStorage.getItem("CVK");
    var uid = window.localStorage.getItem("UID");
    verifyLogIn(cvk, uid)
    const albumId = await await getSHA256Hash(uid + ":" + cvk) // TODO: hash it with heimdall
    console.log(albumId)

    // create image key and encrypt image
    const seed = RandomBigInt();
    const encryptedSeed = await encryptData(seed.toString(), BigIntToByteArray(BigInt(cvk)))
    const imageKey = Point.g.times(seed).times(BigInt(cvk))
    const imageKeyByteArray = BigIntToByteArray(imageKey.x)
    var ctx = uploadCanvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const encryptedImgString = await encryptImage(imgData, imageKeyByteArray);

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
}
