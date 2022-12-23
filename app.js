class Drag
{
    constructor()
    {
        this.dragging = false;        
    }

    start(x, y)
    {
        this.dragging = true;
        this.x0 = x;
        this.y0 = y;
        this.x1 = x;
        this.y1 = y;
    }

    stop()
    {
        this.dragging = false;
    }

    onMouseMove(x, y)
    {
        this.x0 = this.x1;
        this.y0 = this.y1;
        this.x1 = x;
        this.y1 = y;
    }

    getDx()
    {
        return this.x1 - this.x0;
    }

    getDy()
    {
        return this.y1 - this.y0;
    }
}


class TileMap
{
    constructor(bitmap)
    {
        let baseSize = 50;

        this.matrix = [];
        while (this.matrix.length < baseSize)
        {
            this.matrix.push(new Array(baseSize));
        }
        this.x0 = 0;
        this.y0 = 0;

        this.canvas = new OffscreenCanvas(50 * baseSize, 50 * baseSize);
        this.mask = new OffscreenCanvas(50 * baseSize, 50 * baseSize);
        this.pattern = context.createPattern(bitmap, "repeat");
        this.canvas.getContext("2d").fillStyle = this.pattern;
        // this.canvas.getContext("2d").fillRect(0, 0, 50 * baseSize, 50 * baseSize);
    }

    draw(x, y)
    {
        let x0 = this.x0;
        let y0 = this.y0;
        let width = this.matrix[0].length;
        let height = this.matrix.length;

        const bufferSize = 10;

        while (x <= x0)
        {
            x0 -= bufferSize;
            width += bufferSize;
            for (let row of this.matrix)
            {
                row.unshift(...new Array(bufferSize));
            }
        }

        while (x >= x0 + width - 1)
        {
            width += bufferSize;
            for (let row of this.matrix)
            {
                row.concat(...new Array(bufferSize));
            }
        }

        while (y <= y0)
        {
            y0 -= bufferSize;
            height += bufferSize;
            this.matrix.unshift(...new Array(bufferSize));
        }

        while (y >= y0 + height  - 1)
        {
            height += bufferSize;
            this.matrix.push(...new Array(bufferSize));
        }

        this.matrix[y - y0][x - x0] = true;
        this.x0 = x0;
        this.y0 = y0;

        {
            let cx = (x - x0) * 50 + 25;
            let cy = (y - y0) * 50 + 25;

            let fillWidth = 200;

            this.mask.getContext("2d").fillStyle = "black";
            const gradient = this.mask.getContext("2d").createRadialGradient(cx, cy, 20, cx, cy, 60)
            gradient.addColorStop(0, "black");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            this.mask.getContext("2d").fillStyle = gradient;
            this.mask.getContext("2d").fillRect(cx - fillWidth / 2, cy - fillWidth / 2, fillWidth, fillWidth);
            
            this.canvas.getContext("2d").globalCompositeOperation = "copy";
            this.canvas.getContext("2d").fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.canvas.getContext("2d").globalCompositeOperation = "destination-in";
            this.canvas.getContext("2d").drawImage(this.mask, 0, 0);
        }
    }

    getWidth()
    {
        return this.matrix[0].length;
    }

    getHeight()
    {
        return this.matrix.length;
    }
}

export function setTool(toolName)
{
    tool = Tools[toolName];
}

export function render(event)
{
    if (event)
    {
        if (event.type === "mousedown")
        {
            drag.start(event.x, event.y);
            drag.onMouseMove(event.x, event.y);
        }
        else if (event.type === "mousemove")
        {
            if (drag.dragging)
            {
                drag.onMouseMove(event.x, event.y);
            }
        }
        else if (event.type === "mouseup")
        {
            drag.stop();
        }
        else if (event.type === "zoom")
        {
            let zoom = Math.pow(1.1, -event.delta / 100);
            pixelsPerMeter *= zoom;
        }

        if (drag.dragging && tool === Tools.MOVE)
        {
            worldCoordinates.x -= drag.getDx() / pixelsPerMeter;
            worldCoordinates.y -= drag.getDy() / pixelsPerMeter;
        }

        if (drag.dragging && tool === Tools.DRAW)
        {
            let x = worldCoordinates.x + drag.x1 / pixelsPerMeter;
            let y = worldCoordinates.y + drag.y1 / pixelsPerMeter;
            x = Math.floor(x);
            y = Math.floor(y);
            tileMap.draw(x, y);
        }
    }

    let dx = Math.ceil(worldCoordinates.x) - worldCoordinates.x;
    let dy = Math.ceil(worldCoordinates.y) - worldCoordinates.y;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.strokeStyle = "#bfbbb1";
    context.lineWidth = 2;
    context.beginPath();

    let gridX = dx * pixelsPerMeter;
    while (gridX < canvas.width)
    {
        context.moveTo(gridX, 0);
        context.lineTo(gridX, canvas.height);
        gridX += pixelsPerMeter;
    }

    let gridY = dy * pixelsPerMeter;
    while (gridY < canvas.height)
    {
        context.moveTo(0, gridY);
        context.lineTo(canvas.width, gridY);
        gridY += pixelsPerMeter;
    }

    context.stroke();

    context.drawImage(
        tileMap.canvas,
        pixelsPerMeter * (tileMap.x0 - worldCoordinates.x), pixelsPerMeter * (tileMap.y0 - worldCoordinates.y),
        pixelsPerMeter * tileMap.getWidth(), pixelsPerMeter * tileMap.getHeight()
    );

    context.strokeStyle = "#000000";
    context.fillStyle = "#F0ECE0";
    context.lineWidth = 4;

    context.beginPath();

    for (let yOffset = 0; yOffset < tileMap.matrix.length; yOffset++)
    {
        let row = tileMap.matrix[yOffset];
        for (let xOffset = 0; xOffset < row.length; xOffset++)
        {
            if (row[xOffset])
            {                
                let x = xOffset + tileMap.x0;
                let y = yOffset + tileMap.y0;
                
                let [px, py] = [x - worldCoordinates.x, y - worldCoordinates.y];
                px *= pixelsPerMeter;
                py *= pixelsPerMeter;

                context.fillRect(px, py, pixelsPerMeter, pixelsPerMeter);

                if (!row[xOffset + 1])
                {
                    context.moveTo(px + pixelsPerMeter, py);
                    context.lineTo(px + pixelsPerMeter, py + pixelsPerMeter);
                }

                if (!row[xOffset - 1])
                {
                    context.moveTo(px, py);
                    context.lineTo(px, py + pixelsPerMeter);
                }

                if (!tileMap.matrix[yOffset + 1][xOffset])
                {
                    context.moveTo(px - 2, py + pixelsPerMeter);
                    context.lineTo(px + pixelsPerMeter + 2, py + pixelsPerMeter);
                }

                if (!tileMap.matrix[yOffset - 1][xOffset])
                {
                    context.moveTo(px - 2, py);
                    context.lineTo(px + pixelsPerMeter + 2, py);
                }
                
            }
        }
    }
    
    context.stroke();
}

export async function initialize()
{
    let bitmap;
    let imageURL = "./hatching.png";
    let image = new Image();
    image.src = imageURL;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
    });
    bitmap = await createImageBitmap(image);
    tileMap = new TileMap(bitmap);
}

export const Tools = {
    MOVE: Symbol(), DRAW: Symbol()
};

let canvas;
let worldCoordinates;
let pixelsPerMeter;
let drag;
let tileMap;
let context;
let tool;

canvas = document.querySelector("canvas");
context = canvas.getContext("2d");

worldCoordinates = { x: 0, y: 0 };
pixelsPerMeter = 30;
drag = new Drag();

tool = Tools.DRAW;