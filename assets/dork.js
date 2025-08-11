// dork.js
// Custom JavaScript functions for Dorklord site

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Locomotive Scroll for smooth scrolling
  const scroll = new LocomotiveScroll({
    el: document.querySelector("[data-scroll-container]"),
    smooth: false,
  });

  // Appliquer la transformation initiale après que la fenêtre soit complètement chargée
  window.addEventListener("load", () => {
    // Initialiser les éléments de scroll ici
    initializeTypingEffect();
  });

  function initializeTypingEffect() {
    // Handle text writing effect with Intersection Observer
    const typingElements = document.querySelectorAll("[data-typing]");
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const typingObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          applyTypingEffect(element);
          observer.unobserve(element); // Stop observing once the effect is applied
        }
      });
    }, observerOptions);

    typingElements.forEach((element) => {
      typingObserver.observe(element);
    });
  }

  // Add transformations based on data attributes (optimized version)
  scroll.on("scroll", (args) => {
    const elements = document.querySelectorAll("[data-transform-type]");
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Apply transformation progressively if element is visible
      if (rect.top < windowHeight && rect.bottom > 0) {
        applyScrollDrivenTransformation(element, rect, windowHeight);
      }
    });
  });

  function applyScrollDrivenTransformation(element, rect, windowHeight) {
    const transformationType = element.getAttribute("data-transform-type");
    const transformationValue = parseFloat(
      element.getAttribute("data-transform-value")
    );

    if (transformationType && !isNaN(transformationValue)) {
      // Set initial scale to prevent abrupt scaling when scrolling starts
      if (!element.dataset.initialized) {
        element.style.transform = "scale(1)";
        element.dataset.initialized = true;
      }

      // Calculate progress based on element's position within the viewport
      const progress = Math.min(
        Math.max(
          (windowHeight - rect.top) / (windowHeight * 0.6 + rect.height),
          0
        ),
        1
      );
      const currentScale = 1 + (transformationValue - 1) * progress;

      // Apply transformation
      if (transformationType === "scale") {
        element.style.transform = `scale(${currentScale})`;
      }
    }
  }

  function applyTypingEffect(element) {
    const fullText = element.getAttribute("data-typing");
    const typingSpeedMin = 30; // Vitesse minimale de dactylographie
    const typingSpeedMax = 100; // Vitesse maximale de dactylographie

    let index = 0;
    let htmlBuffer = "";
    let inTag = false;

    function typeNextChar() {
      if (index < fullText.length) {
        const currentChar = fullText.charAt(index);
        htmlBuffer += currentChar;

        if (currentChar === "<") {
          inTag = true;
        } else if (currentChar === ">") {
          inTag = false;
        }

        if (!inTag) {
          element.innerHTML = htmlBuffer + '<span class="cursor">_</span>';
        } else {
          element.innerHTML = htmlBuffer; // Évitez d'ajouter le curseur à l'intérieur des balises HTML
        }

        index++;

        let typingSpeed =
          Math.floor(Math.random() * (typingSpeedMax - typingSpeedMin + 1)) +
          typingSpeedMin;

        // Si on est à l'intérieur d'une balise, saute rapidement au prochain caractère
        if (inTag) {
          typingSpeed = 0;
        }

        requestAnimationFrame(() => {
          setTimeout(typeNextChar, typingSpeed);
        });
      } else {
        element.innerHTML = htmlBuffer + '<span class="cursor">_</span>'; // Terminez avec le curseur
      }
    }

    // Commence à taper
    requestAnimationFrame(typeNextChar);
  }

  // Add cursor blinking effect
  const style = document.createElement("style");
  style.innerHTML = `
        .cursor {
            animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
            0%, 50% {
                opacity: 1;
            }
            50.01%, 100% {
                opacity: 0;
            }
        }
    `;
  document.head.appendChild(style);
});
