import { bind } from "./viewbind.js";
import { App } from "./app.js";

class ToolbarController
{
    initialize()
    {
        for (let button of this.buttons)
        {
            button.addEventListener("click", () => this.onClick(button));
        }
    }

    onClick(button)
    {
        app.setTool(button.tool);
        for (let button of this.buttons)
        {
            button.classList.remove("selected");
        }
        button.classList.add("selected");
    }
}

function onMouseDown(event)
{
    let [x, y] = [event.offsetX, event.offsetY];
    app.render(
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
    app.render(
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
    app.render(
        {
            type: "mousemove",
            x: x,
            y: y
        }
    );
}

function onWheel(event)
{
    app.render(
        {
            type: "zoom",
            delta: event.deltaY
        }
    );
}

async function initialize()
{
    await app.initialize();
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);
    app.render();
}

let canvas = document.querySelector("canvas");
let toolbar = bind(document.getElementById("tools"), ToolbarController, [], []);
let app = new App(canvas);

addEventListener("resize", () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    app.render()
});

initialize();