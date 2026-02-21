import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // Load dynamic AI background
    if (window.gameSettings && window.gameSettings.bgUrl) {
      this.load.image('bg', window.gameSettings.bgUrl);
    } else {
      this.load.svg('bg', '/assets/backgrounds/bg.svg');
    }
    
    // Load placeholder assets from public folder
    this.load.svg('p1', '/assets/models/p1.svg');
    this.load.svg('p2', '/assets/models/p2.svg');
    this.load.svg('platform', '/assets/models/platform.svg');
  }

  getKeyCode(keyStr) {
    if (!keyStr) return Phaser.Input.Keyboard.KeyCodes.SPACE;
    keyStr = keyStr.toUpperCase();
    if (Phaser.Input.Keyboard.KeyCodes[keyStr]) {
      return Phaser.Input.Keyboard.KeyCodes[keyStr];
    }
    return Phaser.Input.Keyboard.KeyCodes.SPACE; // fallback
  }

  create() {
    // Background
    this.add.image(400, 300, 'bg').setDisplaySize(800, 600);

    // Platforms group
    this.platforms = this.physics.add.staticGroup();
    
    // Main ground platform - Centered so players can fall off edges easily
    this.platforms.create(400, 450, 'platform').setScale(2, 1).refreshBody();
    
    // Floating platforms
    this.platforms.create(250, 300, 'platform').setScale(0.8, 1).refreshBody();
    this.platforms.create(550, 300, 'platform').setScale(0.8, 1).refreshBody();
    this.platforms.create(400, 150, 'platform').setScale(0.5, 1).refreshBody();

    // Player 1
    this.p1 = this.physics.add.sprite(200, 100, 'p1');
    this.p1.setBounce(0.1);
    this.p1.setCollideWorldBounds(false); // Can fall off the screen
    this.p1.damagePercent = 0;
    this.p1.stocks = 3;

    // Player 2
    this.p2 = this.physics.add.sprite(600, 100, 'p2');
    this.p2.setBounce(0.1);
    this.p2.setCollideWorldBounds(false); // Can fall off the screen
    this.p2.damagePercent = 0;
    this.p2.stocks = 3;

    // Collisions
    this.physics.add.collider(this.p1, this.platforms);
    this.physics.add.collider(this.p2, this.platforms);
    this.physics.add.collider(this.p1, this.p2, this.handlePlayerCollision, null, this);

    // Default Controls
    let p1Config = { up: 'W', left: 'A', right: 'D', attack: 'F' };
    let p2Config = { up: 'UP', left: 'LEFT', right: 'RIGHT', attack: 'SHIFT' };

    if (window.gameSettings) {
      p1Config = window.gameSettings.p1Controls;
      p2Config = window.gameSettings.p2Controls;
    }

    // Controls P1
    this.keysP1 = this.input.keyboard.addKeys({
      up: this.getKeyCode(p1Config.up),
      down: this.getKeyCode('S'), // Hardcoded down just in case
      left: this.getKeyCode(p1Config.left),
      right: this.getKeyCode(p1Config.right),
      attack: this.getKeyCode(p1Config.attack)
    });

    // Controls P2
    this.keysP2 = this.input.keyboard.addKeys({
      up: this.getKeyCode(p2Config.up),
      down: this.getKeyCode('DOWN'), // Hardcoded down just in case
      left: this.getKeyCode(p2Config.left),
      right: this.getKeyCode(p2Config.right),
      attack: this.getKeyCode(p2Config.attack)
    });

    // UI elements references
    this.p1ScoreText = document.getElementById('p1-score');
    this.p2ScoreText = document.getElementById('p2-score');

    this.updateScoreUI();
  }

  update() {
    this.handlePlayerMovement(this.p1, this.keysP1);
    this.handlePlayerMovement(this.p2, this.keysP2);

    this.checkBlastZones(this.p1);
    this.checkBlastZones(this.p2);
  }

  handlePlayerMovement(player, keys) {
    const moveSpeed = 350;
    const jumpForce = -750;

    // Acceleration-based movement for momentum
    if (keys.left.isDown) {
      player.setAccelerationX(-2000);
      if (player.body.velocity.x < -moveSpeed && player.body.touching.down) {
        player.setVelocityX(-moveSpeed);
      }
    } else if (keys.right.isDown) {
      player.setAccelerationX(2000);
      if (player.body.velocity.x > moveSpeed && player.body.touching.down) {
        player.setVelocityX(moveSpeed);
      }
    } else {
      player.setAccelerationX(0);
      // Friction
      if (player.body.touching.down) {
        player.setDragX(3000);
      } else {
        player.setDragX(500); // Less air drag
      }
    }

    if (keys.up.isDown && player.body.touching.down) {
      player.setVelocityY(jumpForce);
    }
  }

  handlePlayerCollision(p1, p2) {
    const speedDiffX = Math.abs(p1.body.velocity.x - p2.body.velocity.x);
    
    // Stomping mechanic
    if (p1.body.touching.down && p2.body.touching.up) {
        p2.damagePercent += 15;
        p2.setVelocityY(900); // Spike downward
        p1.setVelocityY(-500); // Bounce off
        this.applyKnockback(p1, p2, 0.5); // Add slight horizontal push
    } else if (p2.body.touching.down && p1.body.touching.up) {
        p1.damagePercent += 15;
        p1.setVelocityY(900);
        p2.setVelocityY(-500);
        this.applyKnockback(p2, p1, 0.5);
    } 
    // High-speed collision mechanic
    else if (speedDiffX > 250) {
        if (Math.abs(p1.body.velocity.x) > Math.abs(p2.body.velocity.x)) {
            p2.damagePercent += 8;
            this.applyKnockback(p1, p2, 1);
        } else {
            p1.damagePercent += 8;
            this.applyKnockback(p2, p1, 1);
        }
    }

    this.updateScoreUI();
  }

  applyKnockback(attacker, victim, multiplierModifier = 1) {
    const knockbackBaseX = 400;
    const knockbackBaseY = -300;
    
    // The higher the damage, the more the knockback multiplier scales
    const multiplier = (1 + (victim.damagePercent / 40)) * multiplierModifier;
    
    const dirX = Math.sign(victim.x - attacker.x) || 1;
    
    victim.setVelocityX(dirX * knockbackBaseX * multiplier);
    victim.setVelocityY(knockbackBaseY * multiplier);
  }

  checkBlastZones(player) {
    // If player falls off the main platform and passes y > 600, they die (blast zone)
    // Or if they get knocked too far off-screen horizontally.
    if (player.x < -150 || player.x > 950 || player.y > 650 || player.y < -400) {
        this.respawn(player);
    }
  }

  respawn(player) {
    player.stocks -= 1;
    player.damagePercent = 0;
    
    if (player.stocks <= 0) {
        const winner = player === this.p1 ? "Player 2" : "Player 1";
        this.scene.pause();
        
        // Simple Game Over UI
        const gameOverText = document.createElement('div');
        gameOverText.innerHTML = `<h1>${winner} Wins!</h1><button onclick="location.reload()" style="background:#ff6b6b;color:white;border:none;padding:10px 20px;font-size:16px;font-family:monospace;cursor:pointer;border-radius:5px;">Main Menu</button>`;
        gameOverText.style.position = 'absolute';
        gameOverText.style.top = '50%';
        gameOverText.style.left = '50%';
        gameOverText.style.transform = 'translate(-50%, -50%)';
        gameOverText.style.backgroundColor = 'rgba(0,0,0,0.8)';
        gameOverText.style.padding = '40px';
        gameOverText.style.borderRadius = '10px';
        gameOverText.style.textAlign = 'center';
        gameOverText.style.zIndex = '100';
        document.getElementById('game-container').appendChild(gameOverText);
        
        this.updateScoreUI();
        return;
    }

    // Reset physics state
    player.setPosition(400, 100);
    player.setVelocity(0, 0);
    player.setAcceleration(0, 0);
    this.updateScoreUI();
  }

  updateScoreUI() {
    if (this.p1ScoreText && this.p2ScoreText) {
        this.p1ScoreText.innerText = `P1: ${this.p1.damagePercent}% | Stocks: ${this.p1.stocks}`;
        this.p2ScoreText.innerText = `P2: ${this.p2.damagePercent}% | Stocks: ${this.p2.stocks}`;
    }
  }
}