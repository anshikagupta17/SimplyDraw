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

let savedDrawing = localStorage.getItem("drawing");
if (savedDrawing) {
  state.objects = JSON.parse(savedDrawing);
}

let count = 0;
let Stroke = null;

// buttons
const buttons = document.querySelectorAll(".tools button");

// cursor
const BrushCursor = document.getElementById("BrushCursor");

let panel = document.getElementById("properties");

let canvas = document.getElementById("Canvas");
let tool = canvas.getContext("2d");

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
      <label>Border</label>
      <input type="color" id="border" value="${state.border}">
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

  if (tool === "Eraser") {
    panel.innerHTML = `
      <label>Size</label>
      <input type="number" id="size" min="1" max="100" value="${state.size}">
    `;
  } else if (tool === "Image") {
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
      BrushCursor.style.width = state.size + "px";
      BrushCursor.style.height = state.size + "px";
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
    }

    // shapes
    if (current.type === "Rectangle") {
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fillRect(current.x, current.y, current.width, current.height);
      tool.strokeRect(current.x, current.y, current.width, current.height);
    }

    if (current.type === "Square") {
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fillRect(current.x, current.y, current.width, current.height);
      tool.strokeRect(current.x, current.y, current.width, current.height);
    }

    if (current.type === "Circle") {
      tool.beginPath();
      tool.arc(current.x, current.y, current.rad, 0, Math.PI * 2);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.StrokeWidth;
      tool.fill();
      tool.stroke();
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
    }

    if (current.type === "Line") {
      tool.beginPath();
      tool.moveTo(current.x, current.y);
      tool.lineTo(current.lastX, current.lastY);
      tool.fillStyle = current.fill;
      tool.strokeStyle = current.stroke;
      tool.lineWidth = current.size;
      tool.stroke();
    }
  }
}

function Save() {
  localStorage.setItem("drawing", JSON.stringify(state.objects));
}

let Drawing = false;
let X = 0;
let Y = 0;
let Shape_X = 0;
let Shape_Y = 0;

canvas.addEventListener("mousedown", function(e) {
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
    X = e.offsetX;
    Y = e.offsetY;
    Stroke = {};
    Stroke.id = count + 1;
    Stroke.type = "Brush";
    Stroke.points = [{ x: X, y: Y }];
    Stroke.stroke = state.stroke;
    Stroke.StrokeWidth = state.size;
  } else if (state.tool === "Rectangle") {
    Shape_X = e.offsetX;
    Shape_Y = e.offsetY;
  }

  if (state.tool === "Square") {
    Shape_X = e.offsetX;
    Shape_Y = e.offsetY;
  }
  if (state.tool === "Circle") {
    Shape_X = e.offsetX;
    Shape_Y = e.offsetY;
  }
  if (state.tool === "Triangle") {
    Shape_X = e.offsetX;
    Shape_Y = e.offsetY;
  }
  if (state.tool === "Line") {
    Shape_X = e.offsetX;
    Shape_Y = e.offsetY;
  }
});

canvas.addEventListener("mousemove", function(e) {
  if (Drawing === false || state.tool !== "Brush") {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const posX = e.clientX - rect.left;
  const posY = e.clientY - rect.top;

  BrushCursor.style.display = "block";
  BrushCursor.style.left = posX - state.size / 2 + "px";
  BrushCursor.style.top = posY - state.size / 2 + "px";
  BrushCursor.style.width = state.size + "px";
  BrushCursor.style.height = state.size + "px";
  BrushCursor.style.borderColor = state.stroke;

  tool.strokeStyle = Stroke.stroke;
  tool.lineWidth = Stroke.size;
  tool.lineCap = "round";
  tool.lineJoin = "round";
  tool.beginPath();
  tool.moveTo(X, Y);
  tool.lineTo(posX, posY);
  tool.stroke();

  Stroke.points.push({ x: posX, y: posY });
  Save();

  X = posX;
  Y = posY;
});

canvas.addEventListener("mouseup", function(e) {
  if (state.tool === "Brush") {
    Drawing = false;
    BrushCursor.style.display = "none";
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    state.objects.push(Stroke);
    Save();
    Stroke = null;
    render();
  }

  if (state.tool === "Rectangle") {
    let endX = e.offsetX;
    let endY = e.offsetY;
    let width = endX - Shape_X;
    let height = endY - Shape_Y;

    let item = {};
    count += 1;
    item.id = count;
    item.type = "Rectangle";
    item.x = Shape_X;
    item.y = Shape_Y;
    item.width = width;
    item.height = height;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;

    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === "Square") {
    let endX = e.offsetX;
    let endY = e.offsetY;
    let width = endX - Shape_X;
    let height = endY - Shape_Y;
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
    let endX = e.offsetX;
    let endY = e.offsetY;
    let x = endX - Shape_X;
    let y = endY - Shape_Y;
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
    let endX = e.offsetX;
    let endY = e.offsetY;
    let item = {};
    count += 1;
    item.id = count;
    item.type = "Triangle";
    item.X1 = Shape_X;
    item.Y1 = Shape_Y;
    item.X2 = endX;
    item.Y2 = endY;
    item.X3 = Shape_X + (Shape_X - endX);
    item.Y3 = endY;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;

    state.objects.push(item);
    Save();
    render();
    Drawing = false;
  }

  if (state.tool === "Line") {
    let endX = e.offsetX;
    let endY = e.offsetY;
    let item = {};
    count += 1;
    item.id = count;
    item.type = "Line";
    item.x = Shape_X;
    item.y = Shape_Y;
    item.lastX = endX;
    item.lastY = endY;
    item.fill = state.fill;
    item.stroke = state.border;
    item.StrokeWidth = state.size;

    state.objects.push(item);
    Save();
    render();
  }
});

canvas.addEventListener("mouseleave", function(e) {
  Drawing = false;
  BrushCursor.style.display = "none";
});

const theme = document.querySelector(".mode");

theme.addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        img.src = "icons/darkmode.png";
    } 
    else {
        img.src = "icons/lightmode.png";
    }

});