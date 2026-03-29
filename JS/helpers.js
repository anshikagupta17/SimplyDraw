import { TOOLS } from "./state.js";

export function Uniform_pos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scale_X = canvas.width / rect.width;
    const scale_Y = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scale_X,
        y: (e.clientY - rect.top) * scale_Y
    };
}

export function add_to_history(state) {
    state.history.push(current_drawing(state));
    state.redoStack = [];
}

export function current_drawing(state) {
    let current = [];

    for (let i = 0; i < state.objects.length; i++) {
        let item = state.objects[i];
        let copy = { ...item };
        copy.img = undefined;

        if (item.type === TOOLS.brush && item.points) {
            copy.points = [...item.points];
        }

        current.push(copy);
    }

    return current;
}


export function restore_drawing(state, photo, render) {
    let storeImage = {};

    for (let i = 0; i < state.objects.length; i++) {
        let item = state.objects[i];
        if (item.type === TOOLS.image && item.src && item.img) {
            storeImage[item.src] = item.img;
        }
    }

    state.selected = null;
    state.objects = [];

    for (let i = 0; i < photo.length; i++) {
        let item = photo[i];
        let clone = { ...item };

        if (clone.type === TOOLS.brush && item.points) {
            clone.points = [...item.points];
        }

        if (clone.type === TOOLS.image && clone.src) {
            if (storeImage[clone.src]) {
                clone.img = storeImage[clone.src];
            } else {
                let img = new Image();
                img.crossOrigin = "anonymous";
                img.src = clone.src;
                img.onload = function () {
                    render();
                };
                clone.img = img;
            }
        }

        state.objects.push(clone);
    }
}

// brush selection

export function BrushSelection(brush){
    if (!brush.points || brush.points.length === 0) {
        return null;
    }

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
export function BrushDetector(brush, x,y){
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

export function RectangleSelection(rectangle){
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

export function SquareSelector(square){
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

export function CircleSelector(circle){
    let space= circle.StrokeWidth/2;

    return {
        x: circle.x - circle.rad - space,
        y: circle.y - circle.rad -space,
        width:(circle.rad*2) + space * 2,
        height:(circle.rad*2) + space * 2
    };
}

export function ActualCircleDetection(circle, x, y){
    let dx = x - circle.x;
    let dy = y - circle.y;
    return ((dx * dx + dy * dy) <= (circle.rad * circle.rad));
}
// Triangle selection

export function TriangleSelector(triangle){
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

export function TriangleDetector(triangle,x,y){
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

export function LineSelector(line){
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
export function LineDetector(line,x,y){
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

export function GetSelectionArea(item) {
    if (item.type === TOOLS.rectangle) {
        return RectangleSelection(item);
    }
    if (item.type === TOOLS.square) {
        return SquareSelector(item);
    }
    if (item.type === TOOLS.circle) {
        return CircleSelector(item);
    }
    if (item.type === TOOLS.triangle) {
        return TriangleSelector(item);
    }
    if (item.type === TOOLS.line) {
        return LineSelector(item);
    }
    if (item.type === TOOLS.brush) {
        return BrushSelection(item);
    }
    if (item.type === TOOLS.image || item.type === TOOLS.text) {
        return {   x: item.x, 
                   y: item.y, 
                   width: item.width, 
                   height: item.height 
            };
    }
    return null;
}

export function DetectObject(item, x, y) {
    if (item.type === TOOLS.brush) {
        return BrushDetector(item, x, y);
    }
    if (item.type === TOOLS.rectangle) {
        return ObjectClick(RectangleSelection(item), x, y);
    }
    if (item.type === TOOLS.square) {
        return ObjectClick(SquareSelector(item), x, y);
    }
    if (item.type === TOOLS.circle) {
        return ActualCircleDetection(item, x, y);
    }
    if (item.type === TOOLS.triangle) {
        return TriangleDetector(item, x, y);
    }
    if (item.type === TOOLS.line) {
        return LineDetector(item, x, y);
    }
    if (item.type === TOOLS.image) {
        return ObjectClick({ x: item.x,
                             y: item.y, 
                             width: item.width, 
                             height: item.height }, x, y
                            );
    }
    if (item.type === TOOLS.text) {
        return ObjectClick({ x: item.x,
                             y: item.y, 
                             width: item.width, 
                             height: item.height }, x, y
                            );
    }
    return false;
}
export function ObjectClick(area,x,y){
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
