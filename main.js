const config = {
  type: Phaser.AUTO,
  width: 896,
  height: 512,
  render: {
    pixelArt: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let player, bullets, zombies, powerUps;
let bgLayer, midLayer, fgLayer;
let score = 0, health = 100, ammo = 6, reloading = false;
let zombieTimer = 0;
let scoreText, ammoText, reloadText, healthBar;

function preload() {
  this.load.image('bgLayer', 'assets/background_layer.png');
  this.load.image('midLayer', 'assets/midground_layer.png');
  this.load.image('fgLayer', 'assets/foreground_layer.png');
  this.load.image('soldier', 'assets/soldier.png');
  this.load.image('zombie', 'assets/zombie.png');
  this.load.image('bullet', 'assets/bullet.png');
  this.load.image('healthPack', 'assets/healthPack.png');
  this.load.image('ammoBox', 'assets/ammoBox.png');
}

function create() {
  // Background: STATIC (not tileSprite)
  bgLayer = this.add.image(0, 0, 'bgLayer').setOrigin(0, 0).setDisplaySize(896, 512);

  // Midground + Foreground: SCROLLING
  midLayer = this.add.tileSprite(0, 0, 896, 512, 'midLayer')
    .setOrigin(0, 0)
    .setDisplaySize(896, 512)
    .setAlpha(0.6);

  fgLayer = this.add.tileSprite(0, 0, 896, 512, 'fgLayer')
    .setOrigin(0, 0)
    .setDisplaySize(896, 512)
    .setAlpha(0.8);

  player = this.physics.add.sprite(100, 400, 'soldier');
  player.setScale(2).setCollideWorldBounds(true);

  zombies = this.physics.add.group();
  bullets = this.physics.add.group();
  powerUps = this.physics.add.group();

  this.physics.add.overlap(bullets, zombies, killZombie, null, this);
  this.physics.add.overlap(player, zombies, damagePlayer, null, this);
  this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);

  scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#fff' });
  ammoText = this.add.text(10, 30, 'Ammo: 6', { fontSize: '20px', fill: '#fff' });
  reloadText = this.add.text(10, 50, '', { fontSize: '16px', fill: '#ff0' });

  healthBar = this.add.graphics();
  drawHealthBar();

  this.input.on('pointerdown', () => {
    if (reloading || ammo <= 0) return;
    const bullet = bullets.create(player.x + 40, player.y, 'bullet');
    bullet.setVelocityX(400);
    bullet.setScale(2);
    ammo--;
    ammoText.setText('Ammo: ' + ammo);
    if (ammo === 0) startReload(this);
  });
}

function update(time) {
  // Scroll only mid + fore layers
  midLayer.tilePositionX += 1;
  fgLayer.tilePositionX += 2;

  if (time > zombieTimer) {
    let zombie = zombies.create(896, 400, 'zombie');
    zombie.setVelocityX(-100).setScale(2);
    zombieTimer = time + 1500;

    if (Math.random() < 0.2) {
      let type = Math.random() < 0.5 ? 'healthPack' : 'ammoBox';
      let powerUp = powerUps.create(896, 400, type);
      powerUp.setVelocityX(-100).setScale(1.5);
      powerUp.type = type;
    }
  }

  bullets.children.iterate(bullet => {
    if (bullet && bullet.x > 896) bullet.destroy();
  });

  if (health <= 0) {
    this.scene.restart();
    score = 0; health = 100; ammo = 6; reloading = false;
  }
}

function killZombie(bullet, zombie) {
  bullet.destroy(); zombie.destroy();
  score += 10;
  scoreText.setText('Score: ' + score);
}

function damagePlayer(player, zombie) {
  zombie.destroy();
  health -= 20;
  drawHealthBar();
}

function collectPowerUp(player, powerUp) {
  if (powerUp.type === 'healthPack') {
    health = Math.min(100, health + 30);
    drawHealthBar();
  } else if (powerUp.type === 'ammoBox') {
    ammo = 6;
    ammoText.setText('Ammo: ' + ammo);
  }
  powerUp.destroy();
}

function drawHealthBar() {
  healthBar.clear();
  healthBar.fillStyle(0xff0000);
  healthBar.fillRect(10, 80, 100, 10);
  healthBar.fillStyle(0x00ff00);
  healthBar.fillRect(10, 80, health, 10);
}

function startReload(scene) {
  reloading = true;
  reloadText.setText('Reloading...');
  scene.time.delayedCall(1000, () => {
    ammo = 6;
    ammoText.setText('Ammo: ' + ammo);
    reloadText.setText('');
    reloading = false;
  });
}
