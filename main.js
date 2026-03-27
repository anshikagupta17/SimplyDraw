const state = {
  tool: null,
  stroke: "#000000",
  fill: "#000000",
  border: "#000000",
  size: 5,
  opacity: 1,
  image: null,
  objects: [],
  history: [],
  selected: null,
  brush_style: "pen"
};

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

function Uniform_pos(e) {
    const rect = canvas.getBoundingClientRect();
    const scale_X = canvas.width / rect.width;
    const scale_Y = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scale_X,
        y: (e.clientY - rect.top) * scale_Y
    };
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Bin

let ClearScreen = document.getElementById("Bin");
ClearScreen.addEventListener("click", function() {
    for (let i = 0; i < state.objects.length; i++) {
        state.history.push(state.objects[i]);
    }
    state.objects = [];
    tool.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem("drawing");
    Save();
    render();
});

//Undo

let Undo = document.getElementById("Undo");
Undo.addEventListener("click", function() {
    if (state.objects.length === 0) {
        return;
    }
    state.history.push(state.objects.pop());
    Save();
    render();
});

function Undo_Z(){
    if (state.objects.length === 0) {
        return;
    }
    state.history.push(state.objects.pop());
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
  if (state.history.length === 0) {
    return;
  }
  state.objects.push(state.history.pop());
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
        let item = {};
        count+=1;
        item.id = count;
        item.type = "Image";
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

    if (tool === "Rectangle" || tool === "Square" || tool === "Circle" || tool === "Triangle") {
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
        `;
    }

    if (tool === "Line" ) {
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

    if (tool === "Brush") {
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
    if (tool === "Text") {
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

// brush selection

function BrushSelection(brush){
    let minX= brush.points[0].x;
    let minY= brush.points[0].y;
    let maxX= brush.points[0].x;
    let maxY= brush.points[0].y;

    for (let i=0; i<brush.points.length; i++){
        let p= brush.points[i];

        if (p.x < minX) {
            minX=p.x;
        }
        if (p.x > maxX) {
            maxX= p.x;
        }
        if (p.y <minY){
            minY=p.y;
        }
        if (p.y > maxY) {
            maxY= p.y;
        }
    }
    let space= brush.StrokeWidth/2;
    return {
        x: minX - space,
        y: minY - space,
        width: maxX - minX + space * 2,
        height: maxY - minY + space * 2
    };
}
function BrushDetector(brush, x,y){
    let radius= brush.StrokeWidth/2 +4;
    let p=brush.points;
    if (p.length === 1) {
        let dx = x - p[0].x;
        let dy = y - p[0].y;
        return (dx * dx + dy * dy) <= radius * radius;
    }

    for (let i = 0; i < p.length - 1; i++) {
        let p1 = p[i];
        let p2 = p[i + 1];

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;

        let length = dx * dx + dy * dy;

        let k = 0;
        if (length !== 0) {
            k = ((x - p1.x) * dx + (y - p1.y) * dy) / length;
        }

        if (k < 0) {
            k = 0;
        }
        if (k > 1) {
            k = 1;
        }

        let closest_x = p1.x + k * dx;
        let closest_y = p1.y + k * dy;

        let dist_x = x - closest_x;
        let dist_y = y - closest_y;

        let distance = dist_x * dist_x + dist_y * dist_y;

        if (distance <= radius * radius) {
            return true;
        }
    }

    return false;
}

//rectangle selection

function RectangleSelection(rectangle){
    let minX, minY, maxX, maxY;
    if (rectangle.width >= 0) {
        minX = rectangle.x;
        maxX = rectangle.x + rectangle.width;
    } 
    else {
        minX = rectangle.x + rectangle.width;
        maxX = rectangle.x;
    }
    if (rectangle.height >= 0) {
        minY = rectangle.y;
        maxY = rectangle.y + rectangle.height;
    } 
    else {
        minY = rectangle.y + rectangle.height;
        maxY = rectangle.y;
    }

    let space= rectangle.StrokeWidth/2;
    return {
        x: (minX - space),
        y: (minY - space),
        width: maxX - minX + space * 2,
        height: maxY - minY + space * 2
    };
}
// Square selection

function SquareSelector(square){
    let minX, minY, maxX, maxY;
    if (square.width >= 0) {
        minX = square.x;
        maxX = square.x + square.width;
    } 
    else {
        minX = square.x + square.width;
        maxX = square.x;
    }
    if (square.height >= 0) {
        minY = square.y;
        maxY = square.y + square.height;
    } 
    else {
        minY = square.y + square.height;
        maxY = square.y;
    }

    let space= square.StrokeWidth/2;
    return {
        x: (minX - space),
        y: (minY - space),
        width: maxX - minX + space * 2,
        height: maxY - minY + space * 2
    };
}

//Circle selection

function CircleSelector(circle){
    let space= circle.StrokeWidth/2;

    return {
        x: circle.x - circle.rad - space,
        y: circle.y - circle.rad -space,
        width:(circle.rad*2) + space * 2,
        height:(circle.rad*2) + space * 2
    };
}

function ActualCircleDetection(circle, x, y){
    let dx = x - circle.x;
    let dy = y - circle.y;
    return ((dx * dx + dy * dy) <= (circle.rad * circle.rad));
}
// Triangle selection

function TriangleSelector(triangle){
    let minX = Math.min(triangle.X1, triangle.X2, triangle.X3);
    let maxX = Math.max(triangle.X1, triangle.X2, triangle.X3);
    let minY = Math.min(triangle.Y1, triangle.Y2, triangle.Y3);
    let maxY = Math.max(triangle.Y1, triangle.Y2, triangle.Y3);

    let space = triangle.StrokeWidth / 2;

    return {
        x: minX - space,
        y: minY - space,
        width: (maxX - minX) + space * 2,
        height: (maxY - minY) + space * 2
    };
}

function TriangleDetector(triangle,x,y){
    let x1 = triangle.X1;
    let y1 = triangle.Y1;
    let x2 = triangle.X2;
    let y2 = triangle.Y2;
    let x3 = triangle.X3;
    let y3 = triangle.Y3;

    let ABC = (y2 - y3)*(x1 - x3) + (x3 - x2)*(y1 - y3);

    if (ABC === 0) {
        return false;
    }

    let a = ((y2 - y3)*(x - x3) + (x3 - x2)*(y - y3)) / ABC;
    let b = ((y3 - y1)*(x - x3) + (x1 - x3)*(y - y3)) / ABC;
    let c = 1 - a - b;

    return (a >= 0 && b >= 0 && c >= 0);
}

//Line selection

function LineSelector(line){
    let minX, minY, maxX, maxY;
    if (line.x>=line.lastX) {
        minX = line.lastX;
        maxX = line.x;
    } 
    else {
        minX = line.x;
        maxX = line.lastX;
    }
    if (line.y>=line.lastY) {
        minY = line.lastY;
        maxY = line.y;
    } 
    else {
        minY = line.y;
        maxY = line.lastY;
    }
    let space = line.StrokeWidth / 2;

    return {
        x: minX - space,
        y: minY - space,
        width: (maxX - minX) + space * 2,
        height: (maxY - minY) + space * 2
    };
}
function LineDetector(line,x,y){
    let x1 = line.x;
    let y1 = line.y;
    let x2 = line.lastX;
    let y2 = line.lastY;
    let dx=x2-x1;
    let dy=y2-y1;
    let length=dx*dx+ dy * dy;
    if (length===0){
        return false;
    }
    let k = ((x-x1)*dx + (y-y1)*dy)/length;
    if (k < 0) {
            k = 0;
        }
        if (k > 1) {
            k = 1;
        }

        let closest_x = x1 + k * dx;
        let closest_y = y1 + k * dy;

        let dist_x = x - closest_x;
        let dist_y = y - closest_y;

        let distance = dist_x * dist_x + dist_y * dist_y;
        let radius = line.StrokeWidth / 2 + 4;
        if (distance <= radius * radius) {
            return true;
        }
        else {
            return false;
        }

}

function ObjectClick(area,x,y){
    let horizontal=false;
    let vertical= false;
    if (x>= area.x && x<= area.x+area.width){
        horizontal=true;
    }
    if(y>= area.y && y<= area.y+area.height){
        vertical=true;
    }
    if (horizontal&& vertical){
        return true;
    }
    else {
        return false;
    }

}

function render() {
  tool.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < state.objects.length; i++) {
    let current = state.objects[i];

    // brush
    if (current.type === "Brush") {
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
            tool.setLineDash([10,8]);
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
    if (current.type === "Rectangle") {
      tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
      tool.save();
      let cx = current.x + current.width / 2;
      let cy = current.y + current.height / 2;
      tool.translate(cx, cy);
      tool.rotate(current.rotation || 0);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fillRect(-current.width/2, -current.height/2, current.width, current.height);   
      tool.strokeRect(-current.width/2, -current.height/2, current.width, current.height); 
      if (state.selected===current){
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(-current.width/2, -current.height/2, current.width, current.height);
        tool.restore();
        tool.globalAlpha = 1;
        let area = RectangleSelection(current);
        ResizingShapes(area);
        ResizeRotateHandle(area);
      }
      else {
        tool.restore();
        tool.globalAlpha = 1;
      }
    }

    if (current.type === "Square") {
      tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
      tool.save();
      let cx = current.x + current.width / 2;
      let cy = current.y + current.height / 2;
      tool.translate(cx, cy);
      tool.rotate(current.rotation || 0);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fillRect(-current.width/2, -current.height/2, current.width, current.height);
      tool.strokeRect(-current.width/2, -current.height/2, current.width, current.height);
      if (state.selected===current){
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(-current.width/2, -current.height/2, current.width, current.height);
        tool.restore();
        tool.globalAlpha = 1;
        let area = SquareSelector(current);
        ResizingShapes(area);
        ResizeRotateHandle(area);
      } else {
        tool.restore();
        tool.globalAlpha = 1;
      }
    }
 
    if (current.type === "Circle") {
      tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
      tool.beginPath();
      tool.arc(current.x, current.y, current.rad, 0, Math.PI * 2);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fill();
      tool.stroke();
      tool.globalAlpha = 1;
      if (state.selected===current){
        let area = CircleSelector(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(area.x, area.y, area.width, area.height);
        ResizingShapes(area);
        ResizeRotateHandle(area);
      }
    }
 
    if (current.type === "Triangle") {
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
      tool.fill();
      tool.stroke();
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
        ResizingShapes(area);
        ResizeRotateHandle(area);
      }
    }
 
    if (current.type === "Line") {
      tool.globalAlpha = current.opacity !== undefined ? current.opacity : 1;
      tool.save();
      let lcx = (current.x + current.lastX) / 2;
      let lcy = (current.y + current.lastY) / 2;
      tool.translate(lcx, lcy);
      tool.rotate(current.rotation || 0);
      tool.beginPath();
      tool.moveTo(current.x - lcx, current.y - lcy);
      tool.lineTo(current.lastX - lcx, current.lastY - lcy);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.stroke();
      tool.restore();
      tool.globalAlpha = 1;
      if (state.selected===current){
        let area = LineSelector(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.save();
        let cx = (current.x + current.lastX) / 2;
        let cy = (current.y + current.lastY) / 2;
        tool.translate(cx, cy);
        tool.rotate(current.rotation || 0);
        tool.beginPath();
        tool.moveTo(current.x - cx, current.y - cy); 
        tool.lineTo(current.lastX - cx, current.lastY - cy);
        tool.stroke();
        tool.restore();
        ResizingShapes(area);
        ResizeRotateHandle(area);
      }
    }
 
    // image
 
    if (current.type === "Image" && current.img && current.img.complete) {
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
        ResizingShapes(area);
        ResizeRotateHandle(area);
    }
    }
 
    // text
 
    if (current.type === "Text") {
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
function Sidework() {
    let v_size = document.getElementById("size");
    let v_fill = document.getElementById("fill");
    let v_color = document.getElementById("color");
    let v_border = document.getElementById("border");
    let v_image = document.getElementById("image");
    let v_opacity = document.getElementById("opacity");
    let v_style = document.getElementById("brush_style");

    if (v_size) {
        v_size.addEventListener("input", function(e) {
            state.size = Math.max(1, parseInt(e.target.value));
        });
    }

    if (v_fill) {
        v_fill.addEventListener("input", function(e) {
            state.fill = e.target.value;
        });
    }

    if (v_color) {
        v_color.addEventListener("input", function(e) {
            state.stroke = e.target.value;
        });
    }

    if (v_border) {
        v_border.addEventListener("input", function(e) {
            state.border = e.target.value;
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
                    item.type = "Image";
                    item.x = 50 + Math.random() * 200;
                    item.y = 50 + Math.random() * 200;
                    item.width = img.width;
                    item.height = img.height;
                    item.src = event.target.result;
                    item.img = img;
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
        });
    }
    if (v_style) {
        v_style.addEventListener("change", function(e){
            state.brush_style = e.target.value;
        });
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
    box.style.zIndex = "1000";
    box.dataset.id = count+1;

    document.body.appendChild(box);
    setTimeout(function() { box.focus(); }, 50);

    // Adding the powerpoint text box vibe

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
        item.type = "Text";
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

        state.objects.push(item);
        state.history = [];

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

let Drawing = false;
let X = 0;
let Y = 0;
let Shape_X = 0;
let Shape_Y = 0;


canvas.addEventListener("mousedown", function(e) {
    const pos= Uniform_pos(e);
    if (state.tool === "Select" && state.selected) {

        let area = null;

        if (state.selected.type === "Rectangle") {
         area = RectangleSelection(state.selected);
        }

        if (state.selected.type === "Square") {
            area = SquareSelector(state.selected);
        }

        if (state.selected.type === "Circle") {
            area = CircleSelector(state.selected);
        }

        if (state.selected.type === "Triangle") {
            area = TriangleSelector(state.selected);
        }

        if (state.selected.type === "Line") {
            area = LineSelector(state.selected);
        }
        if (state.selected.type === "Image") {
            area = { x: state.selected.x, y: state.selected.y, width: state.selected.width, height: state.selected.height };
        }
        if (state.selected.type === "Text") {
            area = { x: state.selected.x, y: state.selected.y, width: state.selected.width, height: state.selected.height };
        }       
        if (state.selected.type === "Brush") {
            area = BrushSelection(state.selected);
        }

        if (area) {
            let corner = Resizing_Corner(area, pos.x, pos.y);
 
            if (corner === "rotate") {
                rotating = true;
                current = state.selected;
                Drawing = false;
                return;
            }
 
            if (corner) {
                Resizing = true;
                ResizeHandle = corner;
                Drawing = false;
                return;
            }
            if (ObjectClick(area, pos.x, pos.y)) {
                Draggin=true;
                drag_x=pos.x;
                drag_y=pos.y;

                let item= state.selected;

                if (item.type ==="Rectangle" ||item.type ==="Square" || item.type ==="Image" || item.type ==="Text") {
                    initial_drag_coords={x: item.x, y: item.y};
                }

                if (item.type === "Circle") {
                    initial_drag_coords = { x: item.x, y: item.y };
                }

                if (item.type === "Line") {
                    initial_drag_coords = { x: item.x, y: item.y, lastX: item.lastX, lastY: item.lastY };
                }

                if (item.type === "Triangle") {
                    initial_drag_coords = { X1: item.X1, Y1: item.Y1, X2: item.X2, Y2: item.Y2, X3: item.X3, Y3: item.Y3 };
                }

                if (item.type==="Brush"){
                    initial_drag_coords.points=[];
                    for (let i=0; i<item.points.length; i++){
                        initial_drag_coords.points.push({x: item.points[i].x, y: item.points[i].y})
                    }
                }

                return;
            }
        }
    }
    
    if (state.tool === "Select") {
        state.selected = null;

        for (let i = state.objects.length - 1; i >= 0; i-- ) {
            let item = state.objects[i];
            if (item.type === "Brush") {
                if (BrushDetector(item, pos.x, pos.y)) {
                    state.selected = item;
                    break;
                }
            }
            if (item.type==="Rectangle"){
                let area= RectangleSelection(item);;
                if (ObjectClick(area, pos.x, pos.y)){
                    state.selected=item;
                    break;
                }
            }
            if (item.type==="Square"){
                let area= SquareSelector(item);;
                if (ObjectClick(area, pos.x, pos.y)){
                    state.selected=item;
                    break;
                }
            }
            if (item.type === "Circle"){
                if (ActualCircleDetection(item, pos.x, pos.y)){
                    state.selected = item;
                    break;
                }
            }
            if (item.type==="Triangle"){
                if (TriangleDetector(item,pos.x,pos.y)){
                    state.selected=item;
                    break;
                }
            }
            if (item.type==="Line"){
                if (LineDetector(item, pos.x, pos.y)){
                    state.selected=item;
                    break;
                }
            }
            if (item.type === "Image") {
                let area = {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                };

                if (ObjectClick(area, pos.x, pos.y)) {
                state.selected = item;
                break;
                }
            }

            if (item.type === "Text") {
                let area = {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                };

                if (ObjectClick(area, pos.x, pos.y)) {
                    state.selected = item;
                    break;
                }
            }

        }
        render();
        return;
    }
    if (
        state.tool === "Brush" ||
        state.tool === "Rectangle" ||
        state.tool === "Square" ||
        state.tool === "Circle" ||
        state.tool === "Triangle" ||
        state.tool === "Line"
    ) {

    
    Drawing = true;
  }

  if (state.tool === "Brush") {
    X = pos.x;
    Y = pos.y;
    Stroke = {};
    Stroke.x = X;
    Stroke.y = Y;
    count += 1;
    Stroke.id = count;
    Stroke.type = "Brush";
    Stroke.points = [{ x: pos.x, y: pos.y }];
    Stroke.stroke = state.stroke;
    Stroke.StrokeWidth = state.size;
    Stroke.opacity = state.opacity;
    Stroke.brush_style = state.brush_style;
  } else if (state.tool === "Rectangle") {
    Shape_X = pos.x;
    Shape_Y = pos.y;
  }

  if (state.tool === "Square") {
    Shape_X = pos.x;
    Shape_Y = pos.y;
  }
  if (state.tool === "Circle") {
    Shape_X = pos.x;
    Shape_Y = pos.y;
  }
  if (state.tool === "Triangle") {
    Shape_X = pos.x;
    Shape_Y = pos.y;
  }
  if (state.tool === "Line") {
    Shape_X = pos.x;
    Shape_Y = pos.y;
  }

  if (state.tool === "Text") {
    const pos = Uniform_pos(e);
    CreateTextBox(e.clientX, e.clientY, pos.x, pos.y);
    return;
  }

});

canvas.addEventListener("mousemove", function(e) {

  const pos= Uniform_pos(e);
  
    if (rotating && current) {
        let cx, cy;
        if (current.type === "Circle") {
            cx = current.x;
            cy = current.y;
        } 
        else if (current.type === "Triangle") {
            cx = (current.X1 + current.X2 + current.X3) / 3;
            cy = (current.Y1 + current.Y2 + current.Y3) / 3;
        } 
        else if (current.type === "Line") {
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

        if (obj.type === "Rectangle" || obj.type === "Square" || obj.type === "Image" || obj.type === "Text") {
            obj.x = final_x
            obj.y = final_y
        }
        if (obj.type === "Circle") {
            obj.x = final_x
            obj.y = final_y
        }
        if (obj.type === "Line") {
            obj.x = final_x
            obj.y = final_y
            obj.lastX = initial_drag_coords.lastX + offsetX;
            obj.lastY = initial_drag_coords.lastY + offsetY;
        }
        if (obj.type === "Triangle") {
            obj.X1 = initial_drag_coords.X1 + offsetX;
            obj.Y1 = initial_drag_coords.Y1 + offsetY;
            obj.X2 = initial_drag_coords.X2 + offsetX;
            obj.Y2 = initial_drag_coords.Y2 + offsetY;
            obj.X3 = initial_drag_coords.X3 + offsetX;
            obj.Y3 = initial_drag_coords.Y3 + offsetY;
        }
        if (obj.type === "Brush") {
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
 
        if (obj.type === "Rectangle") {
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
 
        if (obj.type === "Square") {
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
 
        if (obj.type === "Circle") {
            let dx = pos.x - obj.x;
            let dy = pos.y - obj.y;
            obj.rad = Math.sqrt(dx * dx + dy * dy);
        }
 
        if (obj.type === "Line") {
            if (ResizeHandle === "top-left") {
                obj.x = pos.x;
                obj.y = pos.y;
            }
            if (ResizeHandle === "bottom-right") {
                obj.lastX = pos.x;
                obj.lastY = pos.y;
            }
        }
 
        if (obj.type === "Triangle") {
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
                if (new_w < 1 || new_h < 1) { 
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
        if (obj.type === "Image") {
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
    
        if (obj.type === "Text") {
    
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
    if (state.tool==="Brush"){
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
            tool.setLineDash([10, 8]);
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

    if (state.tool === "Rectangle") {
        tool.fillRect(Shape_X, Shape_Y, pos.x - Shape_X, pos.y - Shape_Y);
        tool.strokeRect(Shape_X, Shape_Y, pos.x - Shape_X, pos.y - Shape_Y);
    }
    else if (state.tool === "Square") {
        let width = pos.x - Shape_X;
        let height = pos.y - Shape_Y;
        let size = Math.min(Math.abs(width), Math.abs(height));
        let fw = width < 0 ? -size : size;
        let fh = height < 0 ? -size : size;
        tool.fillRect(Shape_X, Shape_Y, fw, fh);
        tool.strokeRect(Shape_X, Shape_Y, fw, fh);
    }
    else if (state.tool === "Circle") {
        let dx = pos.x - Shape_X;
        let dy = pos.y - Shape_Y;
        let radius = Math.sqrt(dx * dx + dy * dy);
        tool.beginPath();
        tool.arc(Shape_X, Shape_Y, radius, 0, Math.PI * 2);
        tool.fill();
        tool.stroke();
    }
    else if (state.tool === "Triangle") {
        tool.beginPath();
        tool.moveTo(Shape_X, Shape_Y);
        tool.lineTo(pos.x, pos.y);
        tool.lineTo(Shape_X + (Shape_X - pos.x), pos.y);
        tool.closePath();
        tool.fill();
        tool.stroke();
    }
    else if (state.tool === "Line") {
        tool.beginPath();
        tool.moveTo(Shape_X, Shape_Y);
        tool.lineTo(pos.x, pos.y);
        tool.stroke();
    }
    tool.restore();

});

canvas.addEventListener("mouseup", function(e) {

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

    const pos = Uniform_pos(e);
    if (Drawing===false) {
        return;
    }

    if (state.tool === "Brush") {
        Drawing = false;
        const rect = canvas.getBoundingClientRect();
        state.objects.push(Stroke);
        Save();
        Stroke = null;
        render();
    }

  if (state.tool === "Rectangle") {

    let item = {};
    count += 1;
    item.id = count;
    item.type = "Rectangle";
    item.x = Shape_X;
    item.y = Shape_Y;
    item.width = pos.x - Shape_X;
    item.height = pos.y- Shape_Y;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;

    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === "Square") {
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
    item.type = "Square";
    item.x = Shape_X;
    item.y = Shape_Y;
    item.width = FinalWidth;
    item.height = FinalHeight;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;

    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === "Circle") {
    let x = pos.x - Shape_X;
    let y = pos.y - Shape_Y;
    let radius = Math.sqrt(x * x + y * y);

    let item = {};
    count += 1;
    item.id = count;
    item.type = "Circle";
    item.x = Shape_X;
    item.y = Shape_Y;
    item.rad = radius;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;

    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === "Triangle") {
    let item = {};
    count += 1;
    item.id = count;
    item.type = "Triangle";
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

    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === "Line") {
    let item = {};
    count += 1;
    item.id = count;
    item.type = "Line";
    item.x = Shape_X;
    item.y = Shape_Y;
    item.lastX = pos.x;
    item.lastY = pos.y;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;
    item.opacity = state.opacity;
    item.rotation = 0;

    state.objects.push(item);
    Save();
    render();
    Drawing=false;
  }

});

canvas.addEventListener("mouseleave", function(e) {
  rotating = false;
  current = null;
  Drawing = false;
  Draggin=false;
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
        if (item.type === "Image" && item.src) {
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