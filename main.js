document.querySelectorAll('.flexbox img').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.flexbox img').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});


const tb = document.getElementById('togglebtn');

tb.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');  /*dark mode on*/

  if (document.body.classList.contains('dark-mode')) {
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
  stroke_width: 2

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

/*add drawing rectangle, diamond, circle etc logic here*/




/*looks at the elements array and renders canvas*/
function render_canvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  elements.forEach(e => {
    ctx.strokeStyle = e.color || current_state.current_color;
    ctx.lineWidth = e.stroke_width || current_state.stroke_width;

    switch (e.type) {
      case 'rectangle': 
        ctx.strokeRect(e.x, e.y, e.width, e.height);
        break;

      //function to be completed
    }
  }
  )

}

//tool selection logic

let current_element = null;
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
      stroke_width: current_state.stroke_width

    };
    elements.push(current_element);
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
  render_canvas();

})

//when we have finished drawing 

canvas.addEventListener('pointerup', (event) => {
  current_state.is_drawing = false;
  current_element = null;
})


const toolbar = document.querySelectorAll('.item');

toolbar.forEach(tool => {
    tool.addEventListener('click', () => {
        current_state.current_tool = tool.getAttribute('data-tool');
        toolbar.forEach(btn => btn.classList.remove('active'));
        tool.classList.add('active');
    });
});



resize_canvas();


window.addEventListener('resize', () => {
  resize_canvas();
  render_canvas(); 
});