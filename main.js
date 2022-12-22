import { bind } from "./viewbind.js";

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

        while (x <= x0)
        {
            x0 -= 100;
            width += 100;
            for (let row of this.matrix)
            {
                row.unshift(...new Array(100));
            }
        }

        while (x >= x0 + width - 1)
        {
            width += 100;
            for (let row of this.matrix)
            {
                row.concat(...new Array(100));
            }
        }

        while (y <= y0)
        {
            y0 -= 100;
            height += 100;
            this.matrix.unshift(...new Array(100));
        }

        while (y >= y0 + height  - 1)
        {
            height += 100;
            this.matrix.push(...new Array(100));
        }

        this.matrix[y - y0][x - x0] = true;
        this.x0 = x0;
        this.y0 = y0;
    }

    getDrawnTiles()
    {
        let tiles = [];
        for (let y = 0; y < this.matrix.length; y++)
        {
            for (let x = 0; x < this.matrix[y].length; x++)
            {
                if (this.matrix[y][x])
                {
                    tiles.push([x + this.x0, y + this.y0]);
                }
            }
        }
        return tiles;
    }
}


let worldCoordinates = { x: 0, y: 0 };
let pixelsPerMeter = 30;
let drag = new Drag();
let tileMap = new TileMap();

const Tools = {
    MOVE: Symbol(), DRAW: Symbol()
};
let tool = Tools.DRAW;

function render(event)
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
                    context.moveTo(px, py + pixelsPerMeter);
                    context.lineTo(px + pixelsPerMeter, py + pixelsPerMeter);
                }

                if (!tileMap.matrix[yOffset - 1][xOffset])
                {
                    context.moveTo(px, py);
                    context.lineTo(px + pixelsPerMeter, py);
                }
            }
        }
    }

    context.stroke();

    // for (let [x, y] of tileMap.getDrawnTiles())
    // {
    //     if ()

    //     let [px, py] = [x - worldCoordinates.x, y - worldCoordinates.y];
    //     px *= pixelsPerMeter;
    //     py *= pixelsPerMeter;
    //     context.strokeRect(px, py, pixelsPerMeter, pixelsPerMeter);
    // }
}

class ToolbarController
{
    initialize()
    {
        this.move.addEventListener("click", () => this.onClick(this.move, "MOVE"));
        this.draw.addEventListener("click", () => this.onClick(this.draw, "DRAW"));
    }

    onClick(button, toolName)
    {
        tool = Tools[toolName];
        this.move.classList.remove("selected");
        this.draw.classList.remove("selected");
        button.classList.add("selected");
    }
}

function onMouseDown(event)
{
    let [x, y] = [event.offsetX, event.offsetY];
    render(
        {
            type: "mousedown",
            x: x,
            y: y
        }
    );
}

function onMouseUp(event)
{
    let [x, y] = [event.offsetX, event.offsetY];
    render(
        {
            type: "mouseup",
            x: x,
            y: y
        }
    );
}

function onMouseMove(event)
{
    let [x, y] = [event.offsetX, event.offsetY];
    render(
        {
            type: "mousemove",
            x: x,
            y: y
        }
    );
}

function onWheel(event)
{
    render(
        {
            type: "zoom",
            delta: event.deltaY
        }
    );
}

let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("wheel", onWheel);

let root = bind(document.getElementById("tools"), ToolbarController, [], []);

render();