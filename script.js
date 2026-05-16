const heroBg = document.getElementById("hero-bg");
const header = document.querySelector(".site-header");
const heroImages = ["assets/background1.jpeg", "assets/background2.jpeg"];
let currentIndex = 0;

function setHeroBackground(index) {
  heroBg.style.opacity = "0";
  setTimeout(() => {
    heroBg.style.backgroundImage = `url('${heroImages[index]}')`;
    heroBg.style.opacity = "1";
  }, 200);
}

function cycleHeroImages() {
  currentIndex = (currentIndex + 1) % heroImages.length;
  setHeroBackground(currentIndex);
}

window.addEventListener("DOMContentLoaded", () => {
  setHeroBackground(currentIndex);
  setInterval(cycleHeroImages, 2000);
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    header.classList.add("scroll-active");
  } else {
    header.classList.remove("scroll-active");
  }
});
