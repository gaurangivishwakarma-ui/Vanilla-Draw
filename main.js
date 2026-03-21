document.querySelectorAll('.flexbox img').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.flexbox img').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});


