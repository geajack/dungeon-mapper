import { bind } from "./viewbind.js";
import { App } from "./app.js";

class ToolbarController
{
    initialize()
    {
        for (let button of this.tools)
        {
            button.addEventListener("click", () => this.onClickTool(button));
        }

        for (let button of this.subtools)
        {
            button.addEventListener("click", () => this.onClickSubtool(button));
        }

        this.tool = "HALLWAY";

        this.subtoolChoices = {
            "HALLWAY": "DRAW",
            "BACKGROUND": "DRAW",
            "SYMBOL": "stairsdown"
        };

        this.setTool();
    }

    setTool()
    {
        let tool = this.tool;
        if (tool !== "SYMBOL")
        {
            if (this.subtoolChoices[tool])
            {
                tool = this.subtoolChoices[tool] + "_" + tool;
            }
            app.setTool(tool);
        }
        else
        {
            if (this.subtoolChoices[tool] !== "ERASE")
            {
                app.setTool("DRAW_SYMBOL");
                app.setSymbol(this.subtoolChoices[tool]);
            }
            else
            {
                app.setTool("ERASE_SYMBOL");
            }
        }
    }

    onClickTool(button)
    {
        // app.setTool(button.tool);
        for (let button of this.tools)
        {
            button.classList.remove("selected");
        }
        button.classList.add("selected");

        if (button.subtools == "yes")
        {
            this.subtoolBox.style.display = "flex";

            let subtool = this.subtoolChoices[button.tool];
            for (let button of this.subtools)
            {
                button.classList.remove("selected");
                if (button.tool == subtool)
                {
                    button.classList.add("selected");
                }
            }            
        }
        else
        {
            this.subtoolBox.style.display = "none";
        }

        if (button.tool == "SYMBOL")
        {
            this.symbolBox.style.display = "flex";
            this.subtoolBox.style.display = "none";
        }
        else
        {
            this.symbolBox.style.display = "none";
            this.subtoolBox.style.display = "flex";
        }

        this.tool = button.tool;

        this.setTool();
    }
    
    onClickSubtool(button)
    {
        // app.setTool(button.tool);
        for (let button of this.subtools)
        {
            button.classList.remove("selected");
        }
        button.classList.add("selected");
        
        this.subtoolChoices[this.tool] = button.tool;
        this.setTool();
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

function onTouchStart(event)
{
    let [x, y] = [event.touches[0].clientX, event.touches[0].clientY];
    app.render(
        {
            type: "mousedown",
            x: x,
            y: y
        }
    );
}

function onTouchEnd(event)
{
    let [x, y] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
    app.render(
        {
            type: "mouseup",
            x: x,
            y: y
        }
    );
}

function onTouchMove(event)
{
    let [x, y] = [event.touches[0].clientX, event.touches[0].clientY];
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
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("wheel", onWheel);
    app.render();
}

let canvas = document.querySelector("canvas");
let app = new App(canvas);
let toolbar = bind(document.querySelector("footer"), ToolbarController, [], []);

addEventListener("resize", () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    app.render()
});

initialize();