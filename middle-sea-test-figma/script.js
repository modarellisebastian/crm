document.querySelectorAll('.accordion__item').forEach((item) => {
  item.querySelector('.accordion__header').addEventListener('click', () => {
    const isOpen = item.classList.contains('accordion__item--open');
    document.querySelectorAll('.accordion__item').forEach((i) => i.classList.remove('accordion__item--open'));
    if (!isOpen) item.classList.add('accordion__item--open');
  });
});
