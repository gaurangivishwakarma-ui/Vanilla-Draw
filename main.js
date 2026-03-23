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

const history = [];

const dpr= window.devicePixelRatio()