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
    constructor()
    {
        this.matrix = [];
        while (this.matrix.length < 200)
        {
            this.matrix.push(new Array(200));
        }
        this.x0 = 0;
        this.y0 = 0;
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

    context.strokeStyle = "#000000";
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

let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");

let worldCoordinates = { x: 0, y: 0 };
let pixelsPerMeter = 30;
let drag = new Drag();
let tileMap = new TileMap();

export const Tools = {
    MOVE: Symbol(), DRAW: Symbol()
};
let tool = Tools.DRAW;