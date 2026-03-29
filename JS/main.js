import { state, TOOLS } from "./state.js";

import {
    Uniform_pos,
    add_to_history,
    current_drawing,
    restore_drawing,
    BrushSelection,
    BrushDetector,
    RectangleSelection,
    SquareSelector,
    CircleSelector,
    TriangleSelector,
    LineSelector,
    ActualCircleDetection,
    TriangleDetector,
    LineDetector,
    GetSelectionArea,
    DetectObject,
    ObjectClick
} from "./helpers.js";

let count = 0;

let Stroke = null;

let Resizing = false;
let ResizeHandle = null;

let rotating = false;
let current = null;

let Draggin =false;
let drag_x=0;
let drag_y=0;
let initial_drag_coords= {};

// buttons
const buttons = document.querySelectorAll(".tools button");

let panel = document.getElementById("properties");

let canvas = document.getElementById("Canvas");
let tool = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}

window.addEventListener("resize", function() {
    if (document.querySelector(".textbox")) return;
    resizeCanvas();
});
resizeCanvas();

// Bin

let ClearScreen = document.getElementById("Bin");
ClearScreen.addEventListener("click", function() {
    if (state.objects.length===0){
        return;
    }
    add_to_history(state);
    state.objects = [];
    tool.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem("drawing");
    Save();
    render();
});

//Undo

let Undo = document.getElementById("Undo");
Undo.addEventListener("click", function() {
    if (state.history.length === 0) {
        return;
    }
    state.redoStack.push(current_drawing(state));
    let snapshot = state.history.pop();
    restore_drawing(state, snapshot, render)
    Save();
    render();
});

function Undo_Z() {
    if (state.history.length === 0) {
        return;
    }
    state.redoStack.push(current_drawing(state));
    let snapshot = state.history.pop();
    restore_drawing(state, snapshot, render);
    Save();
    render();
}

document.addEventListener("keydown",function(e){
    let command= e.ctrlKey || e.metaKey;
    if (command && e.key==="z"){
        e.preventDefault();
        Undo_Z();
    }
}); 

//Redo

let Redo = document.getElementById("Redo");
Redo.addEventListener("click", function() {
    if (state.redoStack.length === 0) {
        return;
    }
    state.history.push(current_drawing(state));
    let snapshot = state.redoStack.pop();
    restore_drawing(state, snapshot, render);
    Save();
    render();
});


// image logic

let ImageButton= document.getElementById("Image");
ImageButton.addEventListener("click",function(e){
    Insert_Image();
});

function Insert_Image(){
    let seed = Math.floor(Math.random() * 1000);
    let url = "https://picsum.photos/seed/" + seed + "/300/200";
    let img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function(){
        add_to_history(state);
        let item = {};
        count+=1;
        item.id = count;
        item.type = TOOLS.image;
        item.x = Math.random() * canvas.width;
        item.y = Math.random() * canvas.height;
        item.width = img.width;
        item.height = img.height;
        item.src = url;
        item.img = img;
        item.rotation = 0;
        state.objects.push(item);
        Save();
        render();
    };
    img.src = url;
}

function Sidebar(tool) {
    panel.innerHTML = "";

    if (tool === TOOLS.rectangle || tool === TOOLS.square || tool === TOOLS.circle || tool === TOOLS.triangle) {
        panel.innerHTML = `
        <div class="control">
            <label>Colour</label>
            <input type="color" id="fill" value="${state.fill}">
        </div>
        <div class ="control">
            <label>Border</label>
            <input type="color" id="border" value="${state.border}">
        </div>
        <div class="control">
            <label>Width</label>
            <input type="number" id="size" min="1" max="100" value="${state.size}">
        </div>
        <div class="control">
            <label>Opacity</label>
            <input type="range" id="opacity" min="0" max="1" step="0.1" value="${state.opacity}">
        </div>
        <div class="control">
            <label class="toggle">Fill Empty</label>
            <input type="checkbox" id="empty" ${state.empty ? "checked" : ""}>
            <span class="switch"></span>
        </div>
        <div class="control">
            <label class="toggle">Border Empty</label>
            <input type = "checkbox" id="BorderEmpty" ${state.BorderEmpty ? "checked" : ""}>
            <span class="switch"></span>
        </div>
        `;
    }

    if (tool === TOOLS.line ) {
        panel.innerHTML = `
        <div class="control">
            <label>Colour</label>
            <input type="color" id="fill" value="${state.fill}">
        </div>
        <div class="control">
            <label>Width</label>
            <input type="number" id="size" min="1" max="100" value="${state.size}">
        </div>
        <div class="control">
            <label>Opacity</label>
            <input type="range" id="opacity" min="0" max="1" step="0.1" value="${state.opacity}">
        </div>
        `;
    }

    if (tool === TOOLS.brush) {
        panel.innerHTML = `
        <div class="control">
            <label>Colour</label>
            <input type="color" id="color" value="${state.fill}">
        </div>
        <div class="control">
            <label>Width</label>
            <input type="number" id="size" min="0" max="100" value="${state.size}">
        </div>
        <div class="control">
            <label>Opacity</label>
            <input type="range" id="opacity" min="0" max="1" step="0.1" value="${state.opacity}">
        </div>
        <div class="control">
            <label>Brush Style</label>
            <select id="brush_style">
                <option value="pen">Pen</option>
                <option value="spray">Spray</option>
                <option value="dashed">Dashed</option>
            </select>
        </div>
        `;
    } 
    if (tool === TOOLS.text) {
        state.size = 20;
        panel.innerHTML = `
        <div class="control">
            <label>Colour</label>
            <input type="color" id="fill" value="${state.fill}">
        </div>
        <div class="control">
            <label>Font Size</label>
            <input type="number" id="size" min="10" max="100" value="${state.size}">
        </div>
        <div class="control">
            <label>Opacity</label>
            <input type="range" id="opacity" min="0" max="1" step="0.1" value="${state.opacity}">
        </div>
        `;
    }

  // actually applying the functions
  Sidework();
}

function Clicked(event) {
    let ClickedButton = event.currentTarget;
    state.selected=null
    render();

    state.tool = ClickedButton.id;

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
    ClickedButton.classList.add("active");
    Sidebar(state.tool);
}

for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", Clicked);
}

function DrawRotatedBox(current) {
    tool.save();

    let cx = current.x + current.width / 2;
    let cy = current.y + current.height / 2;

    tool.translate(cx, cy);
    tool.rotate(current.rotation || 0);

    let w = current.width;
    let h = current.height;

    tool.strokeStyle = "blue";
    tool.lineWidth = 2;
    tool.strokeRect(-w / 2, -h / 2, w, h);

    let area = {
        x: -w / 2,
        y: -h / 2,
        width: w,
        height: h
    };

    ResizingShapes(area);
    ResizeRotateHandle(area);

    tool.restore();
}


function render() {
    tool.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < state.objects.length; i++) {
        let current = state.objects[i];

        // brush
        if (current.type === TOOLS.brush) {
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
            let points = current.points;
            let style = current.brush_style || "pen";

            if (style === "pen") {
                tool.strokeStyle = current.stroke;
                tool.lineWidth = current.StrokeWidth;
                tool.lineCap = "round";
                tool.lineJoin = "round";
                if (points.length > 0) {
                    tool.beginPath();
                    tool.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        tool.lineTo(points[i].x, points[i].y);
                    }
                    tool.stroke();
                }
                
                
            } 
            else if (style === "spray") {
                tool.fillStyle = current.stroke;
                for (let i = 0; i < points.length; i++) {
                    tool.beginPath();
                    tool.arc(points[i].x, points[i].y, 1, 0, Math.PI * 2);
                    tool.fill();
                }
                
            } 
            else if (style === "dashed") {
                tool.strokeStyle = current.stroke;
                tool.lineWidth = current.StrokeWidth;
                tool.lineCap = "round";
                let dash = current.StrokeWidth * 2;
                let gap = current.StrokeWidth * 1.5;
                tool.setLineDash([dash, gap]);
                if (points.length > 0) {
                    tool.beginPath();
                    tool.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        tool.lineTo(points[i].x, points[i].y);
                    }
                    tool.stroke();
                }
            
                tool.setLineDash([]);
            }

        if (state.selected === current) {
            let area = BrushSelection(current);
            tool.strokeStyle = "blue";
            tool.lineWidth = 1;
            tool.strokeRect(area.x, area.y, area.width, area.height);
        }
        tool.globalAlpha = 1;
    }

        // shapes
        if (current.type === TOOLS.rectangle) {
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
            tool.save();
            let cx = current.x + current.width / 2;
            let cy = current.y + current.height / 2;
            tool.translate(cx, cy);
            tool.rotate(current.rotation || 0);
            tool.fillStyle = current.fill;
            tool.strokeStyle = current.stroke;
            tool.lineWidth = current.StrokeWidth;
            if (!current.empty){
                tool.fillRect(-current.width/2, -current.height/2, current.width, current.height);
            }
            if (!current.BorderEmpty){
                tool.strokeRect(-current.width/2, -current.height/2, current.width, current.height); 
            }
            if (state.selected === current) {
                tool.restore();
                tool.globalAlpha = 1;
                DrawRotatedBox(current);
            }
            else {
                tool.restore();
                tool.globalAlpha = 1;
            }
            
        }

        if (current.type === TOOLS.square) {
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
            tool.save();
            let cx = current.x + current.width / 2;
            let cy = current.y + current.height / 2;
            tool.translate(cx, cy);
            tool.rotate(current.rotation || 0);
            tool.fillStyle = current.fill;
            tool.strokeStyle = current.stroke;
            tool.lineWidth = current.StrokeWidth;
            if (!current.empty){
                    tool.fillRect(-current.width/2, -current.height/2, current.width, current.height);
            }
            if (!current.BorderEmpty){
                    tool.strokeRect(-current.width/2, -current.height/2, current.width, current.height); 
            }
            if (state.selected === current) {
                    tool.restore();
                    tool.globalAlpha = 1;
                    DrawRotatedBox(current);
            }
            else {
                tool.restore();
                tool.globalAlpha = 1;
            }
            
        }
    
        if (current.type === TOOLS.circle) {
            tool.save();
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
            tool.beginPath();
            tool.arc(current.x, current.y, current.rad, 0, Math.PI * 2);
            tool.fillStyle = current.fill;
            tool.strokeStyle = current.stroke;
            tool.lineWidth = current.StrokeWidth;
            if (!current.empty){
                tool.fill();
            }
            if(!current.BorderEmpty){
                tool.stroke();
            }
            if (state.selected===current){
                let area = CircleSelector(current);
                tool.strokeStyle="blue";
                tool.lineWidth=2;
                tool.strokeRect(area.x, area.y, area.width, area.height);
                ResizingShapes(area);
            }
            
            
        }
        if (current.type === TOOLS.triangle) {
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
            tool.save();
            let tcx = (current.X1 + current.X2 + current.X3) / 3;
            let tcy = (current.Y1 + current.Y2 + current.Y3) / 3;
            tool.translate(tcx, tcy);
            tool.rotate(current.rotation || 0);
            tool.beginPath();
            tool.moveTo(current.X1 - tcx, current.Y1 - tcy);
            tool.lineTo(current.X2 - tcx, current.Y2 - tcy);
            tool.lineTo(current.X3 - tcx, current.Y3 - tcy);
            tool.closePath();
            tool.fillStyle = current.fill;
            tool.strokeStyle = current.stroke;
            tool.lineWidth = current.StrokeWidth;
            if (!current.empty){
                    tool.fill();
            }
            if (!current.BorderEmpty){
                    tool.stroke();
            }
            tool.restore();
            tool.globalAlpha = 1;
            if (state.selected===current){
                let area = TriangleSelector(current);
                tool.strokeStyle="blue";
                tool.lineWidth=3;
                tool.save();
                let tcx = (current.X1 + current.X2 + current.X3) / 3;
                let tcy = (current.Y1 + current.Y2 + current.Y3) / 3;
                tool.translate(tcx, tcy);
                tool.rotate(current.rotation || 0);
                tool.beginPath();
                tool.moveTo(current.X1 - tcx, current.Y1 - tcy);
                tool.lineTo(current.X2 - tcx, current.Y2 - tcy);
                tool.lineTo(current.X3 - tcx, current.Y3 - tcy);
                tool.closePath();
                tool.stroke();
                tool.restore();
                ResizingShapes(area)
                ResizeRotateHandle(area)
            }
            
        }
    
        if (current.type === TOOLS.line) {
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;

            tool.save();

            let cx = (current.x + current.lastX) / 2;
            let cy = (current.y + current.lastY) / 2;

            tool.translate(cx, cy);
            tool.rotate(current.rotation || 0);

            let dx = current.lastX - current.x;
            let dy = current.lastY - current.y;

            tool.beginPath();
            tool.moveTo(-dx/2, -dy/2);
            tool.lineTo(dx/2, dy/2);
            tool.strokeStyle = current.stroke;
            tool.lineWidth = current.StrokeWidth;
            tool.stroke();

            tool.restore();
            tool.globalAlpha = 1;
            if (state.selected === current) {
                tool.strokeStyle = "blue";
                tool.lineWidth = 2;
                tool.save();
                tool.translate(cx, cy);
                tool.rotate(current.rotation || 0);
                let localArea = {
                    x: -Math.abs(dx)/2, y: -Math.abs(dy)/2,
                    width: Math.abs(dx),  height: Math.abs(dy)
                };
                tool.strokeRect(localArea.x, localArea.y, localArea.width, localArea.height);
                ResizingShapes(localArea);    
                ResizeRotateHandle(localArea); 
                tool.restore();
            }
            
        }
    
        // image
    
        if (current.type === TOOLS.image && current.img && current.img.complete) {
            tool.save();
            let icx = current.x + current.width / 2;
            let icy = current.y + current.height / 2;
            tool.translate(icx, icy);
            tool.rotate(current.rotation || 0);
            tool.drawImage(current.img, -current.width/2, -current.height/2, current.width, current.height);
            tool.restore();
            if (state.selected === current) {
                let area = {
                    x: current.x,
                    y: current.y,
                    width: current.width,
                    height: current.height
                };
                tool.strokeStyle = "blue";
                tool.lineWidth = 2;
                tool.strokeRect(area.x, area.y, area.width, area.height);
                DrawRotatedBox(current);
            }
            
        }
    
        // text
    
        if (current.type === TOOLS.text) {
            tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
            tool.fillStyle = current.fill;
            let fontSize = current.fontSize || 20;
            let fontFamily = current.fontFamily || "Arial";
            tool.font = fontSize + "px " + fontFamily;
            tool.textBaseline = "top";
            let lines = current.text.split("\n");
            for (let j = 0; j < lines.length; j++) {
                tool.fillText(lines[j], current.x, current.y + j * fontSize);
            }
            tool.globalAlpha = 1;
            if (state.selected === current) {
                tool.strokeStyle = "blue";
                tool.lineWidth = 3;
                tool.strokeRect(current.x, current.y, current.width, current.height);
            }
        }
        
    }
}

let editing = false;

function startEdit() {
    if (!editing && state.selected) {
        add_to_history(state);
        editing = true;
    }
}

function endEdit() {
    editing = false;
    Save();
}

function Sidework() {
    let v_size = document.getElementById("size");
    let v_fill = document.getElementById("fill");
    let v_color = document.getElementById("color");
    let v_border = document.getElementById("border");
    let v_image = document.getElementById("image");
    let v_opacity = document.getElementById("opacity");
    let v_style = document.getElementById("brush_style");
    let v_empty= document.getElementById("empty");
    let v_BorderEmpty = document.getElementById("BorderEmpty");

    function startChange() {
        if (state.selected) add_to_history(state);
    }

    if (v_size){
        v_size.addEventListener("pointerdown", startChange);
    }
    if (v_fill){
        v_fill.addEventListener("pointerdown", startChange);
    }
    if (v_color){
        v_color.addEventListener("pointerdown", startChange);
    }
    if (v_border){
        v_border.addEventListener("pointerdown", startChange);
    }
    if (v_opacity) {
        v_opacity.addEventListener("pointerdown", startChange);
    }
    if (v_style){
        v_style.addEventListener("pointerdown", startChange);
    }

    if (v_size) {
        v_size.addEventListener("input", function(e) {
            state.size = Math.max(1, parseInt(e.target.value));
            if (state.selected) {
                if (state.selected.type === TOOLS.text){
                    state.selected.fontSize = state.size;
                }
                else{
                    state.selected.StrokeWidth = state.size;
                }
                render(); 
                Save();
            }
        });
    }

    if (v_fill) {
        v_fill.addEventListener("input", function(e) {
            state.fill = e.target.value;
            if (state.selected) {
                if (state.selected.type === TOOLS.line || state.selected.type === TOOLS.brush){
                    state.selected.stroke = e.target.value;
                }
                else{
                    state.selected.fill = e.target.value;
                }
                render(); 
                Save();
            }
        });
    }

    if (v_color) {
        v_color.addEventListener("input", function(e) {
            state.stroke = e.target.value;
            if (state.selected) { 
                state.selected.stroke = e.target.value; 
                render(); 
                Save(); 
            }
        });
    }

    if (v_border) {
        v_border.addEventListener("input", function(e) {
            state.border = e.target.value;
            if (state.selected) { 
                state.selected.stroke = e.target.value; 
                render(); 
                Save(); 
            }
        });
    }

    if (v_image) {
        v_image.addEventListener("change", function(e) {
            let upload = e.target.files[0];
            if (!upload) {
                return;
            }
 
            let reader = new FileReader();
            reader.onload = function(event) {
                let img = new Image();
                img.src = event.target.result;
                img.onload = function() {
                    let item = {};
                    count += 1;
                    item.id = count;
                    item.type = TOOLS.image;
                    item.x = 50 + Math.random() * 200;
                    item.y = 50 + Math.random() * 200;
                    item.width = img.width;
                    item.height = img.height;
                    item.src = event.target.result;
                    item.img = img;
                    add_to_history(state);
                    state.objects.push(item);
                    Save();
                    render();
                };
            };
            reader.readAsDataURL(upload);
        });
    }

    if (v_opacity){
        v_opacity.addEventListener("input", function(e){
            state.opacity= parseFloat(e.target.value);
            if (state.selected) { 
                state.selected.opacity = state.opacity; 
                render(); 
                Save(); 
            }
        });
    }

    if (v_style) {
        v_style.addEventListener("change", function(e){
            state.brush_style = e.target.value;
            if (state.selected) { 
                state.selected.brush_style = e.target.value; 
                render(); 
                Save(); 
            }
        });
    }

    if (v_empty) {
        v_empty.addEventListener("change", function(e){
            state.empty= e.target.checked;
            if (state.selected){
                state.selected.empty=e.target.checked;
                render();
                Save();
            }
        })
    }

    if (v_BorderEmpty) {
        v_BorderEmpty.addEventListener("change", function(e){
            state.BorderEmpty= e.target.checked;
            if (state.selected){
                state.selected.BorderEmpty=e.target.checked;
                render();
                Save();
            }
        })
    }
}


function Save() {
  localStorage.setItem("drawing", JSON.stringify(state.objects));
}

function InvertColour(hex){
    if (!hex){
        return;
    }
    if (hex === "#000000" || hex === "#000") {
        return "#ffffff";
    }
    if (hex === "#ffffff" || hex === "#fff") {
        return "#000000";
    }
    return hex;
}

// Text Box

function CreateTextBox(screen_x, screen_y, canvas_x, canvas_y) {
    const box = document.createElement("textarea");
    box.classList.add("textbox");

    box.style.position = "fixed";
    box.style.left = screen_x + "px";
    box.style.top = screen_y + "px";
    box.style.width = "150px";
    box.style.height = "50px";

    box.style.fontSize = state.size + "px";
    box.style.color = state.fill;
    box.style.background = `rgba(255,255,255,${state.opacity})`;
    box.style.border = "1px solid #000";

    box.style.resize = "both";
    box.style.overflow = "hidden";
    box.style.padding = "2px";
    box.style.outline = "none";
    box.style.zIndex = "9999";
    box.dataset.id = count+1;

    document.body.appendChild(box);
    setTimeout(function() { box.focus(); }, 50);

    box.addEventListener("blur", function() {
        let ctx = canvas.getContext("2d");
        ctx.font = state.size + "px Arial";

        let Text_Lines = box.value.split("\n");
        let BiggestWidth = 0;

        for (let i = 0; i < Text_Lines.length; i++) {
            let LineWidth = ctx.measureText(Text_Lines[i]).width;
            if (LineWidth > BiggestWidth) {
                BiggestWidth=LineWidth;
            }
        }

        let TextHeight = Text_Lines.length * state.size;
        count += 1;

        let item = {};
        item.id = count;
        item.type = TOOLS.text;
        item.x= canvas_x;
        item.y = canvas_y;
        item.text = box.value;
        item.fontSize = state.size;
        item.fontFamily= "Arial";
        item.fill=state.fill;
        item.opacity=state.opacity;
        item.width = BiggestWidth;
        item.height = TextHeight;
        item.rotation = 0;

        add_to_history(state);
        state.objects.push(item);

        document.body.removeChild(box);

        render();
        Save();
    });
}
// Resize

function ResizingShapes(area) {
    let size = 10; 
    let left = area.x;
    let right = area.x + area.width;
    let top = area.y;
    let bottom = area.y + area.height;

    tool.fillStyle = "white";
    tool.strokeStyle = "black";

    // Top-left
    tool.beginPath();
    tool.rect(left - 5, top - 5, size, size);
    tool.fill();
    tool.stroke();

    // Top-Right
    tool.beginPath();
    tool.rect(right - 5, top - 5, size, size);
    tool.fill();
    tool.stroke();

    // Bottom-left
    tool.beginPath();
    tool.rect(left - 5, bottom - 5, size, size);
    tool.fill();
    tool.stroke();

    // Bottom-RIght
    tool.beginPath();
    tool.rect(right - 5, bottom - 5, size, size);
    tool.fill();
    tool.stroke();

    let rotateHandle = {
        x: area.x + area.width / 2,
        y: area.y - 20
    };

    tool.beginPath();
    tool.rect(rotateHandle.x - 4, rotateHandle.y - 4, 8, 8);
    tool.fill();
    tool.stroke();
}

function ResizeRotateHandle(area) {
    let rx = area.x + area.width / 2;
    let ry = area.y - 20;
    tool.fillStyle = "#8b4fc7";
    tool.strokeStyle = "white";
    tool.lineWidth = 1.5;
    tool.beginPath();
    tool.arc(rx, ry, 7, 0, Math.PI * 2);
    tool.fill();
    tool.stroke();
    tool.beginPath();
    tool.moveTo(rx, ry + 7);
    tool.lineTo(rx, area.y);
    tool.strokeStyle = "#8b4fc7";
    tool.lineWidth = 1;
    tool.stroke();
}

function Resizing_Corner(area, cursor_x, cursor_y) {

    let left = area.x;
    let right = area.x + area.width;
    let top = area.y;
    let bottom = area.y + area.height;

    let size = 10;

    // top-left
    if (cursor_x >= left - size && cursor_x <= left + size &&
        cursor_y >= top - size && cursor_y <= top + size) {
        return "top-left";
    }

    // top-right
    if (cursor_x >= right - size && cursor_x <= right + size &&
        cursor_y >= top - size && cursor_y <= top + size) {
        return "top-right";
    }

    // bottom-left
    if (cursor_x >= left - size && cursor_x <= left + size &&
        cursor_y >= bottom - size && cursor_y <= bottom + size) {
        return "bottom-left";
    }

    // bottom-right
    if (cursor_x >= right - size && cursor_x <= right + size &&
        cursor_y >= bottom - size && cursor_y <= bottom + size) {
        return "bottom-right";
    }

    let rx = area.x + area.width / 2;
    let ry = area.y - 20;
    let rdx = cursor_x - rx;
    let rdy = cursor_y - ry;
    if (rdx * rdx + rdy * rdy <= 12 * 12) {
        return "rotate";
    }

    return null;
}

function getRotationCenter(obj) {
    if (obj.type === TOOLS.rectangle || obj.type === TOOLS.square || obj.type === TOOLS.image || obj.type ===TOOLS.text)
        return { x: obj.x + obj.width / 2, y: obj.y + obj.height / 2 };
    if (obj.type === TOOLS.circle)
        return { x: obj.x, y: obj.y };
    if (obj.type === TOOLS.line)
        return { x: (obj.x + obj.lastX) / 2, y: (obj.y + obj.lastY) / 2 };
    if (obj.type === TOOLS.triangle)
        return { x: (obj.X1 + obj.X2 + obj.X3) / 3, y: (obj.Y1 + obj.Y2 + obj.Y3) / 3 };
    return null;
}

function unrotatePos(pos, obj) {
    let center = getRotationCenter(obj);
    let rotation = obj.rotation || 0;
    if (!center || rotation === 0) return pos;
    let dx = pos.x - center.x;
    let dy = pos.y - center.y;
    let cos = Math.cos(-rotation);
    let sin = Math.sin(-rotation);
    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
    };
}

let Drawing = false;
let X = 0;
let Y = 0;
let Shape_X = 0;
let Shape_Y = 0;

function SelectObjectAt(x, y) {
    for (let i = state.objects.length - 1; i >= 0; i--) {
        let item = state.objects[i];
        if (DetectObject(item, x, y)) {
            return item;
        }
    }
    return null;
}

canvas.addEventListener("pointerdown", function(e) {
    if (!e.isPrimary) {
        return; 
    }
    canvas.setPointerCapture(e.pointerId);

    const pos= Uniform_pos(e, canvas);
    if (state.tool === TOOLS.select && state.selected) {

        let area = GetSelectionArea(state.selected);

        if (area) {
            const hitPos = unrotatePos(pos, state.selected);
        
            let corner = Resizing_Corner(area, hitPos.x, hitPos.y);
 
            if (corner === "rotate") {
                add_to_history(state);
                rotating = true;
                current = state.selected;
                Drawing = false;
                return;
            }
 
            if (corner) {
                add_to_history(state);
                Resizing = true;
                ResizeHandle = corner;
                Drawing = false;
                return;
            }
            if (ObjectClick(area, hitPos.x, hitPos.y)) {
                add_to_history(state);
                Draggin=true;
                drag_x=pos.x;
                drag_y=pos.y;

                let item= state.selected;

                if (item.type ===TOOLS.rectangle ||item.type ===TOOLS.square || item.type ===TOOLS.image || item.type === TOOLS.text) {
                    initial_drag_coords={x: item.x, y: item.y};
                }

                if (item.type === TOOLS.circle) {
                    initial_drag_coords = { x: item.x, y: item.y };
                }

                if (item.type === TOOLS.line) {
                    initial_drag_coords = { x: item.x, y: item.y, lastX: item.lastX, lastY: item.lastY };
                }

                if (item.type === TOOLS.triangle) {
                    initial_drag_coords = { X1: item.X1, Y1: item.Y1, X2: item.X2, Y2: item.Y2, X3: item.X3, Y3: item.Y3 };
                }

                if (item.type === TOOLS.brush){
                    initial_drag_coords.points=[];
                    for (let i=0; i<item.points.length; i++){
                        initial_drag_coords.points.push({x: item.points[i].x, y: item.points[i].y})
                    }
                }

                return;
            }
        }
    }
    
    if (state.tool === TOOLS.select) {
        state.selected = SelectObjectAt(pos.x, pos.y);

        if (state.selected) {
            state.fill   = state.selected.fill   || state.fill;
            state.border = state.selected.stroke || state.border;
            state.stroke = state.selected.stroke || state.stroke;
            state.size   = state.selected.StrokeWidth || state.selected.fontSize || state.size;
            state.opacity = state.selected.opacity !== undefined ? state.selected.opacity : state.opacity;
            state.brush_style = state.selected.brush_style || state.brush_style;
            Sidebar(state.selected.type);
        } 
        else {
            panel.innerHTML = "";
        }
        render();
        return;
    }
    if (
        state.tool === TOOLS.brush ||
        state.tool === TOOLS.rectangle ||
        state.tool === TOOLS.square ||
        state.tool === TOOLS.circle ||
        state.tool === TOOLS.triangle ||
        state.tool === TOOLS.line
    ) {

    
    Drawing = true;
  }

    if (state.tool === TOOLS.brush) {
        X = pos.x;
        Y = pos.y;
        Stroke = {};
        Stroke.x = X;
        Stroke.y = Y;
        count += 1;
        Stroke.id = count;
        Stroke.type = TOOLS.brush;
        Stroke.points = [{ x: pos.x, y: pos.y }];
        Stroke.stroke = state.stroke;
        Stroke.StrokeWidth = state.size;
        Stroke.opacity = state.opacity;
        Stroke.brush_style = state.brush_style;
    } else if (state.tool === TOOLS.rectangle) {
        Shape_X = pos.x;
        Shape_Y = pos.y;
    }

    if (state.tool === TOOLS.square) {
        Shape_X = pos.x;
        Shape_Y = pos.y;
    }
    if (state.tool === TOOLS.circle) {
        Shape_X = pos.x;
        Shape_Y = pos.y;
    }
    if (state.tool === TOOLS.triangle) {
        Shape_X = pos.x;
        Shape_Y = pos.y;
    }
    if (state.tool === TOOLS.line) {
        Shape_X = pos.x;
        Shape_Y = pos.y;
    }

    if (state.tool === TOOLS.text) {
        const pos = Uniform_pos(e, canvas);
        CreateTextBox(e.clientX, e.clientY, pos.x, pos.y);
        return;
    }

});

canvas.addEventListener("pointermove", function(e) {

    if (!e.isPrimary) {
        return;
    }

    const pos= Uniform_pos(e, canvas);
  
    if (rotating && current) {
        let cx, cy;
        if (current.type === TOOLS.circle) {
            cx = current.x;
            cy = current.y;
        } 
        else if (current.type === TOOLS.triangle) {
            cx = (current.X1 + current.X2 + current.X3) / 3;
            cy = (current.Y1 + current.Y2 + current.Y3) / 3;
        } 
        else if (current.type === TOOLS.line) {
            cx = (current.x + current.lastX) / 2;
            cy = (current.y + current.lastY) / 2;
        }  
        else {
            cx = current.x + current.width / 2;
            cy = current.y + current.height / 2;
        }
        current.rotation = Math.atan2(pos.y - cy, pos.x - cx) + Math.PI / 2;
        render();
        return;
    }

    if (Draggin && state.selected) {
        let obj = state.selected;
        let offsetX = pos.x - drag_x;
        let offsetY = pos.y - drag_y;
        let final_x=initial_drag_coords.x + offsetX;
        let final_y= initial_drag_coords.y + offsetY;

        if (obj.type === TOOLS.rectangle || obj.type === TOOLS.square || obj.type === TOOLS.image || obj.type === TOOLS.text) {
            obj.x = final_x
            obj.y = final_y
        }
        if (obj.type === TOOLS.circle) {
            obj.x = final_x
            obj.y = final_y
        }
        if (obj.type === TOOLS.line) {
            obj.x = final_x
            obj.y = final_y
            obj.lastX = initial_drag_coords.lastX + offsetX;
            obj.lastY = initial_drag_coords.lastY + offsetY;
        }
        if (obj.type === TOOLS.triangle) {
            obj.X1 = initial_drag_coords.X1 + offsetX;
            obj.Y1 = initial_drag_coords.Y1 + offsetY;
            obj.X2 = initial_drag_coords.X2 + offsetX;
            obj.Y2 = initial_drag_coords.Y2 + offsetY;
            obj.X3 = initial_drag_coords.X3 + offsetX;
            obj.Y3 = initial_drag_coords.Y3 + offsetY;
        }
        if (obj.type === TOOLS.brush) {
            if (!initial_drag_coords.points) {
                return;
            }

            for (let i = 0; i < obj.points.length; i++) {
                obj.points[i].x = initial_drag_coords.points[i].x + offsetX;
                obj.points[i].y = initial_drag_coords.points[i].y + offsetY;
            }
        }
        render();
        return;
    }

    if (Resizing && state.selected) {
        let obj = state.selected;
        if (obj.type === TOOLS.circle && ResizeHandle) {
            if (ResizeHandle === "bottom-right") {
                let NewRad = Math.max(pos.x - obj.x, pos.y - obj.y);
                if (NewRad > 5) obj.rad = NewRad;
            }
            if (ResizeHandle === "top-left") {
                let NewRad = Math.max(obj.x - pos.x, obj.y - pos.y);
                if (NewRad > 5) {
                    obj.x = pos.x + NewRad;
                    obj.y = pos.y + NewRad;
                    obj.rad = NewRad;
                }
            }
            if (ResizeHandle === "top-right") {
                let NewRad = Math.max(pos.x - obj.x, obj.y - pos.y);
                if (NewRad > 5) {
                    obj.y = pos.y + NewRad;
                    obj.rad = NewRad;
                }
            }
            if (ResizeHandle === "bottom-left") {
                let NewRad = Math.max(obj.x - pos.x, pos.y - obj.y);
                if (NewRad > 5) {
                    obj.x = pos.x + NewRad;
                    obj.rad = NewRad;
                }
            }
            render();
            return;
        }
        
        if (obj.type === TOOLS.rectangle) {
            if (ResizeHandle === "bottom-right") {
                obj.width = pos.x - obj.x;
                obj.height = pos.y - obj.y;
            }
            if (ResizeHandle === "top-left") {
                obj.width = obj.width + (obj.x - pos.x);
                obj.height = obj.height + (obj.y - pos.y);
                obj.x = pos.x;
                obj.y = pos.y;
            }
            if (ResizeHandle === "top-right") {
                obj.width = pos.x - obj.x;
                obj.height = obj.height + (obj.y - pos.y);
                obj.y = pos.y;
            }
            if (ResizeHandle === "bottom-left") {
                obj.width = obj.width + (obj.x - pos.x);
                obj.x = pos.x;
                obj.height = pos.y - obj.y;
            }
        }
 
        if (obj.type === TOOLS.square) {
            if (ResizeHandle === "top-left") {
                let size = obj.width + (obj.x - pos.x);
                obj.x = pos.x;
                obj.y = pos.y;
                obj.width = size;
                obj.height = size;
            }
 
            if (ResizeHandle === "top-right") {
                let size = pos.x - obj.x;
                obj.y = pos.y;
                obj.width = size;
                obj.height = size;
            }
 
            if (ResizeHandle === "bottom-right") {
                let size = pos.x - obj.x;
                obj.width = size;
                obj.height = size;
            }
 
            if (ResizeHandle === "bottom-left") {
                let size = obj.width + (obj.x - pos.x);
                obj.x = pos.x;
                obj.width = size;
                obj.height = size;
            }
        }

 
        if (obj.type === TOOLS.line) {
            if (ResizeHandle === "top-left") {
                obj.x = pos.x;
                obj.y = pos.y;
            }
            if (ResizeHandle === "bottom-right") {
                obj.lastX = pos.x;
                obj.lastY = pos.y;
            }
        }
 
        if (obj.type === TOOLS.triangle) {
            let left = Math.min(obj.X1, obj.X2, obj.X3);
            let right = Math.max(obj.X1, obj.X2, obj.X3);
            let top = Math.min(obj.Y1, obj.Y2, obj.Y3);
            let bottom = Math.max(obj.Y1, obj.Y2, obj.Y3);
            let width = right - left;
            let height = bottom - top;
            if (width < 1 || height < 1) {
                render();
                return;
            }
            if (ResizeHandle === "bottom-right") {
                let new_w = pos.x - left;
                let new_h = pos.y - top;
                if (new_w < 5 || new_h < 5 || width < 1 || height < 1) { 
                    render(); 
                    return; 
                }
 
                let scaleX = new_w / width;
                let scaleY = new_h / height;
 
                obj.X1 = left + (obj.X1 - left) * scaleX;
                obj.Y1 = top + (obj.Y1 - top) * scaleY;
                obj.X2 = left + (obj.X2 - left) * scaleX;
                obj.X3 = left + (obj.X3 - left) * scaleX;
                obj.Y2 = top + (obj.Y2 - top) * scaleY;
                obj.Y3 = top + (obj.Y3 - top) * scaleY;
            }
 
            if (ResizeHandle=== "top-left") {
 
                let new_w = right - pos.x;
                let new_h = bottom - pos.y;
                if (new_w < 5 || new_h < 5 || width < 1 || height < 1) { 
                    render(); 
                    return; 
                }
                let scaleX = new_w / width;
                let scaleY = new_h / height;
 
                obj.X1 = right - (right - obj.X1) * scaleX;
                obj.X2 = right - (right - obj.X2) * scaleX;
                obj.X3 = right - (right - obj.X3) * scaleX;
                obj.Y1 = bottom - (bottom - obj.Y1) * scaleY;
                obj.Y2 = bottom - (bottom - obj.Y2) * scaleY;
                obj.Y3 = bottom - (bottom - obj.Y3) * scaleY;
            }
 
            if (ResizeHandle === "top-right") {
                let new_w = pos.x - left;
                let new_h = bottom - pos.y;
                if (new_w < 5 || new_h < 5 || width < 1 || height < 1) { 
                    render(); 
                    return; 
                }
                let scaleX = new_w / width;
                let scaleY = new_h / height;
 
                obj.X1 = left + (obj.X1 - left) * scaleX;
                obj.X2 = left + (obj.X2 - left) * scaleX;
                obj.X3 = left + (obj.X3 - left) * scaleX;
                obj.Y1 = bottom - (bottom - obj.Y1) * scaleY;
                obj.Y2 = bottom - (bottom - obj.Y2) * scaleY;
                obj.Y3 = bottom - (bottom - obj.Y3) * scaleY;
            }
 
            if (ResizeHandle === "bottom-left") {
                let new_w = right - pos.x;
                let new_h = pos.y - top;
                if (new_w < 5 || new_h < 5 || width < 1 || height < 1) { 
                    render(); 
                    return; 
                }
                let scaleX = new_w / width;
                let scaleY = new_h / height;
 
                obj.X1 = right - (right - obj.X1) * scaleX;
                obj.X2 = right - (right - obj.X2) * scaleX;
                obj.X3 = right - (right - obj.X3) * scaleX;
 
                obj.Y1 = top + (obj.Y1 - top) * scaleY;
                obj.Y2 = top + (obj.Y2 - top) * scaleY;
                obj.Y3 = top + (obj.Y3 - top) * scaleY;
            }
        }   
        if (obj.type === TOOLS.image) {
            if (ResizeHandle === "bottom-right") {
                obj.width = pos.x - obj.x;
                obj.height = pos.y - obj.y;
            }
    
            if (ResizeHandle === "top-left") {
                obj.width = obj.width + (obj.x - pos.x);
                obj.height = obj.height + (obj.y - pos.y);
                obj.x = pos.x;
                obj.y = pos.y;
            }
    
            if (ResizeHandle === "top-right") {
                obj.width = pos.x - obj.x;
                obj.height = obj.height + (obj.y - pos.y);
                obj.y = pos.y;
            }
    
            if (ResizeHandle === "bottom-left") {
                obj.width = obj.width + (obj.x - pos.x);
                obj.x = pos.x;
                obj.height = pos.y - obj.y;
            }
        }
    
        if (obj.type === TOOLS.text) {
    
            if (ResizeHandle === "bottom-right") {
                obj.width = pos.x - obj.x;
                obj.height = pos.y - obj.y;
            }
    
            if (ResizeHandle === "top-left") {
                obj.width = obj.width + (obj.x - pos.x);
                obj.height = obj.height + (obj.y - pos.y);
                obj.x = pos.x;
                obj.y = pos.y;
            }
    
            if (ResizeHandle === "top-right") {
                obj.width = pos.x - obj.x;
                obj.height = obj.height + (obj.y - pos.y);
                obj.y = pos.y;
            }
    
            if (ResizeHandle === "bottom-left") {
                obj.width = obj.width + (obj.x - pos.x);
                obj.x = pos.x;
                obj.height = pos.y - obj.y;
            }
        }
    
        render();   
        return;   
    }
    if (Drawing === false) {
        return;
    }
    if (state.tool===TOOLS.brush){
        if (Stroke.brush_style==="pen"){
            tool.strokeStyle = Stroke.stroke;
            tool.lineWidth = Stroke.StrokeWidth;
            tool.lineCap = "round";
            tool.lineJoin = "round";
            tool.beginPath();
            tool.moveTo(X, Y);
            tool.lineTo(pos.x, pos.y);
            tool.stroke();
            Stroke.points.push({
                x: pos.x,
                y: pos.y    
            });
        }
        else if (Stroke.brush_style === "spray") {
            tool.fillStyle = Stroke.stroke;
            let spread = Stroke.StrokeWidth * 4;
            for (let d = 0; d < 15; d++) {
                let spray_x = pos.x + (Math.random() * spread) - spread / 2;
                let spray_y = pos.y + (Math.random() * spread) - spread / 2;
                Stroke.points.push({ x: spray_x, y: spray_y });
                tool.beginPath();
                tool.arc(spray_x, spray_y, 1, 0, Math.PI * 2);
                tool.fill();
            }
        }
        else if (Stroke.brush_style === "dashed") {
            tool.strokeStyle = Stroke.stroke;
            tool.lineWidth = Stroke.StrokeWidth;
            tool.lineCap = "round";
            let dash = Stroke.StrokeWidth * 2;
            let gap = Stroke.StrokeWidth * 1.5;
            tool.setLineDash([dash, gap]);
            tool.beginPath();
            tool.moveTo(X, Y);
            tool.lineTo(pos.x, pos.y);
            tool.stroke();
            tool.setLineDash([]);
            Stroke.points.push({ x: pos.x, y: pos.y });
        }
        X = pos.x;
        Y = pos.y;
        return;
    }

    render();
    tool.save();
    tool.fillStyle = state.fill;
    tool.strokeStyle = state.border;
    tool.lineWidth = state.size;

    if (state.tool === TOOLS.rectangle) {
        tool.strokeRect(Shape_X, Shape_Y, pos.x - Shape_X, pos.y - Shape_Y);
    }
    else if (state.tool === TOOLS.square) {
        let width = pos.x - Shape_X;
        let height = pos.y - Shape_Y;
        let size = Math.min(Math.abs(width), Math.abs(height));
        let fw = width < 0 ? -size : size;
        let fh = height < 0 ? -size : size;
        tool.strokeRect(Shape_X, Shape_Y, fw, fh);
    }
    else if (state.tool === TOOLS.circle) {
        let dx = pos.x - Shape_X;
        let dy = pos.y - Shape_Y;
        let radius = Math.sqrt(dx * dx + dy * dy);
        tool.beginPath();
        tool.arc(Shape_X, Shape_Y, radius, 0, Math.PI * 2);
        tool.stroke();
    }
    else if (state.tool === TOOLS.triangle) {
        tool.beginPath();
        tool.moveTo(Shape_X, Shape_Y);
        tool.lineTo(pos.x, pos.y);
        tool.lineTo(Shape_X + (Shape_X - pos.x), pos.y);
        tool.closePath();
        tool.stroke();
    }
    else if (state.tool === TOOLS.line) {
        tool.beginPath();
        tool.moveTo(Shape_X, Shape_Y);
        tool.lineTo(pos.x, pos.y);
        tool.stroke();
    }
    tool.restore();

});

canvas.addEventListener("pointerup", function(e) {

    if (!e.isPrimary) {
        return;
    }

    if (rotating) {
        rotating = false;
        current = null;
        Save();
        return;
    }

    if (Resizing) {
        Resizing = false;
        ResizeHandle = null;
        Save();
        return;
    }

    if (Draggin) {
        Draggin=false;
        initial_drag_coords={};
        Save();
        return;
    }

    const pos = Uniform_pos(e, canvas);
    if (Drawing===false) {
        return;
    }

    if (state.tool === TOOLS.brush) {
        Drawing = false;
        const rect = canvas.getBoundingClientRect();
        add_to_history(state);
        state.objects.push(Stroke);
        Save();
        Stroke = null;
        render();
    }

  if (state.tool === TOOLS.rectangle) {

    let item = {};
    count += 1;
    item.id = count;
    item.type = TOOLS.rectangle;
    item.x = Shape_X;
    item.y = Shape_Y;
    item.width = pos.x - Shape_X;
    item.height = pos.y- Shape_Y;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;
    item.empty = state.empty;
    item.BorderEmpty= state.BorderEmpty;

    add_to_history(state);
    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === TOOLS.square) {
    let width = pos.x - Shape_X;
    let height = pos.y - Shape_Y;
    let p_width = Math.abs(width);
    let p_height = Math.abs(height);
    let size = p_width < p_height ? p_width : p_height;
    let FinalWidth = width < 0 ? -size : size;
    let FinalHeight = height < 0 ? -size : size;

    let item = {};
    count += 1;
    item.id = count;
    item.type =TOOLS.square;
    item.x = Shape_X;
    item.y = Shape_Y;
    item.width = FinalWidth;
    item.height = FinalHeight;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;
    item.empty = state.empty;
    item.BorderEmpty= state.BorderEmpty;

    add_to_history(state);
    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === TOOLS.circle) {
    let x = pos.x - Shape_X;
    let y = pos.y - Shape_Y;
    let radius = Math.sqrt(x * x + y * y);

    let item = {};
    count += 1;
    item.id = count;
    item.type = TOOLS.circle;
    item.x = Shape_X;
    item.y = Shape_Y;
    item.rad = radius;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;
    item.empty = state.empty;
    item.BorderEmpty= state.BorderEmpty;

    add_to_history(state);
    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === TOOLS.triangle) {
    let item = {};
    count += 1;
    item.id = count;
    item.type = TOOLS.triangle;
    item.X1 = Shape_X;
    item.Y1 = Shape_Y;
    item.X2 = pos.x;
    item.Y2 = pos.y;
    item.X3 = Shape_X + (Shape_X - pos.x);
    item.Y3 = pos.y;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;
    item.empty = state.empty;
    item.BorderEmpty= state.BorderEmpty;

    add_to_history(state);
    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === TOOLS.line) {
    let item = {};
    count += 1;
    item.id = count;
    item.type = TOOLS.line;
    item.x = Shape_X;
    item.y = Shape_Y;
    item.lastX = pos.x;
    item.lastY = pos.y;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;

    add_to_history(state);
    state.objects.push(item);
    Save();
    render();
    Drawing=false;
  }

});

canvas.addEventListener("pointercancel", function(e) {
    if (!e.isPrimary) {
        return;
    }
    rotating = false;
    current = null;
    Drawing = false;
    Draggin=false;
    Resizing = false;
    ResizeHandle = null;
    Stroke = null;
});

const theme = document.querySelector(".mode");

theme.addEventListener("click", function() {
  document.body.classList.toggle("dark-mode");

  for (let i = 0; i < state.objects.length; i++) {
    let item = state.objects[i];
    if (item.fill)   item.fill   = InvertColour(item.fill);
    if (item.stroke) item.stroke = InvertColour(item.stroke);
  }

  render();
  Save();
});

let savedDrawing = localStorage.getItem("drawing");
if (savedDrawing) {
    state.objects = JSON.parse(savedDrawing);
    let pending = 0;
    for (let i = 0; i < state.objects.length; i++) {
        let item = state.objects[i];
        if (item.type === TOOLS.image && item.src) {
            pending++;
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function() {
                item.img = img;
                pending--;
                if (pending === 0) {
                    render();
                }
            };
            img.src = item.src;
        }
    }
    if (pending === 0) {
        render();
    }
}