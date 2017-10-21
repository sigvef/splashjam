// Copy this file, rename to name of state and add to StateManager
function GameState() {
}

GameState.prototype.init = function() {

  this.introTimer = 0;
  this.winner = undefined;

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
  this.currentGoal = undefined;

  this.bgmesh = new THREE.Object3D();
  this.scene.add(this.bgmesh);
  this.bglayer0 = new THREE.Object3D();
  this.bglayer1 = new THREE.Object3D();
  this.bglayer2 = new THREE.Object3D();
  this.bglayer3 = new THREE.Object3D();
  this.bglayer4 = new THREE.Object3D();
  this.bgmesh.add(this.bglayer0);
  this.bgmesh.add(this.bglayer1);
  this.bgmesh.add(this.bglayer2);
  this.bgmesh.add(this.bglayer3);
  this.bgmesh.add(this.bglayer4);
  this.bgmesh.position.z = 1000;

  this.bglayer0.position.z = 1000;
  this.bglayer1.position.z = 800;
  this.bglayer2.position.z = 600;
  this.bglayer3.position.z = 400;
  this.bglayer4.position.z = 200;

  this.players = [
    new Player(this, {
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
        x: 600,
        y: -200,
      },
      color: 0xf39304,
    }),
    new Player(this, {
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
        x: -600,
        y: -200,
      },
      color: 0x0ab9bf,
    })
  ];
  this.player1 = this.players[0];  // deprecated variable, use players[0] instead
  this.player2 = this.players[1];  // deprecated variable, use players[1] instead
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

  this.anchorPositions = [[
    {x: 0, y: -300},
    {x: -200, y: 300},
    {x: 200, y: 300},
    {x: 500, y: -200},
    {x: -500, y: -200},
    {x: -600, y: 0},
    {x: 600, y: 0},
    {x: -300, y: -400},
    {x: 300, y: -400},
    {x: 0, y: 100},
  ], [
    {x: -300, y: 300},
    {x: -300, y: 0},
    {x: -600, y: -100},
    {x: -400, y: -300},
    {x: -200, y: -400},
    {x: 300, y: 300},
    {x: 300, y: 0},
    {x: 600, y: -100},
    {x: 400, y: -300},
    {x: 200, y: -400},
  ], [
    {x: 0, y: 300},
    {x: 0, y: 0},
    {x: 0, y: -200},
    {x: -400, y: 300},
    {x: -600, y: -200},
    {x: -300, y: -300},
    {x: 400, y: 300},
    {x: 600, y: -200},
    {x: 300, y: -300},
  ], [
    {x: 0, y: 100},
    {x: 0, y: -200},
    {x: -200, y: 300},
    {x: -600, y: -200},
    {x: -300, y: -400},
    {x: 200, y: 300},
    {x: 600, y: -200},
    {x: 300, y: -400},
  ]][Math.random() * 4 | 0];

  this.anchors = [];
  for(let i = 0; i < this.anchorPositions.length; i++) {
    const anchor = {
      mesh: new THREE.Object3D(),
    };
    anchor.mesh.rotation.x = Math.PI / 2;
    anchor.mesh.position.x = this.anchorPositions[i].x;
    anchor.mesh.position.y = this.anchorPositions[i].y;
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
  this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  this.directionalLight.position.set(-1, -1, -2);
  this.scene.add(this.directionalLight);
  this.directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  this.directionalLight2.position.set(-0, -0, -2);
  this.scene.add(this.directionalLight2);

  this.spawnGoal();

  this.goalLight = new THREE.PointLight(0xffff00);
  //this.scene.add(this.goalLight);
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
  this.introTimer = 400;
  composer.passes = [];
  composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));
  composer.addPass(new POSTPROCESSING.FilmPass({
    noiseIntensity: 0.5,
    scanlineIntensity: 0.05,
    scanlineDensity: 20,
  }));
  const pass = new POSTPROCESSING.BloomPass({
    resolutionScale: 0.5,
    intensity: 4,
    distinction: 2,
  });
  this.bloompass = pass;
  pass.renderToScreen = true;
  composer.addPass(pass);
};

GameState.prototype.score = function(playerId) {
  for(let i = 0; i < 1000; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.sin(angle);
    const dy = Math.cos(angle);
    this.goalParticleSystem.spawn({
      x: this.currentGoal.body.position.x,
      y: this.currentGoal.body.position.y,
      z: 0,
    }, {
      x: dx * 10,
      y: dy * 10,
      z: (Math.random() - 0.5) * 10,
    });
  }
  /*
  this.camera.position.x = this.players[playerId].body.position.x;
  this.camera.position.y = this.players[playerId].body.position.y;
  */
  this.camera.position.z *= 0.98; 
  this.scores[playerId]++;
  this.scores[0] = Math.max(0, this.scores[0]);
  this.scores[1] = Math.max(0, this.scores[1]);
  if (this.scores[playerId] === 5) {
    SoundManager.playSound('win');
    setTimeout(() => {
      this.winner = playerId;
    }, 1000)
    setTimeout(() => {
      sm.addState("game", new GameState());
      sm.changeState("game");
    }, 4000)
  } else {
    this.spawnGoal();
    SoundManager.playSound(`hit${this.scores[playerId]}`);
  }
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
    anchor.mesh.remove(anchor.GoldenSymbolModel);
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
  this.currentGoal = anchor;
  anchor.mesh.add(anchor.GoldenSymbolModel);
  if(anchor.GoldenSymbolModel) {
    anchor.GoldenSymbolModel.targetStartPosition.copy(anchor.GoldenSymbolModel.position);
    anchor.GoldenSymbolModel.targetPosition.y = -75;
    anchor.GoldenSymbolModel.targetPosition.tStart = +new Date();
    anchor.GoldenSymbolModel.targetPosition.tLength = 200;
  }
};

GameState.prototype.render = function(renderer) {
  this.bloompass.intensity = 2 + BEATPULSE;
  this.goalParticleSystem.render();
  for(let anchor of this.anchors) {
    if(anchor.goal && anchor.Hexagon1Model) {
      anchor.Hexagon1Model.material.emissiveIntensityTarget = 10;
      this.goalLight.position.copy(anchor.mesh.position);
    } else if (anchor.Hexagon1Model) {
      anchor.Hexagon1Model.material.emissiveIntensityTarget = 0;
    }
    if(anchor.goal && anchor.Hexagon2Model) {
      anchor.Hexagon2Model.material.emissiveIntensityTarget = 10;
    } else if (anchor.Hexagon1Model) {
      anchor.Hexagon2Model.material.emissiveIntensityTarget = 0;
    }
    if(anchor.goal && anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.material.emissiveIntensityTarget = 3;
    } else if (anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.material.emissiveIntensityTarget = 0;
    }

    if(anchor.Hexagon1Model) {
      anchor.Hexagon1Model.material.emissiveIntensity = (
          anchor.Hexagon1Model.material.emissiveIntensity * 0.95 + anchor.Hexagon1Model.material.emissiveIntensityTarget * 0.05);
      anchor.Hexagon1Model.material.color = new THREE.Color(
          lerp(anchor.Hexagon1Model.material.originalColorA.r,
               anchor.Hexagon1Model.material.originalColorB.r,
               anchor.Hexagon1Model.material.emissiveIntensity),
          lerp(anchor.Hexagon1Model.material.originalColorA.g,
               anchor.Hexagon1Model.material.originalColorB.g,
               anchor.Hexagon1Model.material.emissiveIntensity),
          lerp(anchor.Hexagon1Model.material.originalColorA.b,
               anchor.Hexagon1Model.material.originalColorB.b,
               anchor.Hexagon1Model.material.emissiveIntensity));
    }
    if(anchor.Hexagon2Model) {
      anchor.Hexagon2Model.material.emissiveIntensity = (
          anchor.Hexagon2Model.material.emissiveIntensity * 0.95 + anchor.Hexagon2Model.material.emissiveIntensityTarget * 0.05);
      anchor.Hexagon2Model.material.color = new THREE.Color(
          lerp(anchor.Hexagon2Model.material.originalColorA.r,
               anchor.Hexagon2Model.material.originalColorB.r,
               anchor.Hexagon2Model.material.emissiveIntensity),
          lerp(anchor.Hexagon2Model.material.originalColorA.g,
               anchor.Hexagon2Model.material.originalColorB.g,
               anchor.Hexagon2Model.material.emissiveIntensity),
          lerp(anchor.Hexagon2Model.material.originalColorA.b,
               anchor.Hexagon2Model.material.originalColorB.b,
               anchor.Hexagon2Model.material.emissiveIntensity));
    }
    if(anchor.GoldenSymbolModel) {
      anchor.GoldenSymbolModel.material.emissiveIntensity = (
          anchor.GoldenSymbolModel.material.emissiveIntensity * 0.95 + anchor.GoldenSymbolModel.material.emissiveIntensityTarget * 0.05);
    }
  }

  this.player1.render();
  this.player2.render();
  this.hud.render();
  if(this.introTimer < 200 && this.introTimer > 0) {
    this.player1.mesh.position.x = this.camera.position.x - 60;
    this.player1.mesh.position.y = this.camera.position.y;
    this.player1.mesh.position.z = this.camera.position.z + 400;
    this.player1.mesh.rotation.x += 0.02;
    this.player1.mesh.rotation.y += 0.01;
    this.player1.mesh.rotation.z = 1;
  }
  if(this.introTimer >= 200 && this.introTimer < 400) {
    this.player2.mesh.position.x = this.camera.position.x + 60;
    this.player2.mesh.position.y = this.camera.position.y;
    this.player2.mesh.position.z = this.camera.position.z + 400;
    this.player2.mesh.rotation.x += 0.02;
    this.player2.mesh.rotation.y += 0.01;
    this.player2.mesh.rotation.z = -1;
  }
  if(this.introTimer == 1) {
    this.player1.mesh.position.x = 0;
    this.player1.mesh.position.y = 0;
    this.player1.mesh.position.z = 0;
    this.player2.mesh.position.x = 0;
    this.player2.mesh.position.y = 0;
    this.player2.mesh.position.z = 0;
    this.player1.mesh.rotation.x = Math.PI / 2;
    this.player1.mesh.rotation.y = 0;
    this.player1.mesh.rotation.z = 0;
    this.player2.mesh.rotation.x = Math.PI / 2;
    this.player2.mesh.rotation.y = 0;
    this.player2.mesh.rotation.z = 0;
    this.camera.position.z = -1500;
  }
  if(this.winner !== undefined) {
    this.players[this.winner].mesh.position.x = this.camera.position.x + 60;
    this.players[this.winner].mesh.position.y = this.camera.position.y;
    this.players[this.winner].mesh.position.z = this.camera.position.z + 400;
    this.players[this.winner].particleSystem.particles.position.x = this.camera.position.x + 60;
    this.players[this.winner].particleSystem.particles.position.y = this.camera.position.y;
    this.players[this.winner].particleSystem.particles.position.z = this.camera.position.z + 400;
    this.players[this.winner].mesh.position.z = this.camera.position.z + 400;
    this.players[this.winner].mesh.rotation.x += 0.02;
    this.players[this.winner].mesh.rotation.y += 0.01;
    this.players[this.winner].mesh.rotation.z = -1;
  }
  composer.render(1/60);
};

GameState.prototype.update = function() {
  if(this.introTimer > 0) {
    this.introTimer--;
  };
  SoundManager.update();
  this.player1.update();
  this.player2.update();

  let goalAnchor = null;
  const bgcolor = 0x02040F;

  if(GameState.BG0 && !this.BG0) {
    const model = GameState.BG0.clone();
    this.BG0 = model;
    this.BG0.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: bgcolor,
          flatShading: false,
        });
        this.BG0.material = obj.material;
      }
    });
    this.bglayer0.add(model);
  }
  if(GameState.BG1 && !this.BG1) {
    const model = GameState.BG1.clone();
    this.BG1 = model;
    this.BG1.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: bgcolor,
          flatShading: false,
        });
        this.BG1.material = obj.material;
      }
    });
    this.bglayer1.add(model);
  }
  if(GameState.BG2 && !this.BG2) {
    const model = GameState.BG2.clone();
    this.BG2 = model;
    this.BG2.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: bgcolor,
          flatShading: false,
        });
        this.BG2.material = obj.material;
      }
    });
    this.bglayer2.add(model);
  }
  if(GameState.BG3 && !this.BG3) {
    const model = GameState.BG3.clone();
    this.BG3 = model;
    this.BG3.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: bgcolor,
          roughness: 0.8,
          metalness: 0,
          flatShading: false,
        });
        this.BG3.material = obj.material;
      }
    });
    this.bglayer3.add(model);
  }
  if(GameState.BG4 && !this.BG4) {
    const model = GameState.BG4.clone();
    this.BG4 = model;
    this.BG4.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: bgcolor,
          roughness: 0.8,
          metalness: 0,
          flatShading: false,
        });
        this.BG4.material = obj.material;
      }
    });
    this.bglayer4.add(model);
  }

  const bggcolor = bgcolor;

  if(GameState.BGG0 && !this.BGG0) {
    const model = GameState.BGG0.clone();
    this.BGG0 = model;
    this.BGG0.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: bggcolor,
          flatShading: false,
        });
        this.BGG0.material = obj.material;
      }
    });
    this.bglayer0.add(model);
  }
  if(GameState.BGG1 && !this.BGG1) {
    const model = GameState.BGG1.clone();
    this.BGG1 = model;
    this.BGG1.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: bggcolor,
          flatShading: false,
        });
        this.BGG1.material = obj.material;
      }
    });
    this.bglayer1.add(model);
  }
  if(GameState.BGG2 && !this.BGG2) {
    const model = GameState.BGG2.clone();
    this.BGG2 = model;
    this.BGG2.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: bggcolor,
          flatShading: false,
        });
        this.BGG2.material = obj.material;
      }
    });
    this.bglayer2.add(model);
  }
  if(GameState.BGG3 && !this.BGG3) {
    const model = GameState.BGG3.clone();
    this.BGG3 = model;
    this.BGG3.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: bggcolor,
          flatShading: false,
        });
        this.BGG3.material = obj.material;
      }
    });
    this.bglayer3.add(model);
  }

  const BGLcolor = bgcolor;

  if(GameState.BGL0 && !this.BGL0) {
    const model = GameState.BGL0.clone();
    this.BGL0 = model;
    this.BGL0.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: BGLcolor,
        });
        this.BGL0.material = obj.material;
      }
    });
    this.bglayer0.add(model);
  }
  if(GameState.BGL1 && !this.BGL1) {
    const model = GameState.BGL1.clone();
    this.BGL1 = model;
    this.BGL1.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: BGLcolor,
        });
        this.BGL1.material = obj.material;
      }
    });
    this.bglayer1.add(model);
  }
  if(GameState.BGL2 && !this.BGL2) {
    const model = GameState.BGL2.clone();
    this.BGL2 = model;
    this.BGL2.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: BGLcolor,
        });
        this.BGL2.material = obj.material;
      }
    });
    this.bglayer2.add(model);
  }
  if(GameState.BGL3 && !this.BGL3) {
    const model = GameState.BGL3.clone();
    this.BGL3 = model;
    this.BGL3.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: BGLcolor,
        });
        this.BGL3.material = obj.material;
      }
    });
    this.bglayer3.add(model);
  }
  if(GameState.BGL4 && !this.BGL4) {
    const model = GameState.BGL4.clone();
    this.BGL4 = model;
    this.BGL4.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: BGLcolor,
        });
        this.BGL4.material = obj.material;
      }
    });
    this.bglayer4.add(model);
  }


  this.bglayer0.rotation.z += 0.01 * BEATPULSE * BEATPULSE + 0.002;
  this.bglayer1.rotation.z -= 0.01 * BEATPULSE * BEATPULSE + 0.002;
  this.bglayer2.rotation.z += 0.01 * BEATPULSE * BEATPULSE + 0.002;
  this.bglayer3.rotation.z -= 0.01 * BEATPULSE * BEATPULSE + 0.002;
  this.bglayer4.rotation.z += 0.01 * BEATPULSE * BEATPULSE + 0.002;

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
      goalAnchor = anchor;
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
          obj.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
          });
          obj.material.emissiveIntensityTarget = 0;
          obj.material.emissiveIntensity = 0;
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
          obj.material = new THREE.MeshBasicMaterial({
            color: color,
          });
          obj.material.originalColorA = new THREE.Color(0x888888);
          obj.material.originalColorB = new THREE.Color(0xA02DD2);
          obj.material.emissiveIntensityTarget = 0;
          obj.material.emissiveIntensity = 0;
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
          obj.material = new THREE.MeshBasicMaterial({
            color: color,
          });
          obj.material.originalColorA = new THREE.Color(0x888888);
          obj.material.originalColorB = new THREE.Color(0xff44ff);
          obj.material.emissiveIntensityTarget = 0;
          obj.material.emissiveIntensity = 0;
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
      //anchor.Hexagon1Model.rotation.y += 0.01;
      if(anchor.goal) {
        anchor.Hexagon1Model.rotation.y += 0.02;
      }
    }
    if(anchor.Hexagon2Model) {
      anchor.Hexagon2Model.scale.set(0.0001, 0.0001, 0.0001);
      if(anchor.goal) {
        anchor.Hexagon2Model.rotation.y -= 0.02;
      anchor.Hexagon2Model.scale.set(17.5, 17.5, 17.5);
      }
    }
    if(anchor.GoldenSymbolModel) {
      if(anchor.goal) {
        anchor.GoldenSymbolModel.rotation.y =  0.2 * PULSE;
      }
      anchor.GoldenSymbolModel.rotation.x =  0.2 * Math.sin(+new Date() /500);
      anchor.GoldenSymbolModel.rotation.z =  0.2 * Math.cos(+new Date() /500);
    }
  }

  // Calculate camera position
  let positions = [this.player1.body.position, this.player2.body.position];
  if (goalAnchor) {
    positions.push(goalAnchor.body.position);
  }
  let cameraCenterVector = positions[0];
  for (let i = 1; i < positions.length; i++) {
    cameraCenterVector = Matter.Vector.add(cameraCenterVector, positions[i]);
  }
  const cameraCenter = Matter.Vector.mult(cameraCenterVector, 1 / positions.length);
  const size = Matter.Vector.magnitude(
    Matter.Vector.sub(this.player1.body.position, this.player2.body.position)
  );
  this.cameraTarget.x = cameraCenter.x;
  this.cameraTarget.y = cameraCenter.y;
  this.cameraTarget.z = -2000 -size / 2;
  this.camera.position.x = this.camera.position.x - (this.camera.position.x - this.cameraTarget.x) / 64;
  this.camera.position.y = this.camera.position.y - (this.camera.position.y - this.cameraTarget.y) / 64;
  this.camera.position.z = this.camera.position.z - (this.camera.position.z - this.cameraTarget.z) / 128;
  //this.camera.lookAt(cameraCenter.x, cameraCenter.y, 0);

  this.goalParticleSystem.update();
  Matter.Engine.update(this.matterEngine);
  this.hud.update();
  this.hud.plane.position.x = this.camera.position.x;
  this.hud.plane.position.y = this.camera.position.y;
  this.hud.plane.position.z = this.camera.position.z + 2000;
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


const bgscale = 200;
loader.load( 'res/background_0.fbx', object => {
  GameState.BG0 = object;
  object.scale.set(bgscale, bgscale, bgscale);
  object.rotation.x = -Math.PI / 2;
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/background_1.fbx', object => {
  GameState.BG1 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/background_2.fbx', object => {
  GameState.BG2 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/background_3.fbx', object => {
  GameState.BG3 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/background_4.fbx', object => {
  GameState.BG4 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});

loader.load( 'res/globes_0.fbx', object => {
  GameState.BGG0 = object;
  object.scale.set(bgscale, bgscale, bgscale);
  object.rotation.x = -Math.PI / 2;
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/globes_1.fbx', object => {
  GameState.BGG1 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/globes_2.fbx', object => {
  GameState.BGG2 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/globes_3.fbx', object => {
  GameState.BGG3 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});

loader.load( 'res/light_0.fbx', object => {
  GameState.BGL0 = object;
  object.scale.set(bgscale, bgscale, bgscale);
  object.rotation.x = -Math.PI / 2;
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/light_1.fbx', object => {
  GameState.BGL1 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/light_2.fbx', object => {
  GameState.BGL2 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/light_3.fbx', object => {
  GameState.BGL3 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
loader.load( 'res/light_4.fbx', object => {
  GameState.BGL4 = object;
  object.rotation.x = -Math.PI / 2;
  object.scale.set(bgscale, bgscale, bgscale);
}, () => {console.log('progress')}, () => {console.log('onerror')});
})();
