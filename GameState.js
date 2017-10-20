// Copy this file, rename to name of state and add to StateManager
function GameState() {
}

GameState.prototype.init = function() {

  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 10000); 
  this.cameraTarget = new THREE.Vector3(0, 0, -2500);
  this.camera.position.z = -2500;
  this.camera.rotation.y = Math.PI;
  this.camera.rotation.z = Math.PI;
  this.matterEngine = Matter.Engine.create();
  this.player1 = new Player(this, {
    id: 0,
    keys: {
      jump: 32,
      up: 38,
      down: 40,
      left: 37,
      right: 39,
      respawn: 16,
    },
    position: {
      x: -600,
      y: -100,
    },
    color: 0x223344,
  });
  this.player2 = new Player(this, {
    id: 1,
    keys: {
      jump: 69,
      up: 87,
      down: 83,
      left: 65,
      right: 68,
      respawn: 82,
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

  this.scores = [0, 0];

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
        flatShading: true,
      }));
  this.anchors = [];
  for(let i = 0; i < 10; i++) {
    const anchor = {
      mesh: anchorPrototype.clone()
    };
    if(i == 0) {
      anchor.mesh.position.x = this.player1.body.position.x + 50;
      anchor.mesh.position.y = this.player1.body.position.y + 200;
    } else if(i == 1) {
      anchor.mesh.position.x = this.player2.body.position.x - 50;
      anchor.mesh.position.y = this.player2.body.position.y + 200;
    } else {
      anchor.mesh.position.x = (Math.random() - 0.5) * 1600;
      anchor.mesh.position.y = (Math.random() - 0.5) * 900;
    }
    anchor.mesh.material = new THREE.MeshStandardMaterial({
      color: 0x332244,
      flatShading: true,
    });
    this.anchors.push(anchor);
    this.scene.add(anchor.mesh);
    anchor.body = Matter.Bodies.circle(
      anchor.mesh.position.x,
      anchor.mesh.position.y,
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

  this.spawnGoal();

  this.goalLight = new THREE.PointLight(0xffff00);
  this.scene.add(this.goalLight);
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
};

GameState.prototype.score = function(playerId) {
  this.scores[0]--;
  this.scores[1]--;
  this.scores[playerId]++;
  this.scores[playerId]++;
  this.scores[0] = Math.max(0, this.scores[0]);
  this.scores[1] = Math.max(0, this.scores[1]);
  this.spawnGoal();
};

GameState.prototype.spawnGoal = function() {
  for(let anchor of this.anchors) {
    anchor.goal = false;
  }
  let index = 2 + Math.random() * (this.anchors.length - 2) | 0;
  const anchor = this.anchors[index];
  anchor.goal = true;
};

GameState.prototype.render = function(renderer) {
  for(let anchor of this.anchors) {
    if(anchor.goal) {
      anchor.mesh.material.color.setRGB(0.5, 0.5, 0.1);
      this.goalLight.position.copy(anchor.mesh.position);
    } else {
      anchor.mesh.material.color.setRGB(0.1, 0.0, 0.1);
    }
  }
  this.player1.render();
  this.player2.render();
  this.hud.render();
  renderer.render(this.scene, this.camera);
};

GameState.prototype.update = function() {
  this.player1.update();
  this.player2.update();

  const cameraCenter = Matter.Vector.mult(Matter.Vector.add(this.player1.body.position, this.player2.body.position), .5);
  const size = Matter.Vector.magnitude(Matter.Vector.sub(this.player1.body.position, this.player2.body.position));
  this.cameraTarget.x = cameraCenter.x;
  this.cameraTarget.y = cameraCenter.y;
  this.cameraTarget.z = -2000 -size / 2;
  this.camera.position.x = this.camera.position.x - (this.camera.position.x - this.cameraTarget.x) / 64;
  this.camera.position.y = this.camera.position.y - (this.camera.position.y - this.cameraTarget.y) / 64;
  this.camera.position.z = this.camera.position.z - (this.camera.position.z - this.cameraTarget.z) / 128;
  //this.camera.lookAt(cameraCenter.x, cameraCenter.y, 0);

  for(let anchor of this.anchors) {
    anchor.mesh.rotation.y += 0.01;
  }
  Matter.Engine.update(this.matterEngine);
  this.hud.update();
  this.hud.plane.position.x = this.camera.position.x;
  this.hud.plane.position.y = this.camera.position.y;
  this.hud.plane.position.z = this.camera.position.z + 2500;
};
