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
