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

const elements = [];

const current_state = {
  current_tool: "none",
  is_drawing: false,
  current_color: "#000000",
  stroke_width: 2,
  opacity: 1,
  stroke_style: "solid"
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


/*looks at the elements array and renders canvas*/
function render_canvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  elements.forEach(e => {
    
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

      case 'image' : draw_image(e);
        break;


      //function to be completed
    }
  }
  )
  if (selected_element) {
    ctx.strokeStyle = '#0078D7';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); 
    const bounds = get_bounding_box(selected_element);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.setLineDash([]); 
  }
}

//tool selection logic

let current_element = null;
let selected_element = null;
let drag_offsetX = 0;
let drag_offsetY = 0;
let is_dragging_shape = false;

//pointerdown event tracks the start of the event 
canvas.addEventListener('pointerdown', (event) => {
  current_state.is_drawing = true;
  const coords = get_coordinates(event);

  if (current_state.current_tool === 'rectangle') {
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

else if (current_state.current_tool === 'select') {
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

}
)


//pointermove event when we are actively dragging

canvas.addEventListener('pointermove', (event) => {
  if (!current_state.is_drawing) {
    return;
  }
  const current_coords = get_coordinates(event);
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
      if (selected_element.type === 'rectangle' || selected_element.type === 'square' || selected_element.type === 'image' || selected_element.type === 'triangle') {
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
  save_canvas();

  if (current_state.current_tool === 'select') {
    is_dragging_shape = false;
    save_canvas();
    return;
  }

  
})


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
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    elements.pop();
    render_canvas();
    save_canvas();
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