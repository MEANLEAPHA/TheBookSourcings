
  window.addEventListener('load', init, false);

  function init() {
    // Wait until font is loaded before creating world
    document.fonts.load("100px 'Pirata One'").then(() => {
      createWorld();
      createLights();
      createPrimitive();
      animation();
    });
  }

  var Theme = {
    primary: 0xd7dddd,
    secundary: 0x0000FF,
    danger: 0xFF0000,
    darker: 0x101010
  };

  var scene, camera, renderer, controls;
  var _group = new THREE.Group();

  function createWorld() {
    const _width = window.innerWidth;
    const _height = document.getElementById('canvas-container').clientHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(Theme.primary, 9, 13);
    scene.background = null;

    camera = new THREE.PerspectiveCamera(35, _width / _height, 1, 1000);
    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(_width, _height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.update();

    document.getElementById('canvas-container').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
  }

  function onWindowResize() {
    const _width = window.innerWidth;
    const _height = window.innerHeight;
    renderer.setSize(_width, _height);
    camera.aspect = _width / _height;
    camera.updateProjectionMatrix();
  }

  function createLights() {
    const hemiLight = new THREE.HemisphereLight(Theme.primary, Theme.darker, 1);
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    dirLight.position.set(10, 20, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 5000;
    dirLight.shadow.mapSize.height = 5000;
    dirLight.penumbra = 0.8;
    

    scene.add(hemiLight);
    scene.add(dirLight);
  }

  // Create texture with "TBS" in Celendine
// Create texture with "TBS" in Celendine (landscape orientation)
function createTextTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#275791";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // dimensions for the centered rectangle
  const rectWidth = 420;
  const rectHeight = 220;
  const rectX = (canvas.width - rectWidth) / 2;
  const rectY = (canvas.height - rectHeight) / 2;

  // border-only rectangle (centered)
  ctx.strokeStyle = "#4c4c4cff";
  ctx.lineWidth = 4;
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

  // rotate and center text inside the rectangle
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2); // move origin to center
  ctx.rotate(-Math.PI / 2); // rotate counter-clockwise 90°
  ctx.fillStyle = "#FFFFFF";
   ctx.font = "140px 'Pirata One'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TBS", 0, 0); // centered at origin
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.MeshPhongMaterial({ map: texture });
}




  function CreateBook() {
    this.mesh = new THREE.Object3D();

    const geo_cover = new THREE.BoxGeometry(2.4, 3, 0.05);
    const lmo_cover = new THREE.BoxGeometry(0.05, 3, 0.59);
    const ppr_cover = new THREE.BoxGeometry(2.3, 2.8, 0.5);

    const mat_cover = createTextTexture();
    const mat_lomo = new THREE.MeshPhongMaterial({ color: 0x275791 });
    const mat_paper = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

    const _cover1 = new THREE.Mesh(geo_cover, mat_cover);
    const _cover2 = new THREE.Mesh(geo_cover, mat_cover);
    const _lomo = new THREE.Mesh(lmo_cover, mat_lomo);
    const _paper = new THREE.Mesh(ppr_cover, mat_paper);

    [_cover1, _cover2, _lomo, _paper].forEach(mesh => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    _cover1.position.z = 0.3;
    _cover2.position.z = -0.3;
    _lomo.position.x = 2.4 / 2;

    this.mesh.add(_cover1, _cover2, _lomo, _paper);
  }

  function isTooClose(newObj, others, minDistance = 1.5) {
    const newPos = newObj.position;
    for (let existing of others) {
      const dx = newPos.x - existing.position.x;
      const dy = newPos.y - existing.position.y;
      const dz = newPos.z - existing.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDistance) return true;
    }
    return false;
  }

  function createPrimitive() {
    const placedBooks = [];
    const a = 2;

    for (let i = 0; i < 12; i++) {
      const _object = new CreateBook();
      const s = 0.1 + Math.random() * 0.4;
      _object.mesh.scale.set(s, s, s);

      let tries = 0;
      do {
        _object.mesh.position.x = (Math.random() - 0.5) * a * 2;
        _object.mesh.position.y = (Math.random() - 0.5) * a * 2;
        _object.mesh.position.z = (Math.random() - 0.5) * a * 2;
        tries++;
      } while (isTooClose(_object.mesh, placedBooks) && tries < 20);

      _object.mesh.rotation.x = Math.random() * 2 * Math.PI;
      _object.mesh.rotation.y = Math.random() * 2 * Math.PI;
      _object.mesh.rotation.z = Math.random() * 2 * Math.PI;

      TweenMax.to(_object.mesh.rotation, 8 + Math.random() * 8, {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5,
        yoyo: true,
        repeat: -1,
        ease: Sine.easeInOut,
        delay: 0.05 * i
      });

      _group.add(_object.mesh);
      placedBooks.push(_object.mesh);
    }

    scene.add(_group);
    _group.position.x = 2;
  }

  function animation() {
    _group.rotation.x -= 0.003;
    _group.rotation.y -= 0.003;
    _group.rotation.z -= 0.003;
    controls.update();
    requestAnimationFrame(animation);
    renderer.render(scene, camera);
  }
