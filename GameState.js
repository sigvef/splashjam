// Copy this file, rename to name of state and add to StateManager
function GameState() {
}

GameState.prototype.init = function() {

  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 10000); 
  this.camera.position.z = -2000;
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
    color: 'red',
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
    color: 'green',
  });
  this.scene.add(this.player1.mesh);
  this.scene.add(this.player2.mesh);
  Matter.World.add(this.matterEngine.world, this.player1.body);
  Matter.World.add(this.matterEngine.world, this.player2.body);
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
  const anchorPrototype = new THREE.Mesh(
      new THREE.SphereGeometry(20, 1, 1),
      new THREE.MeshBasicMaterial({color: 0x0000ff}));
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
    anchor.material = new THREE.MeshBasicMaterial({color: 0x0000ff});
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
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
};

GameState.prototype.render = function(renderer) {
  this.player1.render();
  this.player2.render();
  for(let anchor of this.anchors) {
    anchor.material.color.setRGB(0, 0, 255);
    if(anchor.owner == this.player1) {
      anchor.material.color.setRGB(0, 255, 255);
    }
    if(anchor.owner == this.player2) {
      anchor.material.color.setRGB(255, 0, 255);
    }
  }
  this.hud.render();
  renderer.render(this.scene, this.camera);
};

GameState.prototype.update = function() {
  this.player1.update();
  this.player2.update();
  Matter.Engine.update(this.matterEngine);
  this.hud.update();
};
