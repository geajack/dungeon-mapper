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
        this.drawnTiles = new Set();
    }

    draw(x, y)
    {
        this.drawnTiles.add([x, y]);
    }

    getDrawnTiles()
    {
        return this.drawnTiles;
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

    for (let [x, y] of tileMap.getDrawnTiles())
    {
        let [px, py] = [x - worldCoordinates.x, y - worldCoordinates.y];
        px *= pixelsPerMeter;
        py *= pixelsPerMeter;
        context.rect(px, py, pixelsPerMeter, pixelsPerMeter);
    }
    context.fill();
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

function onClickMoveTool()
{
    tool = Tools.MOVE;
}

function onClickDrawTool()
{
    tool = Tools.DRAW;
}

let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("wheel", onWheel);

render();