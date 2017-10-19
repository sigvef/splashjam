// Copy this file, rename to name of state and add to StateManager
function GameState() {
}

GameState.prototype.init = function() {

  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 10000); 
  this.camera.position.z = -2500;
  this.camera.rotation.y = Math.PI;
  this.camera.rotation.z = Math.PI;
  this.matterEngine = Matter.Engine.create();
  this.player1 = new Player(this, {
    keys: {
      jump: 32,
      up: 38,
      down: 40,
      left: 37,
      right: 39,
    },
    position: {
      x: -600,
      y: -100,
    },
    color: 0x223344,
  });
  this.player2 = new Player(this, {
    keys: {
      jump: 69,
      up: 87,
      down: 83,
      left: 65,
      right: 68,
    },
    position: {
      x: 600,
      y: -100,
    },
    color: 0x443322,
  });
  this.scene.add(this.player1.mesh);
  this.scene.add(this.player2.mesh);
  Matter.World.add(this.matterEngine.world, this.player1.body);
  Matter.World.add(this.matterEngine.world, this.player2.body);

  /*
  let render = Matter.Render.create({
        element: document.body,
        engine: this.matterEngine,
        options: {
          showAngleIndicator: true,
          showCollisions: true,
          showVelocity: true
        }
  });
  Matter.Render.run(render);
  Matter.Render.lookAt(render, {
            min: { x: -800, y: -600 },
            max: { x: 800, y: 600 }
                });
  */
  const anchorPrototype = new THREE.Mesh(
      new THREE.SphereGeometry(20, 12, 6),
      new THREE.MeshStandardMaterial({
        color: 0x332244,
        shading: THREE.FlatShading,
      }));
  this.anchors = [];
  for(let i = 0; i < 10; i++) {
    const anchor = anchorPrototype.clone();
    if(i == 0) {
      anchor.position.x = this.player1.body.position.x + 50;
      anchor.position.y = this.player1.body.position.y + 200;
    } else if(i == 1) {
      anchor.position.x = this.player2.body.position.x - 50;
      anchor.position.y = this.player2.body.position.y + 200;
    } else {
      anchor.position.x = (Math.random() - 0.5) * 1600;
      anchor.position.y = (Math.random() - 0.5) * 900;
    }
    anchor.material = new THREE.MeshStandardMaterial({
      color: 0x332244,
      shading: THREE.FlatShading,
    });
    this.anchors.push(anchor);
    this.scene.add(anchor);
    anchor.body = Matter.Bodies.circle(
      anchor.position.x,
      anchor.position.y,
      10,
      {isStatic: true});
    anchor.owner = 'neutral';
    Matter.World.add(this.matterEngine.world, anchor.body);
  }

  this.hud = new HUD(this);
  this.directionalLight = new THREE.DirectionalLight();
  this.directionalLight.position.set(-1, -1, -2);
  this.scene.add(this.directionalLight);
  this.directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  this.directionalLight2.position.set(-0, -0, -2);
  this.scene.add(this.directionalLight2);
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
};

GameState.prototype.render = function(renderer) {
  this.player1.render();
  this.player2.render();
  this.hud.render();
  renderer.render(this.scene, this.camera);
};

GameState.prototype.update = function() {
  this.player1.update();
  this.player2.update();
  for(let anchor of this.anchors) {
    anchor.rotation.y += 0.01;
  }
  Matter.Engine.update(this.matterEngine);
  this.hud.update();
};
