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


export class Hatching
{
    constructor(bitmap)
    {
        this.radiusInMeters = 1.5;

        let baseSize = 50;
        this.x0 = 0;
        this.y0 = 0;
        this.widthInMeters = baseSize;
        this.heightInMeters = baseSize;

        this.hatching = new OffscreenCanvas(50 * baseSize, 50 * baseSize);
        
        this.referenceHatching = new OffscreenCanvas(bitmap.width * 2, bitmap.height * 2);
        this.pattern = this.referenceHatching.getContext("2d").createPattern(bitmap, "repeat");
        this.referenceHatching.getContext("2d").fillStyle = this.pattern;
        this.referenceHatching.getContext("2d").fillRect(0, 0, 50 * baseSize, 50 * baseSize);
        
        let r = 50 * this.radiusInMeters;
        this.mask = new OffscreenCanvas(2*r, 2*r);
        let gradient = this.mask.getContext("2d").createRadialGradient(r, r, 0.25 * r, r, r, 0.75 * r)
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, "black");
        this.mask.getContext("2d").fillStyle = gradient;
        this.mask.getContext("2d").fillRect(0, 0, 2*r, 2*r);
        this.maskPixels = this.mask.getContext("2d").getImageData(0, 0, this.mask.width, this.mask.height).data
    }

    draw(x, y)
    {
        let radiusInMeters = 3;
        let bufferWidthInMeters = 10;
        let sizeChanged = false;
        
        let newX0 = this.x0;
        while (x - radiusInMeters < newX0)
        {
            newX0 -= bufferWidthInMeters;
            sizeChanged = true;
        }
        
        let newX1 = this.x0 + this.widthInMeters;
        while (x + radiusInMeters > newX1)
        {
            newX1 += bufferWidthInMeters;
            sizeChanged = true;
        }
        
        let newY0 = this.y0;
        while (y - radiusInMeters < newY0)
        {
            newY0 -= bufferWidthInMeters;
            sizeChanged = true;
        }
        
        let newY1 = this.y0 + this.heightInMeters;
        while (y + radiusInMeters > newY1)
        {
            newY1 += bufferWidthInMeters;
            sizeChanged = true;
        }

        if (sizeChanged)
        {
            let newWidth = newX1 - newX0;
            let newHeight = newY1 - newY0;

            let tempCanvas = new OffscreenCanvas(this.hatching.width, this.hatching.height);
            tempCanvas.getContext("2d").drawImage(this.hatching, 0, 0);
            this.hatching.width = 50 * newWidth;
            this.hatching.height = 50 * newHeight;
            this.hatching.getContext("2d").drawImage(tempCanvas, 50 * (this.x0 - newX0), 50 * (this.y0 - newY0));

            this.x0 = newX0;
            this.y0 = newY0;
            this.widthInMeters = newWidth;
            this.heightInMeters = newHeight;
        }

        let r  = 50 * this.radiusInMeters;
        let cx = 50 * (x - this.x0);
        let cy = 50 * (y - this.y0);

        let patchX = 50 * (x - r);
        let patchY = 50 * (y - r);
        while (patchX < 0)
        {
            patchX += this.referenceHatching.width / 2;
        }
        while (patchY < 0)
        {
            patchY += this.referenceHatching.height / 2;
        }
        while (patchX > this.referenceHatching.width / 2)
        {
            patchX -= this.referenceHatching.width / 2;
        }
        while (patchY > this.referenceHatching.height / 2)
        {
            patchY -= this.referenceHatching.height / 2;
        }

        let existingPixels = this.hatching.getContext("2d").getImageData(cx - r, cy - r, 2*r, 2*r).data;
        let referencePixels = this.referenceHatching.getContext("2d").getImageData(patchX, patchY, 2*r, 2*r).data;
        for (let i = 0; i < referencePixels.length; i += 4)
        {
            let targetAlpha = Math.min(referencePixels[i + 3], this.maskPixels[i]);
            let alpha = Math.max(targetAlpha, existingPixels[i + 3]);
            existingPixels[i + 3] = alpha;
        }
        this.hatching.getContext("2d").putImageData(new ImageData(existingPixels, 2*r, 2*r), cx - r, cy - r);
    }

    erase(x, y)
    {
        let r  = 50 * this.radiusInMeters;
        let cx = 50 * (x - this.x0);
        let cy = 50 * (y - this.y0);

        let existingPixels = this.hatching.getContext("2d").getImageData(cx - r, cy - r, 2*r, 2*r).data;
        for (let i = 0; i < existingPixels.length; i += 4)
        {
            let targetAlpha = 255 - this.maskPixels[i];
            let alpha = Math.min(targetAlpha, existingPixels[i + 3]);
            existingPixels[i + 3] = alpha;
        }
        this.hatching.getContext("2d").putImageData(new ImageData(existingPixels, 2*r, 2*r), cx - r, cy - r);
    }
}


class TileMap
{
    constructor()
    {
        let baseSize = 50;

        this.matrix = [];
        while (this.matrix.length < baseSize)
        {
            this.matrix.push(new Array(baseSize));
        }
        this.x0 = 0;
        this.y0 = 0;
    }

    draw(x, y)
    {
        x = Math.floor(x);
        y = Math.floor(y);

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
                row.push(...new Array(bufferSize));
            }
        }

        while (y <= y0)
        {
            y0 -= bufferSize;
            height += bufferSize;
            let newRows = [];
            while (newRows.length < bufferSize)
            {
                newRows.push(new Array(width));
            }
            this.matrix.unshift(...newRows);
        }

        while (y >= y0 + height  - 1)
        {
            while (this.matrix.length < height + bufferSize)
            {
                this.matrix.push(new Array(width));
            }
            height += bufferSize;
        }

        this.matrix[y - y0][x - x0] = true;
    }

    erase(x, y)
    {
        x = Math.floor(x);
        y = Math.floor(y);

        this.matrix[y - this.y0][x - this.x0] = false;
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

export class App
{
    constructor(canvas)
    {
        this.canvas = document.querySelector("canvas");
        this.context = canvas.getContext("2d");
        this.canvas.width = canvas.clientWidth;
        this.canvas.height = canvas.clientHeight;

        this.worldCoordinates = { x: 0, y: 0 };
        this.pixelsPerMeter = 30;
        this.drag = new Drag();
        this.tool = Tools.DRAW;
    }

    async initialize()
    {
        let imageURL = "./resources/hatching.png";
        let image = new Image();
        image.src = imageURL;
        await new Promise((resolve, reject) => {
            image.onload = resolve;
        });
        let bitmap = await createImageBitmap(image);
        this.tileMap = new TileMap();
        this.hatching = new Hatching(bitmap);
    }

    setTool(toolName)
    {
        this.tool = Tools[toolName];
    }

    render(event)
    {
        let {
            context,
            canvas,
            worldCoordinates,
            pixelsPerMeter,
            drag,
            tool,
            tileMap
        } = this;

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
                this.pixelsPerMeter *= zoom;
                pixelsPerMeter = this.pixelsPerMeter;
            }

            if (drag.dragging && tool === Tools.MOVE)
            {
                worldCoordinates.x -= drag.getDx() / pixelsPerMeter;
                worldCoordinates.y -= drag.getDy() / pixelsPerMeter;
            }

            if (drag.dragging)
            {
                let x = worldCoordinates.x + drag.x1 / pixelsPerMeter;
                let y = worldCoordinates.y + drag.y1 / pixelsPerMeter;
                
                if (tool === Tools.DRAW_HALLWAY)
                {
                    tileMap.draw(x, y);
                    this.hatching.draw(x, y);
                }
                else if (tool === Tools.DRAW_BACKGROUND)
                {
                    this.hatching.draw(x, y);
                }
                else if (tool === Tools.ERASE_BACKGROUND)
                {
                    this.hatching.erase(x, y);
                }
                else if (tool === Tools.ERASE_HALLWAY)
                {
                    tileMap.erase(x, y);
                }
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
            this.hatching.hatching,
            pixelsPerMeter * (this.hatching.x0 - worldCoordinates.x),
            pixelsPerMeter * (this.hatching.y0 - worldCoordinates.y),
            pixelsPerMeter * this.hatching.widthInMeters,
            pixelsPerMeter * this.hatching.heightInMeters
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
}

const Tools = {
    MOVE: Symbol(),
    DRAW_HALLWAY: Symbol(),
    ERASE_HALLWAY: Symbol(),
    DRAW_BACKGROUND: Symbol(),
    ERASE_BACKGROUND: Symbol()
};