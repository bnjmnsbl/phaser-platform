// ============
// SPRITE CONSTRUCTORS
// ===========

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'ada');
	//set Sprite anchor so it is positioned on ground
    
    this.anchor.set(0.5, 0.5);
    
    this.game.physics.enable(this)
    this.body.collideWorldBounds = true; // so player cannot leave screen
    
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2, 3, 4], 8, true); // 8fps looped
    this.animations.add('jump', [6, 7, 8, 9, 10], 8);
    this.animations.add('fall', [11]);
	this.scale.setTo(1.5, 1.5);
}
// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

// this HAS to be after the constructor overwrite above or it won't work
Hero.prototype.move = function (direction) {
	const SPEED = 200;
	this.body.velocity.x = direction * SPEED
	
	if (this.body.velocity.x < 0) {
		this.scale.x = -1.5
	} else if (this.body.velocity.x > 0) {
	this.scale.x = 1.5;
	}
}

Hero.prototype.jump = function () {
	const JUMPHEIGHT = 600;
	let canJump = this.body.touching.down;
	
	if (canJump) {
		this.body.velocity.y = -JUMPHEIGHT;
	}
	
	return canJump; // we return this to use it for sound 
};

Hero.prototype.bounce = function () {
	const BOUNCEHEIGHT = 200;
	this.body.velocity.y = -BOUNCEHEIGHT;
}

Hero.prototype._getAnimationName = function () {
	let name = 'stop';
	
	if (this.body.velocity.y < 0) {
		name = 'jump'
	}
	else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
		name = 'fall';
	}
	else if (this.body.velocity.x !== 0 && this.body.touching.down) {
		name = 'run';
	}
	return name; 	
};

Hero.prototype.update = function () {
	let animationName = this._getAnimationName();
	if (this.animations.name !== animationName) {
		this.animations.play(animationName);
	}
};

// ============
// SPIDERS!!!
// ============
function Spider(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, 'spider');
	
	// anchor
	this.anchor.set(0.5, 0.5);
    
    // animation
    this.animations.add('crawl', [0,1,2], 8, true); // 8 fps, looped
	this.animations.add('die', [0,4,0,4,0,4,3,3,3,3,3,3], 12); // 12fps, not looped
	this.animations.play('crawl');
    
    
    // physics
    this.game.physics.enable(this)
    this.body.collideWorldBounds = true; 
    this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () { // update function gets called EVERY frame
	if (this.body.touching.right || this.body.blocked.right) { // if spider touches wall or screen border
		this.body.velocity.x =  -Spider.SPEED
	} else if (this.body.touching.left || this.body.blocked.left) {
		this.body.velocity.x =  Spider.SPEED
		}
}

Spider.prototype.die = function () {
	this.body.enable = false; // no more physics for you, dead spider!
	
	this.animations.play('die').onComplete.addOnce(function () {
		this.kill();
		}, this);

}

// =============================================================================
// game states
// =============================================================================


PlayState = {};

const LEVEL_COUNT = 2;

PlayState.preload = function () {
    this.game.load.json('level:0', 'data/level00.json');
	this.game.load.json('level:1', 'data/level01.json');
	
	this.game.load.image('font:numbers', 'images/numbers.png');  // Spritesheet, but called as image!

    this.game.load.image('background', 'images/background.png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
	this.game.load.image('icon:coin', 'images/coin_icon.png');
	this.game.load.image('hero', 'images/hero_stopped.png');
	this.game.load.image('key', 'images/key.png');

    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.spritesheet('ada', 'images/bonk.png', 32, 32);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
    
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.audio('sfx:key', 'audio/key.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');

};

PlayState.init = function (data) {
	
	// LEVELS
	this.level = (data.level || 0) % LEVEL_COUNT; // the modulu operation means: when all levels done, go back to 0
	
	// COUNTERS
	this.coinPickupCount = 0;
	this.hasKey = false;
	
	// CONTROLS
	this.keys = this.game.input.keyboard.addKeys({
	left: 	Phaser.KeyCode.LEFT,
	right: 	Phaser.KeyCode.RIGHT,
	up:		Phaser.KeyCode.UP
	})
	
	this.keys.up.onDown.add(function () { //event listener instead of keydown, so jump happens only once
		
		let didJump = this.hero.jump();
		
		if (didJump) {
			this.sfx.jump.play();
		}
		
	}, this); // 'this' is the new this, after callback is executed
	
	this.game.renderer.renderSession.roundPixels = true //avoid blurry pixels
}

PlayState.create = function () {
	this.game.add.image(0,0, 'background');
	this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));

	// CREATE SOUND
	this.sfx = {
		jump: this.game.add.audio('sfx:jump'),
		coin: this.game.add.audio('sfx:coin'),
		stomp: this.game.add.audio('sfx:stomp'),
		key: this.game.add.audio('sfx:key'),
		door: this.game.add.audio('sfx:door')
		};
	
	this._createHud();	//this is on top of everyhting, should be called last
	
};

PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();

	this.keyIcon.frame = this.hasKey ? 1 : 0;
    this.coinFont.text = `x${this.coinPickupCount}`;
};

PlayState._createHud = function () {
	const NUMBERS_STR = '0123456789X';
	this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6)
	this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);
	let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
	let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);
	
	this.hud = this.game.add.group();
	this.hud.add(coinIcon);
	this.hud.add(coinScoreImg);
	this.hud.position.set(10, 10);
	this.hud.add(this.keyIcon);
	
}

PlayState._loadLevel = function (data) {
	const GRAVITY = 1200;
	
	this.bgDecoration = this.game.add.group();
	this.platforms = this.game.add.group();
	this.coins = this.game.add.group();
	this.spiders = this.game.add.group();
	this.enemyWalls = this.game.add.group()
	this.enemyWalls.visible = false;
	
	this._spawnCharacters({hero: data.hero, spiders: data.spiders});

	data.platforms.forEach(this._spawnPlatform, this);
	data.coins.forEach(this._spawnCoin, this);
	this._spawnDoor(data.door.x, data.door.y);
	this._spawnKey(data.key.x, data.key.y);
	this.game.physics.arcade.gravity.y = GRAVITY;
}

// ===============
// SPAWN FUNCTIONS
// ===============

PlayState._spawnKey = function (x, y) {
	this.key = this.bgDecoration.create(x, y, 'key')
	this.key.anchor.setTo(0.5, 0.5);
	this.game.physics.enable(this.key); //physics used for collision detection only
	this.key.body.allowGravity = false;	
	// TWEEN Animation
	this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({y: this.key.y + 3}, 400, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
}

PlayState._spawnDoor = function (x, y) {
	this.door = this.bgDecoration.create(x, y, 'door');
	this.door.anchor.setTo(0.5, 1);
	this.game.physics.enable(this.door); //physics used for collision detection only
	this.door.body.allowGravity = false;
}

PlayState._spawnPlatform = function (platform) {
	
	let sprite = this.platforms.create(platform.x, platform.y, platform.image);
	this.game.physics.enable(sprite)
	sprite.body.allowGravity = false; 	// Platforms should not fall down
	sprite.body.immovable = true;		// Platforms should not be pushed by hero
	
	this._spawnEnemyWall(platform.x, platform.y, 'left')
	this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right')

}

PlayState._spawnEnemyWall = function (x, y, side) {
	let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
	sprite.anchor.set(side === 'left' ? 1 : 0, 1);
	
	this.game.physics.enable(sprite);
	sprite.body.immovable = true;
	sprite.body.allowGravity = false;
};

PlayState._spawnCoin = function (coin) {
	let sprite = this.coins.create(coin.x, coin.y, 'coin');
	this.game.physics.enable(sprite); // we use physics for collision check
	sprite.body.allowGravity = false;
	sprite.anchor.set(0.5, 0.5);
	
	sprite.animations.add('rotate', [0,1,2,1], 6, true); // 6fps, looped
	sprite.animations.play('rotate');
	
}

PlayState._spawnCharacters = function (data) {
	this.hero = new Hero(this.game, data.hero.x, data.hero.y)
	this.game.add.existing(this.hero);
	
	data.spiders.forEach(function (spider) {
		let sprite = new Spider(this.game, spider.x, spider.y);
		this.spiders.add(sprite);
		}, this);
}

// ==========
// COLLISIONS
// ==========

PlayState._handleCollisions = function () {
	this.game.physics.arcade.collide(this.hero, this.platforms);
	this.game.physics.arcade.overlap(this.hero, this.coins, this._collectCoin, null, this); // we use overlap, not collide, so coins don't block character movement. 'null' means no filter method (no sprites excluded)
	this.game.physics.arcade.overlap(this.hero, this.key, this._collectKey, null, this)
	this.game.physics.arcade.collide(this.spiders, this.platforms);
	this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

	this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
	this.game.physics.arcade.overlap(this.hero, this.door, this._openDoor, 
		function(hero, door) {		
			return this.hasKey && hero.body.touching.down;	//filter - _openDoor is only called when true
		}, this);

}

PlayState._collectCoin = function (hero, coin) {
	this.coinPickupCount++;
	this.sfx.coin.play();
	coin.kill();
}

PlayState._collectKey = function (hero, key) {
	this.hasKey = true;
	this.sfx.key.play();
	key.kill();
}

PlayState._openDoor = function (hero, door) {
	this.sfx.door.play();
	this.game.state.restart(true, false, {level: this.level +1});
}

PlayState._onHeroVsEnemy = function (hero, enemy) {
	if (hero.body.velocity.y > 0) {
		this.sfx.stomp.play()
		hero.bounce();
		enemy.die();
	} 
	else {
		this.sfx.stomp.play();
		this.game.state.restart(true, false, {level: this.level});
	}
}

PlayState._handleInput = function () {
	if (this.keys.left.isDown) {
	this.hero.move(-1)
	} else if (this.keys.right.isDown) {
	this.hero.move(1)
	}
	else if (this.keys.up.isDown) {
	this.hero.jump()
	}
	
	else {
	this.hero.move(0);
	}
}

// =============================================================================
// entry point
// =============================================================================


window.onload = function () {
	let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game') 
	game.state.add('play', PlayState);
	game.state.start('play', true, false, {level: 0});
};