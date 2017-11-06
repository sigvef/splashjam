// Copy this file, rename to name of state and add to StateManager
function GameState() {
}

CONTROLS = [
  {
    name: 'IJKL + O [keyboard]',
    active: false,
    keyboard: {
      jump: 79,
      up: 73,
      down: 75,
      left: 74,
      right: 76,
    },
    joycon: {},
  }, {
    name: 'TFGH + Y [keyboard]',
    active: false,
    keyboard: {
      jump: 89,
      up: 84,
      down: 71,
      left: 70,
      right: 72,
    },
    joycon: {},
  }, {
    name: 'WASD + E [keyboard]',
    active: false,
    keyboard: {
      jump: 69,
      up: 87,
      down: 83,
      left: 65,
      right: 68,
    },
    joycon: {},
  }, {
    name: 'Left Nintendo Joy-Con controller',
    active: false,
    keyboard: {},
    joycon: {
      id: 'left',
      up: -1,
      upright: -0.7142857313156128,
      right: -0.4285714030265808,
      downright: -0.1428571343421936,
      down: 0.14285719394683838,
      downleft: 0.4285714626312256,
      left: 0.7142857313156128,
      upleft: 1,
      jump: 1,
      boost: 0,
    },
  }, {
    name: 'Arrow keys + Space [keyboard]',
    active: false,
    keyboard: {
      jump: 32,
      up: 38,
      down: 40,
      left: 37,
      right: 39,
    },
    joycon: {},
  }, {
    name: 'Xbox 360 S Gamepad',
    active: false,
    keyboard: {},
    gamepad: {
      jump: 1,
      jump2: 5,
      leftright: 2,
      updown: 3,
    },
    joycon: {},
  }, {
    name: 'Right Nintendo Joy-Con controller',
    active: false,
    keyboard: {},
    joycon: {
      id: 'right',
      up: -1,
      upright: -0.7142857313156128,
      right: -0.4285714030265808,
      downright: -0.1428571343421936,
      down: 0.14285719394683838,
      downleft: 0.4285714626312256,
      left: 0.7142857313156128,
      upleft: 1,
      jump: 1,
      boost: 0,
    },
  },
  {
    name: 'AI',
    active: false,
    keyboard: {
      activate: 88
    },
    joycon: {},
    ai: true
  }
];

GameState.prototype.init = function() {

  this.introTimer = 0;
  this.winner = undefined;
  this.startTime = +new Date();

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
  //this.scene.add(this.bgmesh);
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

  this.gameMode = null;  // is set by resume()

  this.players = [
    new Player(this, {
      id: 0,
      position: {
        x: -600,
        y: -200,
      },
      color: 0xf39304,
    }),
    new Player(this, {
      id: 1,
      position: {
        x: 600,
        y: -200,
      },
      color: 0x0ab9bf,
    }),
    new Player(this, {
      id: 2,
      position: {
        x: 0,
        y: 50,
      },
      color: 0xff1020,
    }),
    new Player(this, {
      id: 3,
      position: {
        x: 0,
        y: -400,
      },
      color: 0x20ff40,
    })
  ];

  this.scores = [];
  for(let player of this.players) {
    player.deactivate();
    this.scores.push(0);
  }

  this.hud = new HUD(this);
  this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  this.directionalLight.position.set(-1, -1, -2);
  this.scene.add(this.directionalLight);
  this.directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  this.directionalLight2.position.set(-0, -0, -2);
  this.scene.add(this.directionalLight2);

  this.anchors = [];
  this.setupAnchors();
  this.spawnGoal();

  this.goalLight = new THREE.PointLight(0xffff00);
  //this.scene.add(this.goalLight);
};

GameState.prototype.pause = function() {
};

GameState.prototype.setupAnchors = function() {
  this.anchorPositions = [[
    {x: -600, y: 0},
    {x: 600, y: 0},
    {x: 0, y: -300},
    {x: -200, y: 300},
    {x: 200, y: 300},
    {x: 500, y: -200},
    {x: -500, y: -200},
    {x: -300, y: -400},
    {x: 300, y: -400},
    {x: 0, y: 100},
  ], [
    {x: -600, y: -100},
    {x: 600, y: -100},
    {x: -300, y: 300},
    {x: -300, y: 0},
    {x: -400, y: -300},
    {x: -200, y: -400},
    {x: 300, y: 300},
    {x: 300, y: 0},
    {x: 400, y: -300},
    {x: 200, y: -400},
  ], [
    {x: -600, y: -200},
    {x: 600, y: -200},
    {x: 0, y: 300},
    {x: 0, y: 0},
    {x: 0, y: -200},
    {x: -400, y: 300},
    {x: -300, y: -300},
    {x: 400, y: 300},
    {x: 300, y: -300},
  ], [
    {x: -600, y: -200},
    {x: 600, y: -200},
    {x: 0, y: 100},
    {x: 0, y: -200},
    {x: -200, y: 300},
    {x: -300, y: -400},
    {x: 200, y: 300},
    {x: 300, y: -400},
  ]][Math.random() * 4 | 0];

  for(let anchor of this.anchors) {
    Matter.World.remove(this.matterEngine.world, anchor.body);
    this.scene.remove(anchor.mesh);
  }

  this.anchors = [];
  for(let i = 0; i < this.anchorPositions.length; i++) {
    const anchor = new Anchor(this, this.anchorPositions[i]);
    this.anchors.push(anchor);
  }
};

GameState.prototype.reset = function() {
  gtag('event', 'reset');
  this.setupAnchors();
  this.startTime = +new Date();
  this.introTimer = 4;
  this.winner = undefined;
  for(let i in this.scores) {
    this.scores[i] = 0;
  }
  for(let player of this.players) {
    player.reset(); 
    player.respawn(false);
  }
  this.spawnGoal();
};

GameState.prototype.resume = function(gameMode) {
  /**
   * gameMode: '1-player' or 'multiplayer'
   */

  this.gameMode = gameMode;
  if (this.gameMode === '1-player') {
    if (localStorage && !localStorage.getItem('hasVisited1PlayerBefore')) {
      alert(
        'Controls: Arrow keys + space bar. \n Press ok to start the game.'
      );
      localStorage.setItem('hasVisited1PlayerBefore', 'yep');
    }
    for (let control of CONTROLS) {
      if (control.name.indexOf('Arrow keys') !== -1 || control.ai) {
        this.activateNextPlayer(control);
      }
    }
  } else {
    if (localStorage && !localStorage.getItem('hasVisitedMultiplayerBefore')) {
      alert(
        'Keyboard players can join by pressing \n' +
        'Arrow keys, WASD, TFGH or IJKL. \n' +
        'Gamepad players can join by pressing any button. \n' +
        'Add an AI opponent by pressing \'x\' on the keyboard. \n' +
        'Enjoy!'
      );
      localStorage.setItem('hasVisitedMultiplayerBefore', 'yep');
    }
  }

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
  if(this.winner !== undefined) {
    return;
  }
  for(let i = 0; i < 1000; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.sin(angle);
    const dy = Math.cos(angle);
    const magnitude = (Math.random() - 0.5) * 20;
    this.players[playerId].particleSystem.spawn({
      x: this.currentGoal.body.position.x + dx * magnitude,
      y: this.currentGoal.body.position.y + dy * magnitude,
      z: 0,
    }, {
      x: dx * 10,
      y: dy * 10,
      z: (Math.random() - 0.5),
    });
  }
  this.camera.position.z *= 0.98; 
  this.scores[playerId]++;
  this.scores[0] = Math.max(0, this.scores[0]);
  this.scores[1] = Math.max(0, this.scores[1]);
  if (this.scores[playerId] === 5) {
    SoundManager.playSound('win');
    setTimeout(() => {
      this.winner = playerId;
      let number_of_players = 0;
      for(let i = 0; i < this.players.length; i++) {
        number_of_players++;
      }
      gtag('event', 'winner', {
        player_id: playerId,
        scores: this.scores,
        number_of_players,
        game_time: +new Date() - this.game_time,
      });
    }, 300);
    setTimeout(() => {
      this.reset();
    }, 4000)
  } else {
    this.spawnGoal();
    SoundManager.playSound(`hit${this.scores[playerId]}`);
  }
};

GameState.prototype.spawnGoal = function() {
  let nextAnchorCandidates = [];
  for (let i = 0; i < this.anchors.length; i++) {
    const anchor = this.anchors[i];
    if (!anchor.goal) {
      let allowed = true;
      for(let player of this.players) {
        if(!player.active) {
          continue;
        }
        if(player.currentAnchor === anchor) {
          allowed = false;
          break;
        }
      }
      if(allowed) {
        nextAnchorCandidates.push(anchor);
      }
    }
  }
  for(let anchor of this.anchors) {
    anchor.removeAsGoal();
  }

  let candidateIndex = Math.random() * nextAnchorCandidates.length | 0;
  const anchor = nextAnchorCandidates[candidateIndex];
  anchor.setAsGoal();
  this.currentGoal = anchor;
  gtag('event', 'spawn_goal');
};

GameState.prototype.render = function(renderer) {
  renderer.setClearColor(0x081426);
  this.bloompass.intensity = 2 + BEATPULSE;
  this.goalParticleSystem.render();
  for(let anchor of this.anchors) {
    anchor.render();
  }

  for(let player of this.players) {
    player.render();
  }
  this.hud.render();

  if(this.winner !== undefined) {
    this.players[this.winner].mesh.position.x = this.camera.position.x;
    this.players[this.winner].mesh.position.y = this.camera.position.y;
    this.players[this.winner].mesh.position.z = this.camera.position.z + 400;
    this.players[this.winner].particleSystem.particles.position.x = this.camera.position.x;
    this.players[this.winner].particleSystem.particles.position.y = this.camera.position.y;
    this.players[this.winner].particleSystem.particles.position.z = this.camera.position.z + 400;
    this.players[this.winner].particleSystem.spawn(this.players[this.winner].mesh.position, {x: 0, y: 1, z: 0});
    this.players[this.winner].mesh.rotation.x += 0.02;
    this.players[this.winner].mesh.rotation.y += 0.01;
    this.players[this.winner].mesh.rotation.z = -1;
  }
  composer.render(1/60);
};

GameState.prototype.activateNextPlayer = function(controls) {
  for(let i in this.players) {
    const player = this.players[i];
    if(!player.active) {
      controls.active = true;
      player.activate(controls);
      gtag('event', 'activate', {
        'controls': controls.name,
        'number_of_players': i + 1,
      });
      return;
    }
  }
};

GameState.prototype.update = function() {
  if(this.introTimer > 0) {
    this.introTimer--;
  }
  SoundManager.update();

  outer:
  for(let controls of CONTROLS) {
    if(controls.active) {
      continue;
    }
    for(let keycodeId in controls.keyboard) {
      const keycode = controls.keyboard[keycodeId];
      if(KEYS[keycode]) {
        this.activateNextPlayer(controls);
        continue outer;
      }
    }
    const joycon = navigator.getGamepads()[JOYCONS[controls.joycon.id]];
    if(joycon) {
      for(let button of joycon.buttons) {
        if(button.pressed) {
          this.activateNextPlayer(controls);
          continue outer;
        }
      }
    }
  }

  for(let player of this.players) {
    player.update();
  }

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
    //this.bglayer0.add(model);
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
    //this.bglayer1.add(model);
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
    //this.bglayer2.add(model);
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
    //this.bglayer3.add(model);
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

  let cameraCenter = {x: 0, y: 0};
  let numberOfActivePlayers = 0;
  for(let player of this.players) {
    if(!player.active) {
      continue;
    }
    numberOfActivePlayers++;
    cameraCenter = Matter.Vector.add(cameraCenter, player.body.position);
  }
  if(numberOfActivePlayers) {
    cameraCenter = Matter.Vector.mult(cameraCenter, 1 / numberOfActivePlayers);
  }
  let maxDistance = 50;
  for(let player of this.players) {
    const distance = Matter.Vector.magnitude(Matter.Vector.sub(cameraCenter, player.body.position));
    maxDistance = Math.max(distance, maxDistance);
  }
  this.cameraTarget.x = cameraCenter.x;
  this.cameraTarget.y = cameraCenter.y;
  this.cameraTarget.z = -2000 -maxDistance / 2;

  this.camera.position.x = this.camera.position.x - (this.camera.position.x - this.cameraTarget.x) / 64;
  this.camera.position.y = this.camera.position.y - (this.camera.position.y - this.cameraTarget.y) / 64;
  this.camera.position.z = this.camera.position.z - (this.camera.position.z - this.cameraTarget.z) / 128;

  for(let anchor of this.anchors) {
    anchor.update();
  }

  this.goalParticleSystem.update();
  if (!this.winner) {
    Matter.Engine.update(this.matterEngine);
  }
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
