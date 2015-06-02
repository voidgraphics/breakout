// Code principal
( function(){
	"use strict";

	window.Breakout = function( oApplication ){

		/**************************************************************
			CONSTANTS.
			BEWARE! modifying these can break the game's appearance.
		**************************************************************/
		var EFFECTDURATION		= 10000,
			BROWN				= "#3d3234",
			LIGHTBROWN			= "#6b5d60",
			GREEN				= "#70877f",
			BEIGE				= "#e2e6d2",
			WHITE 				= "#ffffff",
			RED 				= "#ca4645";
		// Bricks
		var BRICKWIDTH 			= 36,
			BRICKHEIGHT 		= 12,
			BRICKXMARGIN 		= 10,
			BRICKYMARGIN 		= 15,
			DEFAULTBRICKCOLOR	= LIGHTBROWN,
			HARDERCOLOR			= RED,
			WIDENERCOLOR		= BEIGE,
			FASTERCOLOR			= BEIGE,
			SLOWERCOLOR			= GREEN;
		// Platform
		var PLATFORMWIDTH 		= 100,
			PLATFORMHEIGHT 		= 10,
			PLATFORMCOLOR		= BEIGE,
			PLATFORMSPEED 		= 30,
			PLATFORMMAXSPEED 	= 40,
			PLATFORMMINSPEED 	= 30;
		// Projectile
		var PROJECTILESIZE		= 15,
			PROJECTILEMAXSIZE	= 20,
			PROJECTILECOLOR		= GREEN,
			PROJECTILESPEED 	= 7,
			PROJECTILEMAXSPEED 	= 10,
			PROJECTILEMINSPEED	= 3;


		// Global variables
		var iAnimationRequestId = 0,
			iMenuAnimationRequestId = 0,
			oSpriteSheet = null,
			respawnBricks = true,
			hasLost = false,
			hasWon = false,
			speedModifier = 1,
			sSpriteSheetSrc = "./img/sprite.png",
			iScore = 0,
			aBricks = [],
			oSourceCanvasRect = oApplication.canvas.getBoundingClientRect(),
			iTime = null,
			iBiggerStartedTime = null,
			iShorterStartedTime = null,
			iSlowerStartedTime = null,
			iFasterStartedTime = null;


		/**************************************************************
			BACKGROUND OBJECT.
			Provides a simple bg for the game and displays the score.
		**************************************************************/
		var oBackground = {
			"color": BROWN,
			"render": function() {
				// Background color
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( 0, 0, oApplication.width, oApplication.height );
				// Score
				ctx.fillStyle = RED;
				ctx.textAlign = "left";
				ctx.font = "500 12px 'Lato Black'";
				ctx.fillText("D E S T R O Y E D  :  " + iScore, 20, oApplication.height - 20);
				//Active effects
				if( oProjectile.speed > PROJECTILESPEED ){
					oApplication.context.drawImage( 
						oSpriteSheet, 
						45, 
						0, 
						15,
						15,
						oApplication.width - 35,
						oApplication.height - 30,
						15,
						15
					);
				}
				if( oProjectile.speed < PROJECTILESPEED ){
					oApplication.context.drawImage( 
						oSpriteSheet, 
						45, 
						24, 
						15,
						15,
						oApplication.width - 35,
						oApplication.height - 30,
						15,
						15
					);
				}
			}
		};


		/**************************************************************
			BRICKS.
			Used in game and in the menu.
		**************************************************************/
		var Brick = function( iX, iY, sSpeciality ) {
			this.frame = {
				sx: 0,
				sy: 0,
				sw: BRICKWIDTH,
				sh: BRICKHEIGHT
			};
			this.width 			= BRICKWIDTH;
			this.height 		= BRICKHEIGHT;
			this.x 				= iX;
			this.y 				= iY;
			this.color 			= DEFAULTBRICKCOLOR;
			this.hits 			= 0;
			this.maxHits 		= 1;
			this.speciality 	= sSpeciality;
			this.fallingSpeed 	= Math.random() + 0.5;
			switch( sSpeciality ){
				case "harder":
					this.color = HARDERCOLOR;
					this.maxHits = 3;
					this.frame.sy = 50;
					break;
				case "shorter":
					this.color = WIDENERCOLOR;
					break;
				case "faster":
					this.color = FASTERCOLOR;
					this.frame.sy = 92;
					break;
				case "slower":
					this.color = SLOWERCOLOR;
					this.frame.sy = 80;
					break;
			}

		};

		Brick.prototype.render = function() {
			aBricks.forEach( function( element ) {
				if( element.hits === 1 ){
					element.frame.sy = 25;
				} else if( element.hits === 2 ){	
					element.frame.sy = 0;
				}
				oApplication.context.fillStyle = element.color;
				oApplication.context.fillRect( element.x, element.y, element.width, element.height );
				oApplication.context.drawImage( 
					oSpriteSheet, 
					element.frame.sx, 
					element.frame.sy, 
					element.frame.sw,
					element.frame.sh,
					element.x,
					element.y,
					element.width,
					element.height
				);
			}, this );
		};

		Brick.prototype.update = function() {
			this.render();
		};


		/**************************************************************
			PLATFORM OBJECT.
			Controlled by the user to keep the projectile from falling.
		**************************************************************/
		var oPlatform = {
			"width": PLATFORMWIDTH,
			"height": PLATFORMHEIGHT,
			"color": PLATFORMCOLOR,
			"speed": PLATFORMSPEED,
			"x": oApplication.canvas.width / 2 - 50,
			"y": oApplication.canvas.height - 30,
			"update": function( oEvent ){
				if( oEvent.keyCode === 37 ){
					// Left key
					oPlatform.x -= oPlatform.speed;
				} else if( oEvent.keyCode === 39 ) {
					// Right key
					oPlatform.x += oPlatform.speed;
				} else if( oEvent.type === "mousemove" ){
					// Mouse control
					oPlatform.x = oEvent.clientX - oSourceCanvasRect.left - oPlatform.width / 2;
				}
				( oPlatform.x < 0 ) && ( oPlatform.x = 0 );
				( oPlatform.x > oSourceCanvasRect.width - oPlatform.width ) && ( oPlatform.x = oSourceCanvasRect.width - oPlatform.width );

			},
			"render": function(){
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( this.x, this.y, this.width, this.height );
			}
		};


		/**************************************************************
			PROJECTILE OBJECT.
			Breaks the bricks. And your face too. Be careful.
		**************************************************************/
		var oProjectile = {
			"color": 	PROJECTILECOLOR,
			"size": 	PROJECTILESIZE,
			"speed": 	PROJECTILESPEED,
			"x": 	oApplication.canvas.width / 2 - PROJECTILESIZE / 2,
			"y": 	oApplication.canvas.height - 45,
			"cx": 		0,
			"cy": 		0,
			"angle": 	-45,
			"update": function() {
				// Movement
				var newX, newY;
				this.cx = this.x + this.size / 2;
				this.cy = this.y + this.size / 2;

				fCheckCanvasHitzones();

				fCheckHitzones( oPlatform, false );

				aBricks.forEach( function( brick ){
					fCheckHitzones( brick, true );
				} );

				// Calculate trajectory based on direction angle (ranging from -180 to 180 degrees)
				if ( this.angle >= 90){
					newX = ( 180 - this.angle ) / 90 ;
					newY = ( this.angle - 90 ) / 90;
				} else if ( this.angle < -90) {
					newX = - ( 180 + this.angle ) / 90;
					newY = - ( this.angle + 90 ) / 90 ;
				} else if ( this.angle >= 0) {
					newX = ( this.angle ) / 90;
					newY = ( this.angle - 90 ) / 90 ;
				} else if( this.angle < 0) {
					newX = ( this.angle ) / 90;
					newY = - ( 90 + this.angle ) / 90 ;
				}

				this.x += newX * this.speed;
				this.y += newY * this.speed;

				this.render();
			},
			"render": function() {
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				//ctx.arc( this.x + this.size, this.y + this.size, this.size, 0, Math.PI * 2, true );
				ctx.fillRect( this.x, this.y, this.size, this.size );
			}
		};


		/**************************************************************
			MENU OBJECT.
			Generates the menus, with the falling bricks.
		**************************************************************/
		var oMenu = {
			"brickAmount": 10,
			"bricks": [],
			"init": function(){
				this.bricks = [];
				this.generateBricks();
				this.render();
				this.animate( true );
				console.log('Initialising menu');
			},
			"generateBricks": function() {
				var x, y, random, speciality, oBrick;
				for ( var i = 0; i <= this.brickAmount; i++ ){
					random = ~~( Math.random() * 6 );
					switch( random ){
						case 1:
							speciality = "harder";
							break;
						case 2:
							speciality = "slower";
							break;
						case 3:
							speciality = "faster";
							break;
						default:
							speciality = "none";
							break;
					}
					x = ~~( Math.random() * oApplication.width );
					y = ~~( Math.random() * oApplication.height );
					this.bricks.push( new Brick( x, y, speciality ) );
				}
			},
			"animate": function() {
				iMenuAnimationRequestId = window.requestAnimationFrame( oMenu.animate );
				oMenu.update();
				oMenu.render();
			},
			"render": function() {

				var ctx = oApplication.context, text;
				ctx.clearRect( 0, 0, oApplication.width, oApplication.height );

				// Background color
				ctx.fillStyle = BROWN;
				ctx.fillRect( 0, 0, oApplication.canvas.width, oApplication.canvas.height );

				// Bricks
				this.bricks.forEach( function( element ){
					ctx.fillStyle = element.color;
					ctx.fillRect( element.x, element.y, element.width, element.height );
					oApplication.context.drawImage( 
						oSpriteSheet, 
						element.frame.sx, 
						element.frame.sy, 
						element.frame.sw,
						element.frame.sh,
						element.x,
						element.y,
						element.width,
						element.height
					);
				} );

				// Text
				if( hasWon ){
					ctx.fillStyle = WHITE;
					ctx.font = "16px 'Lato Black'";
					ctx.textAlign = "center";
					text = "YOU WON!".split("").join(String.fromCharCode(8194));
					ctx.fillText( text, oApplication.width / 2, oApplication.height / 2 - 15 );
					ctx.fillStyle = BEIGE;
					ctx.font = "12PX Lato";
					text = "CONGRATULATIONS. CLICK TO RESTART.".split("").join(String.fromCharCode(8194));
					ctx.fillText(text, oApplication.width / 2, oApplication.height / 2 + 20);
					ctx.font = "10px 'Lato Black'";
					ctx.fillStyle = RED;
					text = "CODE BY ADRIEN LELOUP".split("").join(String.fromCharCode(8196));
					ctx.fillText( text, oApplication.width / 2, oApplication.height / 1.2);
				} else if( hasLost ){
					ctx.fillStyle = WHITE;
					ctx.font = "16px 'Lato Black'";
					ctx.textAlign = "center";
					text = "GAMEOVER".split("").join(String.fromCharCode(8194));
					ctx.fillText( text, oApplication.width / 2, oApplication.height / 2 - 15 );
					ctx.fillStyle = BEIGE;
					ctx.font = "12PX Lato";
					text = ("YOU BROKE " + iScore + " BRICKS. CLICK TO PLAY AGAIN." ).split("").join(String.fromCharCode(8194));
					ctx.fillText(text, oApplication.width / 2, oApplication.height / 2 + 20);
					ctx.font = "10px 'Lato Black'";
					ctx.fillStyle = RED;
					text = "CODE BY ADRIEN LELOUP".split("").join(String.fromCharCode(8196));
					ctx.fillText( text, oApplication.width / 2, oApplication.height / 1.2);
				} else {
					ctx.fillStyle = WHITE;
					ctx.font = "16px 'Lato Black'";
					ctx.textAlign = "center";
					text = "BREAKOUT".split("").join(String.fromCharCode(8194));
					ctx.fillText( text, oApplication.width / 2, oApplication.height / 2 - 15 );
					ctx.fillStyle = BEIGE;
					text = "CLICK TO START".split("").join(String.fromCharCode(8194));
					ctx.fillText(text, oApplication.width / 2, oApplication.height / 2 + 20);
					ctx.font = "10px 'Lato Black'";
					ctx.fillStyle = RED;
					text = "CODE BY ADRIEN LELOUP".split("").join(String.fromCharCode(8196));
					ctx.fillText( text, oApplication.width / 2, oApplication.height / 1.2);
				}

			},
			"update": function() {
				oMenu.bricks.forEach( function( element ){
					element.y += element.fallingSpeed * speedModifier;
					if( respawnBricks ){
						if( element.y > oApplication.height ){
							element.x = ~~( Math.random() * oApplication.width );
							element.y = - element.height;
						}
					}
				} );
			}
		};

		// prepare things before we start
		var init = function() {
			console.log( "Initialising game" );
			// Draw background
			oBackground.render();
			// Generate bricks
			fGenerateBricks();
			// Show start screen
			fShowStartscreen();

		};

		// start game
		var start = function() {
			window.cancelAnimationFrame( iMenuAnimationRequestId );
			oApplication.context.clearRect( 0, 0, oApplication.width, oApplication.height );
			console.log( "Starting game!" );
			// listen to arrow keys to trigger platform movement
			window.addEventListener( "keydown", oPlatform.update );
			window.addEventListener( "mousemove", oPlatform.update );
			oApplication.canvas.removeEventListener( "click", start );
			fAnimationLoop();
		};

		var fGenerateBricks = function() {
			var iPaddingX = 120, 
				iPaddingY = 30, 
				iXOffset = iPaddingX, 
				iYOffset = iPaddingY, 
				topBrickCount = 8, 
				lineNumber = 1, 
				maxLines = 8,
				speciality, 
				k = 0;
			console.log( "Generating bricks:" );
			for( var i = 1; i <= topBrickCount ; i++ ){
				speciality = "none";
				k++;
				if( k <= 19 ){
					speciality = "harder";
				}
				if( k === 15 ){
					speciality = "faster";
				}
				if( k === 20 || k === 30 ){
					speciality = "slower";
				}
				if( k === 1 ){
					speciality = "shorter";
				}
				if( k === 24 ){
					speciality = "shorter";
				}

				aBricks.push( new Brick( iXOffset, iYOffset, speciality ) );
				console.log( "Created a brick!" );

				if( i === topBrickCount ){
					iXOffset =  iPaddingX + lineNumber * ( ( aBricks[0].width / 2 ) + ( ( BRICKWIDTH + BRICKXMARGIN ) - aBricks[0].width ) / 2 );
					iYOffset += ( BRICKHEIGHT + BRICKYMARGIN );
					lineNumber++;
					topBrickCount--;
					if( lineNumber <= maxLines ){
						i = 0;
					}
				} else {
					iXOffset += ( BRICKWIDTH + BRICKXMARGIN );
				}
			}
			console.log("Done! Ready to start...");
		};

		var fCheckCanvasHitzones = function() {
			var side = null;
			// Hitting left side of canvas
			if( oProjectile.x <= 0 ){
				side = "left";
				fRebound( side );
			}
			// Hitting top side of canvas
			if( oProjectile.y <= 0 ){
				side = "top";
				fRebound( side );
			}
			// Hitting right side of canvas
			if( oProjectile.x + oProjectile.size >= oSourceCanvasRect.width ){
				side = "right";
				fRebound( side );
			}
			// Hitting bottom side of canvas
			if( oProjectile.y + oProjectile.size > oSourceCanvasRect.height ){
				fGameOver();
			}
		};

		var fCheckHitzones = function( element, isBrick ) {
			/*
				x and y represent the top left of the brick's hitzone.
				xx and yy represent the bottom right of the brick's hitzone.
				The hitzone for a brick is bigger than the brick itself. It is equal to the size of the brick,
				plus half the size of the projectile, so that I can detect contact with the projectile's center (cx and cy).
				I move the projectile's reference point (px and py) based on it's angle, so I can easily do my calculations later.
				Example: If the projectile is moving in a top/right direction (45 degree angle), the ref point will be the top right corner,
				as the next contact with a brick can only occur through the top or right side of the projectile.
			*/
			var x, xx, y, yy, cx, cy, px, py, distX, distY;
			// Moving the projectile's reference point
			switch( oProjectile.angle ){
				case 45:
					px = oProjectile.x + oProjectile.size;
					py = oProjectile.y;
					break;
				case -45:
					px = oProjectile.x;
					py = oProjectile.y;
					break;
				case 135:
					px = oProjectile.x + oProjectile.size;
					py = oProjectile.y + oProjectile.size;
					break;
				case -135:
					px = oProjectile.x;
					py = oProjectile.y + oProjectile.size;
					break;
			}

				// hitbox
				x = element.x - oProjectile.size / 2;
				y = element.y - oProjectile.size / 2;
				xx = x + element.width + oProjectile.size;
				yy = y + element.height + oProjectile.size;

				if( ( oProjectile.cx > x && oProjectile.cx < xx ) && ( oProjectile.cy > y && oProjectile.cy < yy ) ) {
					// We have contact with the brick
					if( oProjectile.angle === -45 ){
						/*
							If the angle is -45 (top left direction), we can only touch the brick's bottom or right side
							We calculate the ref point's distance from the bottom and right sides of the brick.
						*/
						distX = ( element.x + element.width ) - px;
						distY = ( element.y + element.height ) - py;
						if( distX >= distY ){
							// We touched the brick's bottom.
							fRebound( 'top' );
						} else {
							// alert('On entre par la droite');
							fRebound('left');
						}
					} else if( oProjectile.angle === 45 ){
						distX = px - element.x;
						distY = ( element.y + element.height ) - py;
						if( distX >= distY ){
							// alert('On entre par le bas');
							fRebound( 'top' );
						} else {
							// alert('On entre par la gauche');
							fRebound('right');
						}
					} else if( oProjectile.angle === 135 ){
						distX = px - element.x;
						distY = py - element.y;
						if( distX >= distY ){
							// alert('On entre par le haut');
							fRebound( 'bottom' );
						} else {
							// alert('On entre par la gauche');
							fRebound('right');
						}
					} else if( oProjectile.angle === -135 ){
						distX = ( element.x + element.width ) - px;
						distY = py - element.y;
						if( distX >= distY ){
							// alert('On entre par le haut');
							fRebound( 'bottom' );
						} else {
							// alert('On entre par la droite');
							fRebound('left');				
						}
					}

					if( isBrick ){
						element.hits++;
						fBrickReact( element );
					}


				}
		};

		var fBrickReact = function( element ){
			if( element.hits === element.maxHits ){
				switch( element.speciality ){
					case "shorter":
						oPlatform.width = PLATFORMWIDTH / 2;
						oPlatform.x += PLATFORMWIDTH / 4;
						iShorterStartedTime = ( new Date() ).getTime();
						break;
					case "faster":
						oProjectile.speed += 2;
						iFasterStartedTime = ( new Date() ).getTime();
						( oProjectile.speed > PROJECTILEMAXSPEED ) && ( oProjectile.speed = PROJECTILEMAXSPEED );
						console.log("Increasing speed. New speed = " + oProjectile.speed );
						break;
					case "slower":
						oProjectile.speed -= 2;
						iSlowerStartedTime = ( new Date() ).getTime();
						( oProjectile.speed < PROJECTILEMINSPEED ) && ( oProjectile.speed = PROJECTILEMINSPEED );
						console.log( "Decreasing speed. New speed = " + oProjectile.speed );
						break;
					case "bigger":
						oProjectile.size += 25;
						iBiggerStartedTime = ( new Date() ).getTime();
						( oProjectile.size > PROJECTILEMAXSIZE ) && ( oProjectile.size = PROJECTILEMAXSIZE );
						break;
					default:
						break;
				}
				iScore++;
				aBricks.splice(aBricks.indexOf(element), 1);
			}
		};

		var fRebound = function( side ){

			if( oProjectile.angle === -45 && side === "left" ){
				oProjectile.angle = 45;
			} else if( oProjectile.angle === -135 && side === "left" ){
				oProjectile.angle = 135;
			} else if( oProjectile.angle === 45 && side === "top" ){
				oProjectile.angle = 135;
			} else if( oProjectile.angle === -45 && side === "top" ){
				oProjectile.angle = -135;
			} else if( oProjectile.angle === 45 && side === "right" ){
				oProjectile.angle = -45;
			} else if( oProjectile.angle === 135 && side === "right" ){
				oProjectile.angle = -135;
			} else if( oProjectile.angle === -135 && side === "bottom" ){
				oProjectile.angle = -45;
			} else if( oProjectile.angle === 135 && side === "bottom" ){
				oProjectile.angle = 45;
			}

		};

		var fShowStartscreen = function() {
			// Initialise menu
			oMenu.init();
		};

		// Called at each animation frame request
		var fAnimationLoop = function() {
			if( !hasLost ){
				iAnimationRequestId = window.requestAnimationFrame( fAnimationLoop );

				// Verify effects duration
				iTime = ( new Date() ).getTime();
				if( oProjectile.size !== PROJECTILESIZE && iTime - iBiggerStartedTime > EFFECTDURATION ){
					oProjectile.size = PROJECTILESIZE;
				}
				if( oPlatform.width !== PLATFORMWIDTH && iTime - iShorterStartedTime > EFFECTDURATION ){
					oPlatform.width = PLATFORMWIDTH;
					oPlatform.x -= PLATFORMWIDTH / 4;
				}
				if( oProjectile.speed < PROJECTILESPEED && ( iTime - iSlowerStartedTime > EFFECTDURATION ) ){
					console.log( 'Resetting speed to ' + PROJECTILESPEED );
					oProjectile.speed = PROJECTILESPEED;
				}
				if( oProjectile.speed > PROJECTILESPEED && ( iTime - iFasterStartedTime > EFFECTDURATION ) ){
					console.log( 'Resetting speed to ' + PROJECTILESPEED );
					oProjectile.speed = PROJECTILESPEED;
				}
				// clear canvas
				oApplication.context.clearRect( 0, 0, oApplication.width, oApplication.height );
				// draw background
				oBackground.render();
				// update & draw bricks
				for( var i=0; i < aBricks.length; i+=2 ){
					aBricks[ i ].update();
				}

				if( aBricks.length === 0 ){
					fGameWon();
				}

				// render platform
				oPlatform.render();
				// update projectile
				oProjectile.update();
			}
		};

		// Game over
		var fGameOver = function() {
			speedModifier = 5;
			console.log( "You lost! Score: " + iScore );
			respawnBricks = false;
			hasLost = true;
			oMenu.bricks = aBricks;
			oMenu.animate();
			window.cancelAnimationFrame( iAnimationRequestId );
			oApplication.canvas.addEventListener( "click", fReset );
		};

		var fGameWon = function() {
			speedModifier = 1;
			hasWon = true;
			console.log( "You won!" );
			oMenu.init();
			window.cancelAnimationFrame( iAnimationRequestId );
			oApplication.canvas.addEventListener( "click", fReset );
		};

		var fReset = function() {
			oProjectile.x = oApplication.canvas.width / 2 - PROJECTILESIZE / 2;
			oProjectile.y = oApplication.canvas.height - 45;
			oProjectile.angle = -45;
			oProjectile.speed = PROJECTILESPEED;
			oPlatform.width = PLATFORMWIDTH;
			window.removeEventListener( "keydown", oPlatform.update );
			iScore = 0;
			hasLost = false;
			hasWon = false;
			aBricks = [];
			fGenerateBricks();
			start();
			oApplication.canvas.removeEventListener( "click", fReset );
		};

		oSpriteSheet = new Image();
		oSpriteSheet.addEventListener( "load", init );
		oSpriteSheet.src = sSpriteSheetSrc;
		oApplication.canvas.addEventListener( "click", start );
	};

} )();