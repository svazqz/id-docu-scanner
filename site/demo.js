const position = document.querySelector('#position');
const size = document.querySelector('#size');
const feedback = document.querySelector('#feedback');
const view = document.querySelector('.camera');

function update() {
  const offset = Number(position.value);
  const width = Number(size.value);
  const centered = Math.abs(offset) <= 9;
  const ready = centered && width >= 65 && width <= 75;
  view.style.setProperty('--size', width + '%');
  view.style.setProperty('--offset', offset * view.clientWidth / 220 + 'px');
  view.classList.toggle('ready', ready);
  feedback.textContent = ready
    ? 'Ready. The sample is centered and fills the guide.'
    : !centered ? 'Move the sample toward the center.'
      : width < 65 ? 'Increase the card size.' : 'Reduce the card size.';
}

position.addEventListener('input', update);
size.addEventListener('input', update);
window.addEventListener('resize', update);
document.querySelector('#reset').addEventListener('click', () => {
  position.value = '25';
  size.value = '56';
  update();
});
update();
