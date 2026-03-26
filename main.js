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
  selected: null
};


let count = 0;
let Stroke = null;

const keys={};

// buttons
const buttons = document.querySelectorAll(".tools button");

// cursor
const BrushCursor = document.getElementById("BrushCursor");

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

let ClearScreen = document.getElementById("Bin");
ClearScreen.addEventListener("click", function() {
  state.objects = [];
  tool.clearRect(0, 0, canvas.width, canvas.height);
  localStorage.removeItem("drawing");
  Save();
  render();
});

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

let Redo = document.getElementById("Redo");
Redo.addEventListener("click", function() {
  if (state.history.length === 0) {
    return;
  }
  state.objects.push(state.history.pop());
  Save();
  render();
});

function Sidebar(tool) {
  panel.innerHTML = "";

  if (tool === "Rectangle" || tool === "Square" || tool === "Circle" || tool === "Triangle" || tool === "Line") {
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
    `;
  }

  if (tool === "Brush") {
    panel.innerHTML = `
      <div class="control">
        <label>Colour</label>
        <input type="color" id="color" value="${state.stroke}">
      </div>
      <div class="control">
        <label>Width</label>
        <input type="number" id="size" min="0" max="100" value="${state.size}">
      </div>
    `;
  } 
  else if (tool === "Image") {
    panel.innerHTML = `
      <button id="Insert">Insert Image</button>
      <input type="file" id="image" accept="image/*">
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

function Sidework() {
  let v_size = document.getElementById("size");
  let v_fill = document.getElementById("fill");
  let v_color = document.getElementById("color");
  let v_border = document.getElementById("border");
  let v_image = document.getElementById("image");

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
      let img = new Image();
    });
  }
}

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
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.lineCap = "round";
      tool.lineJoin = "round";
      tool.beginPath();

      let points = current.points;
      if (points.length > 0) {
        tool.beginPath();
        tool.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          tool.lineTo(points[i].x, points[i].y);
        }
        tool.stroke();
      }
      if (state.selected===current){
        let area = BrushSelection(current);
        tool.strokeStyle="blue";
        tool.lineWidth=1;
        tool.strokeRect(area.x, area.y, area.width, area.height);
      }

    }

    // shapes
    if (current.type === "Rectangle") {
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fillRect(current.x, current.y, current.width, current.height);
      tool.strokeRect(current.x, current.y, current.width, current.height);
      if (state.selected===current){
        let area = RectangleSelection(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(area.x, area.y, area.width, area.height);
      }
    }

    if (current.type === "Square") {
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fillRect(current.x, current.y, current.width, current.height);
      tool.strokeRect(current.x, current.y, current.width, current.height);
      if (state.selected===current){
        let area = SquareSelector(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(area.x, area.y, area.width, area.height);
      }
    }

    if (current.type === "Circle") {
      tool.beginPath();
      tool.arc(current.x, current.y, current.rad, 0, Math.PI * 2);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fill();
      tool.stroke();
      if (state.selected===current){
        let area = CircleSelector(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(area.x, area.y, area.width, area.height);
      }
    }

    if (current.type === "Triangle") {
      tool.beginPath();
      tool.moveTo(current.X1, current.Y1);
      tool.lineTo(current.X2, current.Y2);
      tool.lineTo(current.X3, current.Y3);
      tool.closePath();
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fill();
      tool.stroke();
      if (state.selected===current){
        let area = TriangleSelector(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(area.x, area.y, area.width, area.height);
      }
    }

    if (current.type === "Line") {
      tool.beginPath();
      tool.moveTo(current.x, current.y);
      tool.lineTo(current.lastX, current.lastY);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.stroke();
      if (state.selected===current){
        let area = LineSelector(current);
        tool.strokeStyle="blue";
        tool.lineWidth=3;
        tool.strokeRect(area.x, area.y, area.width, area.height);
      }
    }
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

let Drawing = false;
let X = 0;
let Y = 0;
let Shape_X = 0;
let Shape_Y = 0;


canvas.addEventListener("mousedown", function(e) {
    const pos= Uniform_pos(e);
    
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
    Stroke.id = count;
    Stroke.type = "Brush";
    Stroke.points = [{ x: X, y: Y }];
    Stroke.stroke = state.stroke;
    Stroke.StrokeWidth = state.size;
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
});

canvas.addEventListener("mousemove", function(e) {

  const pos= Uniform_pos(e);
  
  if (Drawing === false || state.tool !== "Brush") {
    return;
  }

  tool.strokeStyle = Stroke.stroke;
  tool.lineWidth = Stroke.StrokeWidth;
  tool.lineCap = "round";
  tool.lineJoin = "round";
  tool.beginPath();
  tool.moveTo(X, Y);
  tool.lineTo(pos.x, pos.y);
  tool.stroke();

  Stroke.points.push({ x: pos.x, y: pos.y });
  Save();

  X = pos.x;
  Y = pos.y;
});

canvas.addEventListener("mouseup", function(e) {
    const pos = Uniform_pos(e);
    if (state.tool === "Brush") {
        Drawing = false;
        const rect = canvas.getBoundingClientRect();
        state.objects.push(Stroke);
        Save();
        Stroke = null;
        render();
    }
    if (state.tool === "Brush" && Stroke) {
        Drawing = false;
        BrushCursor.style.display = "none";
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

    state.objects.push(item);
    Save();
    render();
    Drawing=false;
  }
});

canvas.addEventListener("mouseleave", function(e) {
  Drawing = false;
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
  render();
}

