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
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player, bullets, zombies, bg, mid, fg;
let ammo = 6, score = 0, health = 100, reloading = false;
let scoreText, ammoText, reloadText, healthBar;
let zombieTimer = 0;

function preload() {
  this.load.setPath('assets/');
  this.load.image('bg', 'background_layer.png');
  this.load.image('mid', 'midground_layer.png');
  this.load.image('fg', 'foreground_layer.png');
  this.load.image('soldier', 'soldier.png');
  this.load.image('zombie', 'zombie.png');
  this.load.image('bullet', 'bullet.png');
}

function create() {
  // Parallax layers
  bg = this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(896, 512);
  mid = this.add.tileSprite(0, 0, 896, 512, 'mid').setOrigin(0).setDisplaySize(896, 512).setAlpha(0.6);
  fg = this.add.tileSprite(0, 0, 896, 512, 'fg').setOrigin(0).setDisplaySize(896, 512).setAlpha(0.8);

  player = this.physics.add.sprite(100, 400, 'soldier').setScale(2).setCollideWorldBounds(true);

  bullets = this.physics.add.group();
  zombies = this.physics.add.group();

  this.physics.add.overlap(bullets, zombies, (bullet, zombie) => {
    bullet.destroy();
    zombie.destroy();
    score += 10;
    scoreText.setText(`Score: ${score}`);
  });

  this.physics.add.overlap(player, zombies, () => {
    health -= 20;
    updateHealthBar();
  });

  // UI
  scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '18px', fill: '#fff' });
  ammoText = this.add.text(10, 30, 'Ammo: 6', { fontSize: '18px', fill: '#fff' });
  reloadText = this.add.text(10, 50, '', { fontSize: '16px', fill: '#ff0' });
  healthBar = this.add.graphics();
  updateHealthBar();

  // Shoot input
  this.input.on('pointerdown', () => {
    if (reloading || ammo <= 0) return;
    const bullet = bullets.create(player.x + 40, player.y, 'bullet');
    bullet.setVelocityX(400).setScale(2);
    ammo--;
    ammoText.setText(`Ammo: ${ammo}`);
    if (ammo === 0) startReload(this);
  });
}

function update(time) {
  mid.tilePositionX += 0.5;
  fg.tilePositionX += 1;

  if (time > zombieTimer) {
    let zombie = zombies.create(896, 400, 'zombie').setVelocityX(-100).setScale(2);
    zombieTimer = time + 1500;
  }

  if (health <= 0) {
    this.scene.restart();
    health = 100;
    ammo = 6;
    score = 0;
    reloading = false;
  }
}

function updateHealthBar() {
  healthBar.clear();
  healthBar.fillStyle(0xff0000).fillRect(10, 80, 100, 10);
  healthBar.fillStyle(0x00ff00).fillRect(10, 80, Math.max(0, health), 10);
}

function startReload(scene) {
  reloading = true;
  reloadText.setText('Reloading...');
  scene.time.delayedCall(1000, () => {
    ammo = 6;
    ammoText.setText(`Ammo: ${ammo}`);
    reloadText.setText('');
    reloading = false;
  });
}
