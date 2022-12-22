import { bind } from "./viewbind.js";
import { render, setTool } from "./app.js";

class ToolbarController
{
    initialize()
    {
        this.move.addEventListener("click", () => this.onClick(this.move, "MOVE"));
        this.draw.addEventListener("click", () => this.onClick(this.draw, "DRAW"));
    }

    onClick(button, toolName)
    {
        setTool(toolName);
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

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("wheel", onWheel);

let root = bind(document.getElementById("tools"), ToolbarController, [], []);

render();