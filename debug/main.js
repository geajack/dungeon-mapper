import { Hatching } from "../app.js";

async function initialize()
{
    let imageURL = "../hatching.png";
    let image = new Image();
    image.src = imageURL;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
    });
    let bitmap = await createImageBitmap(image);
    let hatching = new Hatching(bitmap);

    let canvas = document.querySelector("canvas");
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight;

    console.log("frame");
    hatching.draw(0.5, 15);

    console.log();
    console.log("frame");
    hatching.draw(2, 15);

    // let context = canvas.getContext("2d");
    // context.drawImage(this.hatching.hatching, 0, 0);
}

initialize();