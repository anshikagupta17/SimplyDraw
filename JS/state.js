export const state = {
  tool: null,
  stroke: "#000000",
  fill: "#ffffff",
  border: "#000000",
  size: 5,
  opacity: 1,
  image: null,
  objects: [],
  history: [],
  redoStack: [],
  selected: null,
  brush_style: "pen",
  empty: true,
  BorderEmpty: false,
};
export const TOOLS = {
  rectangle: "Rectangle",
  square: "Square",
  circle: "Circle",
  triangle: "Triangle",
  line: "Line",
  brush: "Brush",
  text: "Text",
  image: "Image",
  select: "Select"
};