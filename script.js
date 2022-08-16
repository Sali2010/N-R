var canvas = document.querySelector("#scene"),
ctx = canvas.getContext("2d"),
particles = [],
amount = 0,
mouse = { x: 0, y: 0 },
radius = 1;

var ppi = 10;

var colors = ["#F8F9D3", "#FEFFB4", "#FCFF71", "#FBFF2E", "#F4F900"];
var ww = canvas.width = window.innerWidth;
var wh = canvas.height = window.innerHeight;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject({ path, status: 'error' });
    img.src = path;
  });
}

class Particle {
  constructor(options) {
    Object.assign(this, options);
    this.accX = 0;
    this.accY = 0;
    this.friction = Math.random() * 0.05 + 0.94;
    this.friction = 0.9;
    this.color = colors[Math.floor(Math.random() * 5)];
    // this.color = '#ffffff';
    this.dest = { x: ww / 2, y: wh / 2 };
    this.visible = true;
    this.r = Math.random() * 3 + 1;
  }

  randomVelocity() {
    this.vx = (Math.random() - 0.5) * 20;
    this.vy = (Math.random() - 0.5) * 20;
    return this;
  }

  static getDistance(a, b) {
    return Math.sqrt(a * a + b * b);
  }

  getDistanceTo(target) {
    var a = this.x - target.x;
    var b = this.y - target.y;
    return Math.sqrt(a * a + b * b);
  }

  update() {
    this.accX = (this.dest.x - this.x) / 1000;
    this.accY = (this.dest.y - this.y) / 1000;
    this.vx += this.accX;
    this.vy += this.accY;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    return this;
  }

  render() {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, Math.PI * 2, false);
    if (!this.visible) {
      ctx.globalAlpha = 0;
    }
    ctx.fill();
    ctx.restore();
  }}


async function svgImageData(svg) {
  var src = "data:image/svg+xml," + encodeURIComponent(svg.outerHTML);
  var img = await createImage(src);
  ctx.drawImage(img, ww / 2 - img.width / 2, wh / 2 - img.height / 2, img.width, img.height);
  var data = ctx.getImageData(0, 0, ww, wh).data;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var destinations = [];
  for (var i = 0; i < ww; i += ppi) {
    for (var j = 0; j < wh; j += ppi) {
      if (data[(i + j * ww) * 4 + 3] > 150) {
        var p = { x: i, y: j };
        destinations.push(p);
      }
    }
  }

  return shuffle(destinations);
}

function gatherData() {
  return new Promise(async (resolve, reject) => {
    var data = {};
    var svgs = document.querySelectorAll('#svgs svg');
    for (elm of svgs) {
      var name = elm.getAttribute('name');
      var svgData = await svgImageData(elm);
      data[name] = {
        data: svgData,
        length: svgData.length };

    }
    resolve(data);
  });
}

function generateParticles(data) {
  var particleCount = 0;
  for (var i in data) {
    particleCount = data[i].length > particleCount ? data[i].length : particleCount;
  }
  var particles = [];
  for (var i = 0; i < particleCount; i++) {
    var p = new Particle({
      x: ww / 2,
      y: wh / 2 });

    p.randomVelocity();
    particles.push(p);
  }
  return particles;
}


function initScene() {
  return new Promise(async resolve => {
    ww = canvas.width = window.innerWidth;
    wh = canvas.height = window.innerHeight;
    var data = await gatherData();
    particles = generateParticles(data);
    resolve(data);
  });
}

function updateParticles(data) {
  var pLen = particles.length;
  var dLen = data.length;

  for (var i in particles) {
    particles[i].visible = false;
    particles[i].dest = { x: ww / 2, y: wh / 2 };
    if (data.data.hasOwnProperty(i)) {
      particles[i].dest = data.data[i];
      particles[i].visible = true;
    }
  }
}


function render(a) {
  requestAnimationFrame(render);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i in particles) {
    particles[i].update().render();
  }
}

window.addEventListener("resize", initScene);
initScene().
then(render()).
then(data => {

  var length = Object.keys(data).length - 1;
  var index = 0;
  updateParticles(data[Object.keys(data)[index]]);

  setInterval(() => {
    if (index < length) {
      index++;
    } else
    {
      index = 0;
    }
    updateParticles(data[Object.keys(data)[index]]);
  }, 10000);
});