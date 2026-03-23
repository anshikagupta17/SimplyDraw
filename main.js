const state = {
  tool: null,
  stroke: "#000000",
  fill: "#000000",
  border: "#000000",
  size: 5,
  opacity: 1,

  objects: [],
  history: [],
  selected: null
};

const buttons = document.querySelectorAll(".tools button");
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