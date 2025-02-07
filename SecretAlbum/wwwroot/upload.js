import Point from "https://cdn.jsdelivr.net/gh/tide-foundation/Tide-h4x2-2@main/H4x2-Node/H4x2-Node/wwwroot/modules/H4x2-TideJS/Ed25519/point.js";
import { signIn, signUp, AES, Utils, EdDSA, Hash } from 'https://cdn.jsdelivr.net/gh/tide-foundation/heimdall@main/heimdall.js';
import { canvasWidth, canvasHeight, encryptImage, verifyLogIn, processImage, getTime } from "/utils.js"

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
    const [uid, cvk] = verifyLogIn()
    const timeMsg = btoa(await getTime())
    const sig = await EdDSA.sign(timeMsg, BigInt(cvk))

    // create image key and encrypt image
    const seed = Utils.RandomBigInt();
    const imageKey = Point.g.times(seed)
    const encSeed = await AES.encryptData(seed.toString(), BigInt(cvk))

    var ctx = uploadCanvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const encryptedImgString = await encryptImage(imgData, imageKey.toArray());

    // get description
    const descriptionInput = document.getElementById('descriptioninput')
    const description = descriptionInput.value;

    // send the image and description to the server
    const form = new FormData();
    form.append("seed", encSeed)
    form.append("description", description)
    form.append("encryptedImg", encryptedImgString)
    form.append("jwt", timeMsg + "." + sig)
    const resp = await fetch(window.location.origin + `/user/addImage?albumId=${uid}`, {
        method: 'POST',
        body: form
    });
    if (!resp.ok) {
        alert("Something went wrong with uploading the image.")
    }
    else {
        alert("Request complete.")
    }
}
