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

function Sidebar(tool) {
    panel.innerHTML="";

    if (tool=== "shapes") {
        panel.innerHTML=`<label>Colour</label>
        <input type="color" id="fill" value=${state.fill}>
        
        <label>Border</label>
        <input type="color" id="border" value=${state.border}>

        <label>Width</label>
        <input type="range" id="size" min="1" max="20" value="${state.size}">
        `
    }

    if (tool === "Brush") {
        panel.innerhtml=`<label>Colour</label>
        <input type="color" id="color" value=${state.stroke}>

        <label>Width</label>
        <input type="range" id="size" min="0" max="100" value=${state.size}>
        `
    }

    if (tool=== "Eraser") {
        panel.innerHTML=`<label>Size</label>
        <input type="range" id="size" min="1" max="100" value="${state.size}>
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

let panel= document.getElementById("properties");

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

let canvas = document.getElementById("Canvas");
let tool = canvas.getContext("2d");

let Drawing=true;
let X,Y=0;

canvas.addEventListener("mousedown",function(e){
    Drawing=true;
    X=e.offsetX;
    Y=e.offsetY;
});
canvas.addEventListener("mousemove",function(e){
    if (Drawing===false){
        return;
    }
    let posX=e.offsetX;
    let posY= e.offsetY;
});
canvas.addEventListener("mouseup",function(e){
    Drawing=false;
});
