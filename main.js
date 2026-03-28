document.querySelectorAll('.flexbox img').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.flexbox img').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});


const tb = document.getElementById('togglebtn');

tb.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');  /*dark mode on*/
  const dark_mode_on = document.body.classList.contains('dark-mode');

  //update color for new shapes
  if (dark_mode_on && current_state.current_color === '#000000') {  // only change color if they are using the black/white 
    current_state.current_color = '#FFFFFF';
    document.getElementById('color-picker').value = '#FFFFFF';
  } else if (!dark_mode_on && (current_state.current_color === '#FFFFFF')) {
    current_state.current_color = '#000000';
    document.getElementById('color-picker').value = '#000000';
  }
  //update existing shapes
  elements.forEach(e => {
    if (dark_mode_on && e.color === '#000000') {
      e.color = '#FFFFFF'; //only black shapes turn to white and viceversa 
    } else if (!dark_mode_on && (e.color === '#FFFFFF' || e.color === '#ffffff')) {
      e.color = '#000000';
    }
    render_canvas();
    save_canvas();
  })
  if (dark_mode_on) {
    tb.src = 'images/sun.png';
    tb.alt = 'Light Mode';
  } else {
    tb.src = 'images/moon.png';
    tb.alt = 'Dark Mode';
  }
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let elements = [];
let redo_stack = [];

function perform_undo() {
  if (elements.length > 0) {
    const popped_element = elements.pop(); //remove element
    redo_stack.push(popped_element);       //save to redo stack
    render_canvas();
    save_canvas();
  }
}

function perform_redo() {
  if (redo_stack.length > 0) {
    const restored_element = redo_stack.pop(); //take elements out of redo stack
    elements.push(restored_element);
    render_canvas();
    save_canvas();
  }
}

const current_state = {
  current_tool: "none",
  is_drawing: false,
  current_color: "#000000",
  stroke_width: 2,
  opacity: 1,
  stroke_style: "solid",
  font_size: 24,
  font_family: ' "Lucida Console", "Courier New", monospace'
};

const history = []; /*stack for undo*/

/*function to fix the dpr and make display crisp*/
function resize_canvas() {
  const dpr = window.devicePixelRatio; // one css pixels is mapped to how many device pixels
  canvas.width = window.innerWidth * dpr; // no. of actual device pixels
  canvas.style.width = window.innerWidth + 'px'; // how many pixels does browser scale down css pixels
  canvas.height = window.innerHeight * dpr;
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr); //scaling 1 css pixel to 1 dpr

  //this clears the canvas
}

function get_coordinates(event) {
  const bounding = canvas.getBoundingClientRect(); //gives the coordinates of canvas relative to browser window
  const x = event.clientX - bounding.left; //coordinates of user relative to canvas
  const y = event.clientY - bounding.top;
  return { x, y }; //returns an object containing coordinates
}

function rectangle(e) {
  ctx.strokeRect(e.x, e.y, e.width, e.height);
}

function line(e) {
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.xf, e.yf);
  ctx.stroke();
}

function circle(e) {
  ctx.beginPath();
  ctx.arc(e.center_x, e.centre_y, e.radius, 0, 2 * Math.PI);
  ctx.stroke();

}

function square(e) {
  ctx.strokeRect(e.x, e.y, e.width, e.height);

}

function triangle(e) {
  ctx.beginPath();
  ctx.moveTo(e.x + (e.width / 2), e.y);
  ctx.lineTo(e.x + e.width, e.y + e.height);
  ctx.lineTo(e.x, e.y + e.height);
  ctx.closePath();
  ctx.stroke();
}

function pen(e) {
  ctx.beginPath();
  ctx.moveTo(e.points[0].x, e.points[0].y);
  for (let i = 1; i < e.points.length; i++) {
    ctx.lineTo(e.points[i].x, e.points[i].y);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function save_canvas() {
  localStorage.setItem('canvas', JSON.stringify(elements));
}

const image = {};

function draw_image(e) {
  let img = image[e.url];
  if (!img) {
    img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = render_canvas;
    img.src = e.url;
    image[e.url] = img;
  }
  if (img.complete) {
    ctx.drawImage(img, e.x, e.y, e.width, e.height);
  }
}
//calculates the dimension of the blue box
function get_bounding_box(e) {
  if (e.type === 'rectangle' || e.type === 'square' || e.type === 'image' || e.type === 'triangle') {
    return {
      x: Math.min(e.x, e.x + e.width),
      y: Math.min(e.y, e.y + e.height),
      width: Math.abs(e.width),
      height: Math.abs(e.height)
    };
  } else if (e.type === 'circle') {
    return {
      x: e.center_x - e.radius,
      y: e.centre_y - e.radius,
      width: e.radius * 2,
      height: e.radius * 2
    };
  } else if (e.type === 'line') {
    return {
      x: Math.min(e.x, e.xf),
      y: Math.min(e.y, e.yf),
      width: Math.abs(e.xf - e.x),
      height: Math.abs(e.yf - e.y)
    };
  } else if (e.type === 'pen') {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let p of e.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  } else if (e.type === 'text') {
    return {
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height
    };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

// find which element we are inside
function get_element_at_position(x, y) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const e = elements[i];
    const bounds = get_bounding_box(e);

    //5px padding so even if user hits a bit off, it still detects
    if (x >= bounds.x - 5 && x <= bounds.x + bounds.width + 5 &&
      y >= bounds.y - 5 && y <= bounds.y + bounds.height + 5) {

      //radius check so clicking the corner of its box  in circle doesn't select it
      if (e.type === 'circle') {
        const distance = Math.hypot(x - e.center_x, y - e.centre_y);
        if (distance <= e.radius) return e;
      } else {
        return e;
      }
    }
  }
  return null;
}

// checks which corner box is being clicked
function get_clicked_handle(mouse_x, mouse_y, shape) {
  const handle_size = 10; //padding so that if a user click is a bit off it still detects user hit 
  const bounds = get_bounding_box(shape);

  const is_inside = (x, y, corner_x, corner_y) => {
    return x >= corner_x - handle_size && x <= corner_x + handle_size &&
      y >= corner_y - handle_size && y <= corner_y + handle_size;
  };

  if (is_inside(mouse_x, mouse_y, bounds.x, bounds.y)) return 'tl'; //topleft
  if (is_inside(mouse_x, mouse_y, bounds.x + bounds.width, bounds.y)) return 'tr'; //topright
  if (is_inside(mouse_x, mouse_y, bounds.x, bounds.y + bounds.height)) return 'bl'; //bottomleft
  if (is_inside(mouse_x, mouse_y, bounds.x + bounds.width, bounds.y + bounds.height)) return 'br'; //bottomright

  return null;
}

//function to handle negative widths 
function adjust_element_coordinates(shape) {
  if (shape.width !== undefined && shape.height !== undefined) {

    if (shape.width < 0) {
      shape.x = shape.x + shape.width; //shift x left 
      shape.width = Math.abs(shape.width);
    }

    if (shape.height < 0) {
      shape.y = shape.y + shape.height; //shift y up 
      shape.height = Math.abs(shape.height);
    }
  }
}

//function to draw boxes on corner
function draw_resize_handles(shape, ctx) {
  const handle_size = 8;
  const offset = handle_size / 2;
  const bounds = get_bounding_box(shape);

  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#0078D7';
  ctx.lineWidth = 2;

  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
  ];

  corners.forEach(corner => {
    ctx.fillRect(corner.x - offset, corner.y - offset, handle_size, handle_size);
    ctx.strokeRect(corner.x - offset, corner.y - offset, handle_size, handle_size);
  });
}

//function to rotate a point around a center 
function rotate_point(x, y, cx, cy, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
  const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
  return { x: nx, y: ny };
}

function text(e) {
  ctx.font = `${e.fontSize}px ${e.fontFamily}`;
  ctx.fillStyle = e.color || '#000000';
  ctx.textBaseline = 'top';
  ctx.fillText(e.text, e.x, e.y);

}

/*looks at the elements array and renders canvas*/
function render_canvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  elements.forEach(e => {

    ctx.save(); //saves the canvas

    const bounds = get_bounding_box(e);
    const center_x = bounds.x + bounds.width / 2;
    const center_y = bounds.y + bounds.height / 2;

    ctx.translate(center_x, center_y); //makes the center of canvas to be centre of shape
    ctx.rotate(e.angle || 0); //rotation
    ctx.translate(-center_x, -center_y); //reverses it 

    ctx.strokeStyle = e.color || "#000000";
    ctx.lineWidth = e.stroke_width || 2;
    ctx.globalAlpha = e.opacity || 1;

    if (e.stroke_style === "dashed") {
      ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth * 2]); //ctx.setLineDash(dash length, gap length)
    } else {
      ctx.setLineDash([]);
    }

    switch (e.type) {
      case 'rectangle': rectangle(e);
        break;

      case 'line': line(e);
        break;

      case 'circle': circle(e);
        break;

      case 'square': square(e);
        break;

      case 'triangle': triangle(e);
        break;

      case 'pen': pen(e);
        break;

      case 'image': draw_image(e);
        break;

      case 'text': text(e);
        break;

    }

    //draws the resize handles, bounding box and rotation handle
    if (e === selected_element && current_state.current_tool === 'select') {
      ctx.strokeStyle = '#0078D7';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const bounds = get_bounding_box(selected_element);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height); //bounding box 
      ctx.setLineDash([]);

      draw_resize_handles(selected_element, ctx);
      const handle_distance = 30;
      const handle_y = bounds.y - handle_distance;   //rotation handle
      const top_center_x = bounds.x + bounds.width / 2;

      ctx.beginPath();
      ctx.moveTo(top_center_x, bounds.y);
      ctx.lineTo(top_center_x, handle_y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(top_center_x, handle_y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'blue';   //dot 
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

  });
}

//tool selection logic

let current_element = null;
let selected_element = null;
let drag_offsetX = 0;
let drag_offsetY = 0;
let is_dragging_shape = false;
let is_resizing = false;
let active_resize_handle = null;
let is_rotating = false;

//pointerdown event tracks the start of the event 
canvas.addEventListener('pointerdown', (event) => {
  current_state.is_drawing = true;
  const coords = get_coordinates(event);

  if (current_state.current_tool === 'select') {
    if (selected_element) {
      const bounds = get_bounding_box(selected_element);
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;  //center of shape
      const angle = selected_element.angle || 0;
      const unrotated_click = rotate_point(coords.x, coords.y, cx, cy, -angle);  //unrotating the mouse as canvas got rotated
      const clicked_handle = get_clicked_handle(unrotated_click.x, unrotated_click.y, selected_element);
      if (clicked_handle) {
        is_resizing = true;
        active_resize_handle = clicked_handle;
        return;
      }
    }

    if (selected_element) {
      const bounds = get_bounding_box(selected_element);

      const center_x = bounds.x + bounds.width / 2;
      const center_y = bounds.y + bounds.height / 2;
      const distance_to_handle = (bounds.height / 2) + 30;  //distance of handle to center 

      const handle_x = center_x + distance_to_handle * Math.sin(selected_element.angle || 0);
      const handle_y = center_y - distance_to_handle * Math.cos(selected_element.angle || 0); //exact location of blue dot

      const dx = coords.x - handle_x;
      const dy = coords.y - handle_y;
      const distance_to_mouse = Math.sqrt(dx * dx + dy * dy);

      if (distance_to_mouse <= 10) {  //10 padding 
        is_rotating = true;
        return;
      }
    }

    selected_element = get_element_at_position(coords.x, coords.y);

    if (selected_element) {
      is_dragging_shape = true;
      const bounds = get_bounding_box(selected_element);
      drag_offsetX = coords.x - bounds.x;
      drag_offsetY = coords.y - bounds.y;
    }

    render_canvas();
    return;
  }

  if (current_state.current_tool === 'eraser') {
    const clicked_element = get_element_at_position(coords.x, coords.y);
    if (clicked_element) {
      const index = elements.indexOf(clicked_element);
      if (index !== -1) {
        elements.splice(index, 1);
        redo_stack = [];
        selected_element = null;
        render_canvas();
        save_canvas();
      }
    }
    return; 
  }

  else if (current_state.current_tool === 'rectangle') {
    current_element = {
      type: 'rectangle',
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      color: current_state.current_color,
      stroke_width: current_state.stroke_width,
      opacity: current_state.opacity,
      stroke_style: current_state.stroke_style

    };
    elements.push(current_element);
  }

  else if (current_state.current_tool === 'line') {

    current_element = {
      type: 'line',
      x: coords.x,
      y: coords.y,
      xf: coords.x,
      yf: coords.y,
      color: current_state.current_color,
      stroke_width: current_state.stroke_width,
      opacity: current_state.opacity,
      stroke_style: current_state.stroke_style

    };
    elements.push(current_element);
  }

  else if (current_state.current_tool === 'circle') {

    current_element = {

      type: 'circle',
      center_x: coords.x,
      centre_y: coords.y,
      radius: 0,
      color: current_state.current_color,
      stroke_width: current_state.stroke_width,
      opacity: current_state.opacity,
      stroke_style: current_state.stroke_style

    };
    elements.push(current_element);

  }

  else if (current_state.current_tool === 'square') {
    current_element = {
      type: 'square',
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      color: current_state.current_color,
      stroke_width: current_state.stroke_width,
      opacity: current_state.opacity,
      stroke_style: current_state.stroke_style
    };
    elements.push(current_element);
  }

  else if (current_state.current_tool === 'triangle') {

    current_element = {
      type: 'triangle',
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      color: current_state.current_color,
      stroke_width: current_state.stroke_width,
      opacity: current_state.opacity,
      stroke_style: current_state.stroke_style

    };
    elements.push(current_element);
  }

  else if (current_state.current_tool === 'pen') {

    current_element = {
      type: 'pen',
      points: [{ x: coords.x, y: coords.y }],
      color: current_state.current_color,
      stroke_width: current_state.stroke_width,
      opacity: current_state.opacity,
      stroke_style: current_state.stroke_style

    };
    elements.push(current_element);
  }

  else if (current_state.current_tool === 'image') {
    current_element = {
      type: 'image',
      x: coords.x,
      y: coords.y,
      width: 300,
      height: 300,
      url: `https://picsum.photos/seed/${Math.random()}/400/400`
    };
    elements.push(current_element);
  }
  else if (current_state.current_tool === 'text') {
    const rect = canvas.getBoundingClientRect();
    const screen_x = rect.left + coords.x;
    const screen_y = rect.top + coords.y;

    const input = document.createElement('textarea');

    input.style.position = 'fixed';
    input.style.left = screen_x + 'px';
    input.style.top = screen_y + 'px';

    input.style.zIndex = '100000'; //forcing input html to be on top of all layers

    input.style.background = 'transparent';
    input.style.border = '1px dashed #0078D7';
    input.style.outline = 'none';
    input.style.resize = 'none';
    input.style.overflow = 'hidden';
    input.style.whiteSpace = 'pre';
    input.style.padding = '0';
    input.style.margin = '0';


    const font_size = current_state.font_size;
    const font_family = current_state.font_family;
    input.style.font = `${font_size}px ${font_family}`;
    input.style.font = `${font_size}px ${font_family}`;
    input.style.color = current_state.current_color;

    input.style.width = '300px';
    input.style.height = `${font_size * 2}px`;

    document.body.appendChild(input);

    //waits for browsers default behaviour to finish and puts a blinking cursor 10 ms later
    setTimeout(() => {
      input.focus();
    }, 10);

    //prevents new line behaviour on entering rather saves to canvas
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });

    input.addEventListener('blur', function () {
      const text_value = input.value.trim();

      if (text_value.length > 0) {
        ctx.font = `${font_size}px ${font_family}`;
        const text_width = ctx.measureText(text_value).width;

        const new_text_element = {
          type: 'text',
          text: text_value,
          x: coords.x,
          y: coords.y,
          fontSize: font_size,
          fontFamily: font_family,
          width: text_width,
          height: font_size,
          color: current_state.current_color,
          angle: 0
        };

        elements.push(new_text_element);
        redo_stack = [];

        //to allow drag
        selected_element = new_text_element;

        render_canvas();
        save_canvas();
      }

      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    });

    //to drag and rotate

    current_state.current_tool = 'select';
    document.querySelectorAll('.item').forEach(btn => btn.classList.remove('active'));

    const select_btn = document.querySelector('[data-tool="select"]');
    if (select_btn) select_btn.classList.add('active');

    return;
  }
})

canvas.addEventListener('pointermove', (event) => {
  if (!current_state.is_drawing) {
    return;
  }
  const current_coords = get_coordinates(event);
  const current_x = current_coords.x;
  const current_y = current_coords.y;

  if (is_rotating && selected_element) {
    const bounds = get_bounding_box(selected_element);
    const center_x = bounds.x + bounds.width / 2;
    const center_y = bounds.y + bounds.height / 2;

    const delta_x = current_x - center_x;
    const delta_y = current_y - center_y;

    selected_element.angle = Math.atan2(delta_y, delta_x) + (Math.PI / 2);  //how much angle has it been rotated
    render_canvas();
    return;
  }

  if (is_resizing && selected_element) {

    const bounds = get_bounding_box(selected_element);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const angle = selected_element.angle || 0;
    const unrotated_mouse = rotate_point(current_x, current_y, cx, cy, -angle);
    const active_x = unrotated_mouse.x;
    const active_y = unrotated_mouse.y;

    if (selected_element.type === 'circle') {
      selected_element.radius = Math.hypot(active_x - selected_element.center_x, active_y - selected_element.centre_y);
    }

    else if (selected_element.type === 'line') {
      if (active_resize_handle === 'tl' || active_resize_handle === 'bl') {
        selected_element.x = active_x; selected_element.y = active_y;
      } else {
        selected_element.xf = active_x; selected_element.yf = active_y;
      }
    }

    else if (['rectangle', 'square', 'triangle', 'image', 'text'].includes(selected_element.type)) {
      const old_center_x = selected_element.x + selected_element.width / 2;
      const old_center_y = selected_element.y + selected_element.height / 2;
      let anchor_local_x, anchor_local_y;
      switch (active_resize_handle) {
        case 'tl': anchor_local_x = selected_element.x + selected_element.width; anchor_local_y = selected_element.y + selected_element.height; break;
        case 'tr': anchor_local_x = selected_element.x; anchor_local_y = selected_element.y + selected_element.height; break;
        case 'bl': anchor_local_x = selected_element.x + selected_element.width; anchor_local_y = selected_element.y; break;
        case 'br': anchor_local_x = selected_element.x; anchor_local_y = selected_element.y; break;
      }
      const old_anchor_global = rotate_point(anchor_local_x, anchor_local_y, old_center_x, old_center_y, angle);
      const orig_right = selected_element.x + selected_element.width;
      const orig_bottom = selected_element.y + selected_element.height;

      switch (active_resize_handle) {
        case 'tl':
          selected_element.width = orig_right - active_x;
          selected_element.height = orig_bottom - active_y;
          selected_element.x = active_x;
          selected_element.y = active_y;
          break;
        case 'tr':
          selected_element.width = active_x - selected_element.x;
          selected_element.height = orig_bottom - active_y;
          selected_element.y = active_y;
          break;
        case 'bl':
          selected_element.width = orig_right - active_x;
          selected_element.height = active_y - selected_element.y;
          selected_element.x = active_x;
          break;
        case 'br':
          selected_element.width = active_x - selected_element.x;
          selected_element.height = active_y - selected_element.y;
          break;
      }

      const new_center_x = selected_element.x + selected_element.width / 2;
      const new_center_y = selected_element.y + selected_element.height / 2;
      const new_anchor_global = rotate_point(anchor_local_x, anchor_local_y, new_center_x, new_center_y, angle);
      selected_element.x += old_anchor_global.x - new_anchor_global.x;
      selected_element.y += old_anchor_global.y - new_anchor_global.y;
      
      if (selected_element.type === 'text') {
        selected_element.fontSize = Math.max(5, Math.abs(selected_element.height));
        selected_element.height = selected_element.fontSize; 
        ctx.font = `${selected_element.fontSize}px ${selected_element.fontFamily}`;
        const true_width = ctx.measureText(selected_element.text).width;
        selected_element.width = true_width*Math.sign(selected_element.width || 1) ; 
      }
      
    }

    else if (selected_element.type === 'pen') {
      const bounds = get_bounding_box(selected_element);
      const safe_width = bounds.width === 0 ? 0.001 : bounds.width;
      const safe_height = bounds.height === 0 ? 0.001 : bounds.height;
      let anchor_x, anchor_y, new_width, new_height;
      switch (active_resize_handle) {
        case 'tl':
          anchor_x = bounds.x + bounds.width;
          anchor_y = bounds.y + bounds.height;
          new_width = anchor_x - current_x;
          new_height = anchor_y - current_y;
          break;
        case 'tr':
          anchor_x = bounds.x;
          anchor_y = bounds.y + bounds.height;
          new_width = current_x - anchor_x;
          new_height = anchor_y - current_y;
          break;
        case 'bl':
          anchor_x = bounds.x + bounds.width;
          anchor_y = bounds.y;
          new_width = anchor_x - current_x;
          new_height = current_y - anchor_y;
          break;
        case 'br':
          anchor_x = bounds.x;
          anchor_y = bounds.y;
          new_width = current_x - anchor_x;
          new_height = current_y - anchor_y;
          break;
      }

      const scaleX = new_width / safe_width;
      const scaleY = new_height / safe_height;
      selected_element.points.forEach(p => {
        p.x = anchor_x + (p.x - anchor_x) * scaleX;
        p.y = anchor_y + (p.y - anchor_y) * scaleY;
      });
    }
    render_canvas();
    return;
  }

  if (current_state.current_tool === 'rectangle') {
    current_element.width = current_coords.x - current_element.x;
    current_element.height = current_coords.y - current_element.y;
  }

  else if (current_state.current_tool === 'line') {
    current_element.xf = current_coords.x;
    current_element.yf = current_coords.y;

  }

  else if (current_state.current_tool === 'circle') {
    const change_x = current_coords.x - current_element.center_x;
    const change_y = current_coords.y - current_element.centre_y;
    current_element.radius = Math.hypot(change_x, change_y);
  }

  else if (current_state.current_tool === 'square') {
    const change_x = current_coords.x - current_element.x;
    const change_y = current_coords.y - current_element.y;
    const side = Math.max(Math.abs(change_x), Math.abs(change_y));

    current_element.width = side * Math.sign(change_x);
    current_element.height = side * Math.sign(change_y);

  }

  else if (current_state.current_tool === 'triangle') {
    current_element.width = current_coords.x - current_element.x;
    current_element.height = current_coords.y - current_element.y;
  }

  else if (current_state.current_tool === 'pen') {
    current_element.points.push({ x: current_coords.x, y: current_coords.y });
  }

  else if (current_state.current_tool === 'image') {
    current_element.width = current_coords.x - current_element.x;
    current_element.height = current_coords.y - current_element.y;
  }

  else if (current_state.current_tool === 'select') {
    if (is_dragging_shape && selected_element) {
      const bounds = get_bounding_box(selected_element);
      const targetX = current_coords.x - drag_offsetX; //calculates where the final top left corner of rectangle would come
      const targetY = current_coords.y - drag_offsetY;
      //how far the mouse has moved
      const dx = targetX - bounds.x;
      const dy = targetY - bounds.y;
      //shift by that amount
      if (selected_element.type === 'rectangle' || selected_element.type === 'square' || selected_element.type === 'image' || selected_element.type === 'triangle' || selected_element.type === 'text') {
        selected_element.x += dx;
        selected_element.y += dy;
      } else if (selected_element.type === 'circle') {
        selected_element.center_x += dx;
        selected_element.centre_y += dy;
      } else if (selected_element.type === 'line') {
        selected_element.x += dx;
        selected_element.y += dy;
        selected_element.xf += dx;
        selected_element.yf += dy;
      } else if (selected_element.type === 'pen') {
        for (let p of selected_element.points) {
          p.x += dx;
          p.y += dy;
        }
      }
      render_canvas();
    }
    return;
  }

  render_canvas();

})

//when we have finished drawing 

canvas.addEventListener('pointerup', (event) => {
  current_state.is_drawing = false;
  current_element = null;

  if (is_resizing && selected_element) {
    adjust_element_coordinates(selected_element);
  }
  is_resizing = false;
  is_dragging_shape = false;
  active_resize_handle = null;
  is_rotating = false;
  redo_stack = [];
  save_canvas();
  render_canvas();
});

const toolbar = document.querySelectorAll('.item');

toolbar.forEach(tool => {
  tool.addEventListener('click', () => {
    current_state.current_tool = tool.getAttribute('data-tool');
    selected_element = null;
    render_canvas();
    toolbar.forEach(btn => btn.classList.remove('active'));
    tool.classList.add('active');
  });
});

resize_canvas();
window.addEventListener('resize', () => {
  resize_canvas();
  render_canvas();
});


//pressing ctrl+z
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (elements.length > 0) {
      const popped = elements.pop();
      redo_stack.push(popped);
      render_canvas();
      save_canvas();
    }
  }
});

const saved_data = localStorage.getItem('canvas');

if (saved_data) {
  //converting string back into js objects
  const parsed_data = JSON.parse(saved_data);
  elements.push(...parsed_data); //to not push the whole array as one element
  render_canvas();
}

document.getElementById('color-picker').addEventListener('input', (e) => current_state.current_color = e.target.value);
document.getElementById('width-slider').addEventListener('input', (e) => current_state.stroke_width = parseInt(e.target.value));
document.getElementById('opacity-slider').addEventListener('input', (e) => current_state.opacity = parseFloat(e.target.value));
document.getElementById('style-picker').addEventListener('change', (e) => current_state.stroke_style = e.target.value);
document.getElementById('font-size-picker').addEventListener('input', (e) => current_state.font_size = parseInt(e.target.value));
document.getElementById('font-family-picker').addEventListener('change', (e) => current_state.font_family = e.target.value);
document.getElementById('undo-btn').addEventListener('click', perform_undo);
document.getElementById('redo-btn').addEventListener('click', perform_redo);
document.getElementById('clear-btn').addEventListener('click', () => {
  //asks for confirmation
  if (confirm("Are you sure you want to clear the entire canvas?")) {
    elements = [];
    redo_stack = [];
    render_canvas();
    save_canvas();
  }
});
