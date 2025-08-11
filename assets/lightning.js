/**
 * requestAnimationFrame Polyfill (pour un FPS configurable)
 */
var FPS = 11; // Propriété pour définir le FPS

window.requestAnimationFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / FPS); // Utilisation de la valeur de FPS
    }
  );
})();

/**
 * Classe Vector
 */
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.add = function (a, b) {
  return new Vector(a.x + b.x, a.y + b.y);
};

Vector.sub = function (a, b) {
  return new Vector(a.x - b.x, a.y - b.y);
};

Vector.prototype = {
  set: function (x, y) {
    if (typeof x === "object") {
      y = x.y;
      x = x.x;
    }
    this.x = x || 0;
    this.y = y || 0;
    return this;
  },

  add: function (v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  },

  sub: function (v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  },

  scale: function (s) {
    this.x *= s;
    this.y *= s;
    return this;
  },

  length: function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  },

  normalize: function () {
    var len = Math.sqrt(this.x * this.x + this.y * this.y);
    if (len) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  },

  angle: function () {
    return Math.atan2(this.y, this.x);
  },

  distanceTo: function (v) {
    var dx = v.x - this.x,
      dy = v.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distanceToSq: function (v) {
    var dx = v.x - this.x,
      dy = v.y - this.y;
    return dx * dx + dy * dy;
  },

  clone: function () {
    return new Vector(this.x, this.y);
  },
};

/**
 * Classe Lightning
 */
function Lightning(startPoint, endPoint, options) {
  options = options || {}; // Assurer que options est un objet

  this.startPoint = startPoint || new Vector();
  this.endPoint = endPoint || new Vector();
  this.step = options.step || 20;

  // Propriétés personnalisées
  this.color = options.color || "rgba(255, 255, 255, 1)";
  this.speed = options.speed || 0.025;
  this.amplitude = options.amplitude || 1;
  this.lineWidth = this.getResponsiveValue(options.lineWidth || 5);
  this.blur = this.getResponsiveValue(options.blur || 50);
  this.blurColor = options.blurColor || "rgba(255, 255, 255, 0.5)";

  this.children = [];
}

Lightning.prototype = {
  points: null,
  off: 0,
  _simplexNoise: new SimplexNoise(),
  parent: null,
  startStep: 0,
  endStep: 0,

  length: function () {
    return this.startPoint.distanceTo(this.endPoint);
  },

  getChildNum: function () {
    return this.children.length;
  },

  setChildNum: function (num) {
    var children = this.children,
      child,
      i,
      len;

    len = this.children.length;

    if (len > num) {
      for (i = num; i < len; i++) {
        children[i].dispose();
      }
      children.splice(num, len - num);
    } else {
      for (i = len; i < num; i++) {
        // Passer les options appropriées lors de la création de l'enfant
        child = new Lightning(null, null, {
          step: this.step,
          color: this.color,
          speed: this.speed * 1.35,
          amplitude: this.amplitude,
          lineWidth: this.getResponsiveValue(this.lineWidth * 0.75),
          blur: this.getResponsiveValue(this.blur),
        });
        child._setAsChild(this);
        children.push(child);
      }
    }
  },

  update: function () {
    var startPoint = this.startPoint,
      endPoint = this.endPoint,
      length,
      normal,
      radian,
      sinv,
      cosv,
      points,
      off,
      waveWidth,
      n,
      av,
      ax,
      ay,
      bv,
      bx,
      by,
      m,
      x,
      y,
      children,
      child,
      i,
      len;

    if (this.parent) {
      if (typeof this.parent.step === "undefined") {
        this.parent.step = 45;
      }

      if (this.endStep > this.parent.step) {
        this._updateStepsByParent();
      }

      startPoint.set(this.parent.points[this.startStep]);
      endPoint.set(this.parent.points[this.endStep]);
    }

    length = this.length();
    normal = Vector.sub(endPoint, startPoint)
      .normalize()
      .scale(length / this.step);
    radian = normal.angle();
    sinv = Math.sin(radian);
    cosv = Math.cos(radian);

    points = this.points = [];
    off = this.off += random(this.speed, this.speed * 0.2);
    waveWidth = (this.parent ? length * 1.5 : length) * this.amplitude;
    if (waveWidth > 750) waveWidth = 750;

    for (i = 0, len = this.step + 1; i < len; i++) {
      n = i / 60;
      av = waveWidth * this._noise(n - off, 0) * 0.5;
      ax = sinv * av;
      ay = cosv * av;

      bv = waveWidth * this._noise(n + off, 0) * 0.5;
      bx = sinv * bv;
      by = cosv * bv;

      m = Math.sin(Math.PI * (i / (len - 1)));

      x = startPoint.x + normal.x * i + (ax - bx) * m;
      y = startPoint.y + normal.y * i - (ay - by) * m;

      points.push(new Vector(x, y));
    }

    children = this.children;

    for (i = 0, len = children.length; i < len; i++) {
      child = children[i];
      child.color = this.color;
      child.speed = this.speed * 1.35;
      child.amplitude = this.amplitude;
      child.lineWidth = this.getResponsiveValue(this.lineWidth * 0.75);
      child.blur = this.getResponsiveValue(this.blur);
      child.blurColor = this.blurColor;
      children[i].update();
    }
  },

  draw: function (ctx) {
    var points = this.points,
      children = this.children,
      i,
      len,
      p,
      d;

    if (this.blur) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.shadowBlur = this.blur;
      ctx.shadowColor = this.blurColor;
      ctx.beginPath();
      for (i = 0, len = points.length; i < len; i++) {
        p = points[i];
        d = len > 1 ? p.distanceTo(points[i === len - 1 ? i - 1 : i + 1]) : 0;
        ctx.moveTo(p.x + d, p.y);
        ctx.arc(p.x, p.y, d, 0, Math.PI * 2, false);
      }
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.lineWidth = random(this.lineWidth, 0.5);
    var gradient = ctx.createLinearGradient(
      points[0].x,
      points[0].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    for (i = 0, len = points.length; i < len; i++) {
      p = points[i];
      ctx[i === 0 ? "moveTo" : "lineTo"](p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();

    for (i = 0, len = this.children.length; i < len; i++) {
      children[i].draw(ctx);
    }
  },

  dispose: function () {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    this._simplexNoise = null;
  },

  _noise: function (v) {
    var octaves = 6,
      fallout = 0.5,
      amp = 1,
      f = 1,
      sum = 0,
      i;

    for (i = 0; i < octaves; ++i) {
      amp *= fallout;
      sum += amp * (this._simplexNoise.noise2D(v * f, 0) + 1) * 0.5;
      f *= 2;
    }

    return sum;
  },

  _setAsChild: function (lightning) {
    if (!(lightning instanceof Lightning)) return;
    this.parent = lightning;

    var self = this,
      setTimer = function () {
        self._updateStepsByParent();
        self._timeoutId = setTimeout(setTimer, randint(1500));
      };

    self._timeoutId = setTimeout(setTimer, randint(1500));
  },

  _updateStepsByParent: function () {
    if (!this.parent) return;
    var parentStep = this.parent.step;
    if (typeof parentStep === "undefined") {
      parentStep = 45;
    }
    this.startStep = randint(Math.max(parentStep - 2, 1));
    this.endStep =
      this.startStep +
      randint(Math.max(parentStep - this.startStep - 2, 1)) +
      2;
    this.step = this.endStep - this.startStep;
  },

  getResponsiveValue: function (value) {
    // Calculer la proportion en fonction d'une référence de 1600px
    var referenceWidth = 1600;
    var currentWidth = Math.min(window.innerWidth, referenceWidth); // Ne pas dépasser 1600px
    return value * (currentWidth / referenceWidth);
  },
};

/**
 * Classe Rect
 */
function Rect(x, y, width, height) {
  this.x = x || 0;
  this.y = y || 0;
  this.width = width || 0;
  this.height = height || 0;
  this.right = this.x + this.width;
  this.bottom = this.y + this.height;
}

// Fonctions utilitaires

function random(max, min) {
  if (typeof max !== "number") {
    return Math.random();
  } else if (typeof min !== "number") {
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

function randint(max, min) {
  if (!max) return 0;
  return random(max + 1, min) | 0;
}

/**
 * Fonction pour initialiser l'effet de foudre sur un canvas spécifique
 */
function LightningEffect(canvasId, config) {
  // Variables
  var canvas = document.getElementById(canvasId),
    context,
    bounds,
    lightnings = [],
    startPoints = [],
    endPoints = [],
    canvasWidth,
    canvasHeight,
    isAnimating = false,
    animationFrameId = null;

  // Gestionnaires d'événements
  function resize() {
    var computedStyle = getComputedStyle(canvas);
    canvasWidth = parseFloat(computedStyle.width);
    canvasHeight = parseFloat(computedStyle.height);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context = canvas.getContext("2d");

    updateLightningPositions();
  }

  function updateLightningPositions() {
    startPoints.length = 0;
    endPoints.length = 0;
    lightnings.length = 0;

    for (var i = 0; i < config.lightning.count; i++) {
      var startRel =
        config.lightning.startPoints[i % config.lightning.startPoints.length];
      var endRel =
        config.lightning.endPoints[i % config.lightning.endPoints.length];

      var startX = startRel.x * canvasWidth;
      var startY = startRel.y * canvasHeight;
      var endX = endRel.x * canvasWidth;
      var endY = endRel.y * canvasHeight;

      startPoints.push(new Vector(startX, startY));
      endPoints.push(new Vector(endX, endY));

      var lightning = new Lightning(
        new Vector(startX, startY),
        new Vector(endX, endY),
        { step: 45 }
      );

      lightning.amplitude = config.lightning.amplitude;
      lightning.speed = config.lightning.speed;
      lightning.lineWidth = lightning.getResponsiveValue(
        config.lightning.thickness
      );
      lightning.blur = lightning.getResponsiveValue(config.lightning.blur);
      lightning.color = "rgb(" + config.lightning.color.join(",") + ")";
      lightning.blurColor =
        "rgba(" + config.lightning.color.join(",") + ", 0.5)";
      lightning.setChildNum(3);

      lightnings.push(lightning);
    }
  }

  function startAnimation() {
    if (!isAnimating) {
      isAnimating = true;
      loop();
    }
  }

  function stopAnimation() {
    isAnimating = false;
  }

  var lastFrameTime = 0;

  function loop(timestamp) {
    if (!isAnimating) {
      return;
    }

    if (!lastFrameTime || timestamp - lastFrameTime >= 1000 / FPS) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      lightnings.forEach(function (lightning) {
        lightning.step = Math.ceil(lightning.length() / 10);
        if (lightning.step < 5) lightning.step = 5;

        lightning.update();
        lightning.draw(context);
      });

      lastFrameTime = timestamp;
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize, false);
  resize();

  var observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0,
  };

  var observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        startAnimation();
      } else {
        stopAnimation();
      }
    });
  }, observerOptions);

  observer.observe(canvas);
}
