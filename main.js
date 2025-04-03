const GameConfig = {
  type: Phaser.AUTO,
  width: 896,
  height: 512,
  render: {
    pixelArt: true,
    antialias: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60,
      fixedStep: true
    }
  },
  scene: MainScene
};

const game = new Phaser.Game(GameConfig);

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.ammo = 6;
    this.maxAmmo = 6;
    this.reloading = false;
    this.zombieSpawnRate = 1500;
    this.nextZombieTime = 0;
    this.gameSpeed = 1;
  }

  preload() {
    // Load assets with fallbacks
    this.load.setPath('assets/');
    this.load.image('bgLayer', 'background_layer.png');
    this.load.image('midLayer', 'midground_layer.png');
    this.load.image('fgLayer', 'foreground_layer.png');
    this.load.image('soldier', 'soldier.png');
    this.load.image('zombie', 'zombie.png');
    this.load.image('bullet', 'bullet.png');
    this.load.image('healthPack', 'healthPack.png');
    this.load.image('ammoBox', 'ammoBox.png');
    
    // Sound effects
    this.load.audio('shoot', 'shoot.wav');
    this.load.audio('reload', 'reload.wav');
    this.load.audio('zombieDeath', 'zombie_death.wav');
    this.load.audio('powerup', 'powerup.wav');
    this.load.audio('hurt', 'hurt.wav');
  }

  create() {
    this.setupBackground();
    this.setupPlayer();
    this.setupGroups();
    this.setupCollisions();
    this.setupUI();
    this.setupControls();
    this.setupAudio();

    // Difficulty scaling
    this.time.addEvent({
      delay: 30000,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true
    });
  }

  setupBackground() {
    this.bgLayer = this.add.image(0, 0, 'bgLayer')
      .setOrigin(0, 0)
      .setDisplaySize(896, 512);

    this.midLayer = this.add.tileSprite(0, 0, 896, 512, 'midLayer')
      .setOrigin(0, 0)
      .setDisplaySize(896, 512)
      .setAlpha(0.6);

    this.fgLayer = this.add.tileSprite(0, 0, 896, 512, 'fgLayer')
      .setOrigin(0, 0)
      .setDisplaySize(896, 512)
      .setAlpha(0.8);
  }

  setupPlayer() {
    this.player = this.physics.add.sprite(100, 400, 'soldier')
      .setScale(2)
      .setCollideWorldBounds(true)
      .setSize(16, 24)
      .setOffset(8, 8);
  }

  setupGroups() {
    this.zombies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.powerUps = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 10
    });
  }

  setupCollisions() {
    this.physics.add.overlap(this.bullets, this.zombies, this.killZombie, null, this);
    this.physics.add.overlap(this.player, this.zombies, this.damagePlayer, null, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
  }

  setupUI() {
    this.scoreText = this.add.text(10, 10, 'Score: 0', 
      { fontSize: '20px', fill: '#fff', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 });
    
    this.ammoText = this.add.text(10, 30, `Ammo: ${this.ammo}/${this.maxAmmo}`, 
      { fontSize: '20px', fill: '#fff', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 });
    
    this.reloadText = this.add.text(10, 50, '', 
      { fontSize: '16px', fill: '#ff0', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 });

    this.createHealthBar();
  }

  createHealthBar() {
    this.healthBarBg = this.add.rectangle(10, 80, 104, 14, 0x000000)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff);
    
    this.healthBar = this.add.rectangle(12, 82, 100, 10, 0x00ff00)
      .setOrigin(0, 0);
  }

  updateHealthBar() {
    this.healthBar.width = (this.health / this.maxHealth) * 100;
    this.healthBar.fillColor = Phaser.Display.Color.GetColor(
      255 * (1 - (this.health / this.maxHealth)),
      255 * (this.health / this.maxHealth),
      0
    );
  }

  setupControls() {
    this.input.on('pointerdown', () => {
      if (this.reloading || this.ammo <= 0) {
        if (this.ammo <= 0) this.startReload();
        return;
      }
      
      this.shoot();
    });

    // Keyboard controls for testing
    this.input.keyboard.on('keydown-R', () => this.startReload());
  }

  setupAudio() {
    this.sounds = {
      shoot: this.sound.add('shoot', { volume: 0.3 }),
      reload: this.sound.add('reload'),
      zombieDeath: this.sound.add('zombieDeath'),
      powerup: this.sound.add('powerup'),
      hurt: this.sound.add('hurt')
    };
  }

  update(time) {
    this.scrollBackground();
    this.spawnEnemies(time);
    this.cleanupBullets();
    this.checkGameOver();
  }

  scrollBackground() {
    this.midLayer.tilePositionX += 1 * this.gameSpeed;
    this.fgLayer.tilePositionX += 2 * this.gameSpeed;
  }

  spawnEnemies(time) {
    if (time > this.nextZombieTime) {
      this.spawnZombie();
      this.nextZombieTime = time + this.zombieSpawnRate;
      
      if (Phaser.Math.Between(1, 100) <= 20) {
        this.spawnPowerUp();
      }
    }
  }

  spawnZombie() {
    const zombie = this.zombies.get(896, 400, 'zombie');
    if (zombie) {
      zombie
        .setActive(true)
        .setVisible(true)
        .setVelocityX(-100 * this.gameSpeed)
        .setScale(2)
        .setSize(16, 24)
        .setOffset(8, 8);
    }
  }

  spawnPowerUp() {
    const types = ['healthPack', 'ammoBox'];
    const type = Phaser.Utils.Array.GetRandom(types);
    
    const powerUp = this.powerUps.get(896, 400, type);
    if (powerUp) {
      powerUp
        .setActive(true)
        .setVisible(true)
        .setVelocityX(-100 * this.gameSpeed)
        .setScale(1.5)
        .setData('type', type);
    }
  }

  cleanupBullets() {
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.x > this.game.config.width) {
        bullet.destroy();
      }
    });
  }

  checkGameOver() {
    if (this.health <= 0) {
      this.scene.restart();
    }
  }

  shoot() {
    const bullet = this.bullets.create(this.player.x + 40, this.player.y, 'bullet');
    bullet
      .setVelocityX(400)
      .setScale(2)
      .setSize(8, 4)
      .setOffset(0, 2);
    
    this.ammo--;
    this.ammoText.setText(`Ammo: ${this.ammo}/${this.maxAmmo}`);
    this.sounds.shoot.play();
    
    if (this.ammo === 0) {
      this.startReload();
    }
  }

  startReload() {
    if (this.reloading) return;
    
    this.reloading = true;
    this.reloadText.setText('Reloading...');
    this.sounds.reload.play();
    
    this.time.delayedCall(1000, () => {
      this.ammo = this.maxAmmo;
      this.ammoText.setText(`Ammo: ${this.ammo}/${this.maxAmmo}`);
      this.reloadText.setText('');
      this.reloading = false;
    });
  }

  killZombie(bullet, zombie) {
    bullet.destroy();
    zombie.destroy();
    
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
    this.sounds.zombieDeath.play();
  }

  damagePlayer(player, zombie) {
    zombie.destroy();
    this.health -= 20;
    this.updateHealthBar();
    this.sounds.hurt.play();
    
    // Flash player when hit
    this.player.setTint(0xff0000);
    this.time.delayedCall(200, () => this.player.clearTint());
  }

  collectPowerUp(player, powerUp) {
    const type = powerUp.getData('type');
    
    if (type === 'healthPack') {
      this.health = Phaser.Math.Clamp(this.health + 30, 0, this.maxHealth);
      this.updateHealthBar();
    } else if (type === 'ammoBox') {
      this.ammo = this.maxAmmo;
      this.ammoText.setText(`Ammo: ${this.ammo}/${this.maxAmmo}`);
    }
    
    powerUp.destroy();
    this.sounds.powerup.play();
  }

  increaseDifficulty() {
    this.gameSpeed += 0.1;
    this.zombieSpawnRate = Math.max(500, this.zombieSpawnRate - 100);
    
    // Visual feedback
    this.cameras.main.flash(0x00ff00, 200);
    this.add.text(this.game.config.width/2, 50, 'Difficulty Increased!', 
      { fontSize: '24px', fill: '#0f0', fontFamily: 'Arial' })
      .setOrigin(0.5)
      .setDepth(1000);
  }
}
