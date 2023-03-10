async function loadImage(url)
{
    let image = new Image();
    image.src = url;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
    });
    return image;
}


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
        this.referenceHatching.getContext("2d").fillStyle = "#de6300";
        this.referenceHatching.getContext("2d").fillRect(0, 0, 50 * baseSize, 50 * baseSize);
        this.referenceHatching.getContext("2d").fillStyle = this.pattern;
        this.referenceHatching.getContext("2d").globalCompositeOperation = "destination-in";
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

    async serialize()
    {
        return {
            x0: this.x0,
            y0: this.y0,
            widthInMeters: this.widthInMeters,
            heightInMeters: this.heightInMeters,
            hatching: await this.hatching.convertToBlob()
        };
    }

    async deserialize(data)
    {
        this.x0 = data.x0;
        this.y0 = data.y0;
        this.widthInMeters = data.widthInMeters;
        this.heightInMeters = data.heightInMeters;
        this.hatching = new OffscreenCanvas(this.widthInMeters * 50, this.heightInMeters * 50);

        let bitmap = await createImageBitmap(data.hatching);
        this.hatching.getContext("2d").drawImage(bitmap, 0, 0);
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
            existingPixels[i] = referencePixels[i];
            existingPixels[i + 1] = referencePixels[i + 1];
            existingPixels[i + 2] = referencePixels[i + 2];
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

    deserialize(data)
    {
        this.x0 = data.x0;
        this.y0 = data.y0;
        this.matrix = data.matrix;
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

        this.x0 = x0;
        this.y0 = y0;
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

        this.x = 0;
        this.y = 0;
        this.pixelsPerMeter = 30;
        this.drag = new Drag();
        this.tool = Tools.DRAW;
    }

    async initialize()
    {
        this.symbols = [];
        this.currentSymbol = "stairsdown";

        this.symbolSet = {
            "stairsdown": await loadImage("./resources/stairsdown.png"),
            "stairsup": await loadImage("./resources/stairsup.png"),
            "chest": await loadImage("./resources/chest.png"),
            "star": await loadImage("./resources/star.png"),
        };
        
        await this.reset();
    }

    async deserialize(data)
    {
        this.tileMap.deserialize(data.foreground);
        this.symbols = data.symbols;
        await this.hatching.deserialize(data.background);
    }

    async serialize()
    {
        return {
            "foreground": this.tileMap,
            "background": await this.hatching.serialize(),
            "symbols": this.symbols
        }
    }

    async reset()
    {
        this.tileMap = new TileMap();
        let image = await loadImage("./resources/hatching.png");
        let bitmap = await createImageBitmap(image, { resizeWidth: 300, resizeHeight: 300 });
        this.hatching = new Hatching(bitmap);
    }

    setTool(toolName)
    {
        this.tool = Tools[toolName];
    }

    setSymbol(symbolName)
    {
        this.currentSymbol = symbolName;
    }

    async render(event)
    {
        let {
            context,
            canvas,
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
                if (this.onStateChanged)
                {
                    this.onStateChanged();
                }
            }
            else if (event.type === "zoom")
            {
                let zoom = Math.pow(1.1, -event.delta / 100);
                this.pixelsPerMeter *= zoom;
                pixelsPerMeter = this.pixelsPerMeter;
            }

            if (drag.dragging && tool === Tools.MOVE)
            {
                this.x -= drag.getDx() / pixelsPerMeter;
                this.y -= drag.getDy() / pixelsPerMeter;
            }

            if (drag.dragging)
            {
                let mouseWorldX = this.x + drag.x1 / pixelsPerMeter;
                let mouseWorldY = this.y + drag.y1 / pixelsPerMeter;
                
                if (tool === Tools.DRAW_HALLWAY)
                {
                    tileMap.draw(mouseWorldX, mouseWorldY);
                    this.hatching.draw(mouseWorldX, mouseWorldY);
                }
                else if (tool === Tools.DRAW_BACKGROUND)
                {
                    this.hatching.draw(mouseWorldX, mouseWorldY);
                }
                else if (tool === Tools.ERASE_BACKGROUND)
                {
                    this.hatching.erase(mouseWorldX, mouseWorldY);
                }
                else if (tool === Tools.ERASE_HALLWAY)
                {
                    tileMap.erase(mouseWorldX, mouseWorldY);
                }
                else if (tool === Tools.DRAW_SYMBOL)
                {
                    this.symbols.push(
                        {
                            x: Math.floor(mouseWorldX),
                            y: Math.floor(mouseWorldY),
                            symbol: this.currentSymbol
                        }
                    );
                }
                else if (tool === Tools.ERASE_SYMBOL)
                {
                    let x = Math.floor(mouseWorldX);
                    let y = Math.floor(mouseWorldY);
                    this.symbols = this.symbols.filter(item => item.x !== x || item.y !== y);
                }
            }
        }

        let dx = Math.ceil(this.x) - this.x;
        let dy = Math.ceil(this.y) - this.y;
        
        context.fillStyle = "#111";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.strokeStyle = "#291e10";
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
            pixelsPerMeter * (this.hatching.x0 - this.x),
            pixelsPerMeter * (this.hatching.y0 - this.y),
            pixelsPerMeter * this.hatching.widthInMeters,
            pixelsPerMeter * this.hatching.heightInMeters
        );

        context.strokeStyle = "#de6300";
        context.fillStyle = "#111";
        context.lineWidth = 4;

        context.beginPath();

        for (let yOffset = 0; yOffset < tileMap.matrix.length; yOffset++)
        {
            let row = tileMap.matrix[yOffset];
            for (let xOffset = 0; xOffset < row.length; xOffset++)
            {
                if (row[xOffset])
                {                
                    let tileX = xOffset + tileMap.x0;
                    let tileY = yOffset + tileMap.y0;
                    
                    let [px, py] = [tileX - this.x, tileY - this.y];
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

        for (let symbol of this.symbols)
        {
            let [px, py] = [symbol.x - this.x, symbol.y - this.y];
            px *= pixelsPerMeter;
            py *= pixelsPerMeter;
            context.drawImage(
                this.symbolSet[symbol.symbol],
                px + 4,
                py + 4,
                pixelsPerMeter - 8, 
                pixelsPerMeter - 8
            );
        }
    }
}

const Tools = {
    MOVE: Symbol(),
    DRAW_HALLWAY: Symbol(),
    ERASE_HALLWAY: Symbol(),
    DRAW_BACKGROUND: Symbol(),
    ERASE_BACKGROUND: Symbol(),
    DRAW_SYMBOL: Symbol(),
    ERASE_SYMBOL: Symbol()
};