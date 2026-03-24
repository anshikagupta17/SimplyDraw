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


const buttons= document.querySelectorAll(".tools button");

const BrushCursor= document.getElementById("BrushCursor");

let panel= document.getElementById("properties");

let canvas = document.getElementById("Canvas");
let tool = canvas.getContext("2d");

function Sidebar(tool) {
    panel.innerHTML="";

   if (tool === "Rectangle" || tool === "Square" || tool === "Circle" || tool === "Triangle" || tool==="Line") {
        panel.innerHTML=`<div class="control">
        <label>Colour</label>
        <input type="color" id="fill" value="${state.fill}">
        </div>

        <label>Border</label>
        <input type="color" id="border" value="${state.border}">

        <div class="control">
        <label>Width</label>
        <input type="number" id="size" min="1" max="100" value="${state.size}">
        </div>
        `
    }

    if (tool === "Brush") {
        panel.innerHTML=`<div class="control">
        <label>Colour</label>
        <input type="color" id="color" value="${state.stroke}">
        </div>

        <div class="control">
        <label>Width</label>
        <input type="number" id="size" min="0" max="100" value="${state.size}">
        </div>
        `
    }

    if (tool=== "Eraser") {
        panel.innerHTML=`<label>Size</label>
        <input type="range" id="size" min="1" max="100" value="${state.size}">
        `
    }

    else if (tool === "Image") {
        panel.innerHTML= `<button id="Insert">Insert Image</button>
        <input type="file" id="image" accept="image/*">
        `
    }

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


function Sidework(){
    let v_size = document.getElementById("size");
    let v_fill = document.getElementById("fill");
    let v_color = document.getElementById("color");
    let v_border = document.getElementById("border");
    let v_image = document.getElementById("image");

    if (v_size) {
        v_size.addEventListener("input", function (e) {
            state.size = e.target.value;
        });
    }

    if (v_fill) {
        v_fill.addEventListener("input", function (e) {
            state.fill = e.target.value;
        });
    }

    if (v_color) {
        v_color.addEventListener("input", function (e) {
            state.stroke = e.target.value;
        });
    }
    
    if (v_border) {
        v_border.addEventListener("input", function(e) {
            state.border = e.target.value; 
        });
    }

    if (v_image) {
        v_image.addEventListener("change", function(e){
            let upload = e.target.files[0];
            if (!file) {
                return;
            }
            let img = new Image();
        });
    }
}


let Drawing=false;

let X=0;
let Y=0;

let Shape_X = 0;
let Shape_Y = 0;

canvas.addEventListener("mousedown", function(e){

    if (state.tool === "Brush" || state.tool === "Rectangle" || state.tool === "Square" || state.tool==="Circle" || state.tool==="Triangle" || state.tool==="Line") {
        Drawing = true;
    }   

    if (state.tool === "Brush") {
        X = e.offsetX;
        Y = e.offsetY;
    }

    else if (state.tool === "Rectangle") {
        Shape_X = e.offsetX;
        Shape_Y = e.offsetY;
    }

    if (state.tool==="Square"){
        Shape_X = e.offsetX;
        Shape_Y = e.offsetY;
    }
    if (state.tool=== "Circle"){
        Shape_X = e.offsetX;
        Shape_Y = e.offsetY;
    }
    if (state.tool==="Triangle"){
        Shape_X = e.offsetX;
        Shape_Y = e.offsetY;
    }
    if (state.tool==="Line"){
        Shape_X = e.offsetX;
        Shape_Y = e.offsetY;
    }
});
canvas.addEventListener("mousemove",function(e){
    if (Drawing===false || state.tool!=="Brush"){
        return;
    }
    const posX = e.offsetX;
    const posY = e.offsetY;

    BrushCursor.style.display="block";
    BrushCursor.style.left=e.pageX + "px";
    BrushCursor.style.top=e.pageY + "px";
    BrushCursor.style.width=state.size + "px";
    BrushCursor.style.height=state.size + "px";
    BrushCursor.style.borderColor=state.stroke;

    tool.strokeStyle = state.stroke;
    tool.lineWidth=state.size;
    tool.lineCap = "round";
    tool.lineJoin = "round";
    tool.beginPath();
    tool.moveTo(X,Y);
    tool.lineTo(posX,posY);
    tool.stroke();
    X=posX;
    Y=posY;

});

canvas.addEventListener("mouseup",function(e){
    if(state.tool=="Brush"){
        Drawing=false;
        BrushCursor.style.display="none";
    }
    if (state.tool === "Rectangle"){
        let endX = e.offsetX;
        let endY = e.offsetY;
        let width=endX-Shape_X;
        let height=endY-Shape_Y;

        tool.fillRect(Shape_X, Shape_Y, width, height);
        tool.strokeRect(Shape_X, Shape_Y, width, height);

        tool.fillStyle = state.fill;
        tool.strokeStyle = state.border;
        tool.lineWidth = state.size;

        Drawing = false;
    }
    if (state.tool === "Square"){
        let endX = e.offsetX;
        let endY = e.offsetY;
        let width=endX-Shape_X;
        let height=endY-Shape_Y;
        let p_width = Math.abs(width);
        let p_height = Math.abs(height);
        let size=0;
        if (p_width < p_height) {
            size = p_width;
        }
        else {
            size = p_height;
        }
        let FinalWidth;
        if (width < 0) {
            FinalWidth = -size;
        }
        else {
            FinalWidth = size;
        }

        let FinalHeight;
        if (height < 0) {
            FinalHeight = -size;
        }
        else {
            FinalHeight = size;
        }

        tool.fillStyle = state.fill;
        tool.strokeStyle = state.border;
        tool.lineWidth = state.size;

        tool.fillRect(Shape_X, Shape_Y, FinalWidth, FinalHeight);
        tool.strokeRect(Shape_X, Shape_Y, FinalWidth, FinalHeight);

    Drawing = false;
    }
    if (state.tool==="Circle"){
        let endX = e.offsetX;
        let endY=e.offsetY;
        let x=endX-Shape_X;
        let y= endY-Shape_Y;;
        let radius= Math.sqrt(x*x +y*y);
        tool.beginPath();
        tool.arc(Shape_X, Shape_Y, radius, 0, Math.PI * 2);
        tool.fillStyle = state.fill;
        tool.strokeStyle = state.border;
        tool.lineWidth = state.size;
        tool.fill();
        tool.stroke();

        Drawing = false;

    }
    if (state.tool==="Triangle"){
        let endX=e.offsetX;
        let endY= e.offsetY;
        let x1=Shape_X;
        let x2= endX;
        let x3= Shape_X +(Shape_X-endX);
        let y1= Shape_Y;
        let y2= endY;
        let y3= endY;
        tool.beginPath();
        tool.moveTo(x1,y1);
        tool.lineTo(x2,y2);
        tool.lineTo(x3,y3);
        tool.closePath();
        tool.fillStyle = state.fill;
        tool.strokeStyle = state.border;
        tool.lineWidth = state.size;
        tool.fill();
        tool.stroke();

        Drawing=false;
    }
    if (state.tool==="Line"){
        let endX = e.offsetX;
        let endY = e.offsetY;
        tool.beginPath();
        tool.moveTo(Shape_X,Shape_Y);
        tool.lineTo(endX,endY);
        tool.fillStyle = state.fill;
        tool.strokeStyle=state.stroke;
        tool.lineWidth = state.size;
        tool.stroke();
    }
});

canvas.addEventListener("mouseleave",function(e){
    Drawing=false;
    BrushCursor.style.display= "none";
});