// Copy this file, rename to name of state and add to StateManager
function GameState() {
}

GameState.prototype.init = function() {

  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 100000);
  this.cameraTarget = new THREE.Vector3(0, 0, -2500);
  this.camera.position.z = -2500;
  this.camera.rotation.y = Math.PI;
  this.camera.rotation.z = Math.PI;
  this.matterEngine = Matter.Engine.create();
  this.goalParticleSystem = new ParticleSystem(this, {
    color: new THREE.Color(.2, .2, .2),
  });

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
    color: 0xf39304,
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
    color: 0x0ab9bf,
  });
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
  this.anchors = [];
  for(let i = 0; i < 10; i++) {
    const anchor = {
      mesh: new THREE.Object3D(),
    };
    anchor.mesh.rotation.x = Math.PI / 2;
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
  composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));
  const pass = new POSTPROCESSING.BloomPass();
  pass.renderToScreen = true;
  composer.addPass(pass);
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
  let nextAnchorCandidates = [];
  for (let i = 2; i < this.anchors.length; i++) {
    const anchor = this.anchors[i];
    if (!anchor.goal && this.player1.currentAnchor !== anchor && this.player2.currentAnchor !== anchor) {
      nextAnchorCandidates.push(anchor);
    }
  }
  for(let anchor of this.anchors) {
    anchor.goal = false;
    if(anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.targetStartPosition.copy(anchor.GoldenSymbolModel.position);
      anchor.GoldenSymbolModel.targetPosition.y = 0;
      anchor.GoldenSymbolModel.targetPosition.tStart = +new Date();
      anchor.GoldenSymbolModel.targetPosition.tLength = 200;
    }
  }

  let candidateIndex = Math.random() * nextAnchorCandidates.length | 0;
  const anchor = nextAnchorCandidates[candidateIndex];
  anchor.goal = true;
  if(anchor.GoldenSymbolModel) {
    anchor.GoldenSymbolModel.targetStartPosition.copy(anchor.GoldenSymbolModel.position);
    anchor.GoldenSymbolModel.targetPosition.y = -100;
    anchor.GoldenSymbolModel.targetPosition.tStart = +new Date();
    anchor.GoldenSymbolModel.targetPosition.tLength = 200;
  }
};

GameState.prototype.render = function(renderer) {
  this.goalParticleSystem.render();
  for(let anchor of this.anchors) {
    if(anchor.goal && anchor.Hexagon1Model) {
      anchor.Hexagon1Model.material.emissiveIntensityTarget = 10;
      this.goalLight.position.copy(anchor.mesh.position);
    } else if (anchor.Hexagon1Model) {
      anchor.Hexagon1Model.material.emissiveIntensityTarget = 0.4;
    }
    if(anchor.goal && anchor.Hexagon2Model) {
      anchor.Hexagon2Model.material.emissiveIntensityTarget = 10;
    } else if (anchor.Hexagon1Model) {
      anchor.Hexagon2Model.material.emissiveIntensityTarget = 0.4;
    }
    if(anchor.goal && anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.material.emissiveIntensityTarget = 1;
    } else if (anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.material.emissiveIntensityTarget = 0;
    }

    if(anchor.Hexagon1Model) {
      anchor.Hexagon1Model.material.emissiveIntensity = (
          anchor.Hexagon1Model.material.emissiveIntensity * 0.95 + anchor.Hexagon1Model.material.emissiveIntensityTarget * 0.05);
    }
    if(anchor.Hexagon2Model) {
      anchor.Hexagon2Model.material.emissiveIntensity = (
          anchor.Hexagon2Model.material.emissiveIntensity * 0.95 + anchor.Hexagon2Model.material.emissiveIntensityTarget * 0.05);
    }
    if(anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.material.emissiveIntensity = (
          anchor.GoldenSymbolModel.material.emissiveIntensity * 0.95 + anchor.GoldenSymbolModel.material.emissiveIntensityTarget * 0.05);
    }
  }

  this.player1.render();
  this.player2.render();
  this.hud.render();
  //renderer.render(this.scene, this.camera);
  composer.render(1/60);
};

GameState.prototype.update = function() {
  SoundManager.update();
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

    if(anchor.goal) {
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.sin(angle) * 20;
      const dy = Math.cos(angle) * 20;
      if(anchor.GoldenSymbolModel) {
        /* z and y are swapped since GoldenSymbolModel is rotated inside mesh */
        this.goalParticleSystem.spawn({
          x: anchor.mesh.position.x + anchor.GoldenSymbolModel.position.x + dx,
          y: anchor.mesh.position.y + anchor.GoldenSymbolModel.position.z + dy,
          z: anchor.mesh.position.z + anchor.GoldenSymbolModel.position.y
        }, {
          x: 0,
          y: 0,
          z: 10
        });
      }
    }

    if(!anchor.GoldenSymbolModel && GameState.GoldenSymbolModel) {
      const model = GameState.GoldenSymbolModel.clone();
      anchor.GoldenSymbolModel = model;
      anchor.GoldenSymbolModel.targetStartPosition = anchor.GoldenSymbolModel.position.clone();
      anchor.GoldenSymbolModel.targetPosition = anchor.GoldenSymbolModel.position.clone();
      anchor.GoldenSymbolModel.targetPosition.tStart = +new Date();
      anchor.GoldenSymbolModel.targetPosition.tLength = 1;
      anchor.GoldenSymbolModel.traverse(obj => {
        if(obj.material) {
          const color = obj.material.color;
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x222222,
            emissive: color,
            emissiveIntensity: 0,
          });
          anchor.GoldenSymbolModel.material = obj.material;
        }
      });
      anchor.mesh.add(model);
    }
    if(!anchor.Hexagon1Model && GameState.Hexagon1Model) {
      const model = GameState.Hexagon1Model.clone();
      anchor.Hexagon1Model = model;
      anchor.Hexagon1Model.traverse(obj => {
        if(obj.material) {
          const color = obj.material.color;
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: color,
            emissiveIntensity: 0,
          });
          anchor.Hexagon1Model.material = obj.material;
        }
      });
      anchor.mesh.add(model);
    }
    if(!anchor.Hexagon2Model && GameState.Hexagon2Model) {
      const model = GameState.Hexagon2Model.clone();
      anchor.Hexagon2Model = model;
      anchor.Hexagon2Model.traverse(obj => {
        if(obj.material) {
          const color = obj.material.color;
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: color,
            emissiveIntensity: 0,
          });
          anchor.Hexagon2Model.material = obj.material;
        }
      });
      anchor.mesh.add(model);
    }

    if(anchor.GoldenSymbolModel) {
      const step = (+new Date() - anchor.GoldenSymbolModel.targetPosition.tStart) / anchor.GoldenSymbolModel.targetPosition.tLength;
      anchor.GoldenSymbolModel.position.x = smoothstep(anchor.GoldenSymbolModel.targetStartPosition.x, anchor.GoldenSymbolModel.targetPosition.x, step);
      anchor.GoldenSymbolModel.position.y = smoothstep(anchor.GoldenSymbolModel.targetStartPosition.y, anchor.GoldenSymbolModel.targetPosition.y, step);
      anchor.GoldenSymbolModel.position.z = smoothstep(anchor.GoldenSymbolModel.targetStartPosition.z, anchor.GoldenSymbolModel.targetPosition.z, step);
    }

    if(anchor.Hexagon1Model) {
      anchor.Hexagon1Model.rotation.y += 0.01;
      if(anchor.goal) {
        anchor.Hexagon1Model.rotation.y += 0.02;
      }
    }
    if(anchor.Hexagon2Model) {
      anchor.Hexagon2Model.rotation.y -= 0.01;
      if(anchor.goal) {
        anchor.Hexagon2Model.rotation.y -= 0.02;
      }
    }
    if(anchor.GoldenSymbolModel) {
      //anchor.GoldenSymbolModel.rotation.y =  0.01 * Math.sin(+new Date() /300) * 30;
      anchor.GoldenSymbolModel.rotation.x =  0.2 * Math.sin(+new Date() /500);
      anchor.GoldenSymbolModel.rotation.z =  0.2 * Math.cos(+new Date() /500);
    }
  }
  this.goalParticleSystem.update();
  Matter.Engine.update(this.matterEngine);
  this.hud.update();
  this.hud.plane.position.x = this.camera.position.x;
  this.hud.plane.position.y = this.camera.position.y;
  this.hud.plane.position.z = this.camera.position.z + 2500;
};


(function() {
var manager = new THREE.LoadingManager();
const mixers = [];
const loader = new THREE.FBXLoader( manager );
loader.load( 'res/GoldenSymbol.fbx', object => {
  GameState.GoldenSymbolModel = object;
  object.scale.set(17.5, 17.5, 17.5);
}, () => {console.log('progress')}, () => {console.log('onerror')});

loader.load( 'res/Hexagon1.fbx', object => {
  GameState.Hexagon1Model = object;
  object.scale.set(17.5, 17.5, 17.5);
}, () => {console.log('progress')}, () => {console.log('onerror')});

loader.load( 'res/Hexagon2.fbx', object => {
  GameState.Hexagon2Model = object;
  object.scale.set(17.5, 17.5, 17.5);
}, () => {console.log('progress')}, () => {console.log('onerror')});
})();
