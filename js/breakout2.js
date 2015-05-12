// Code principal
( function(){
	"use strict";

	window.Breakout = function( oApplication ){

		// Constants
		var EFFECTDURATION		= 3000;

		// (Bricks)
		var BRICKWIDTH 			= 30,
			BRICKHEIGHT 		= 8,
			BRICKXMARGIN 		= 10,
			BRICKYMARGIN 		= 20,
			DEFAULTBRICKCOLOR	= "crimson",
			HARDERCOLOR			= "#7F0000",
			WIDENERCOLOR		= "pink",
			FASTERCOLOR			= "yellow",
			SLOWERCOLOR			= "blue";

		// (Platform)
		var PLATFORMWIDTH 		= 100,
			PLATFORMHEIGHT 		= 10,
			PLATFORMCOLOR		= "white",
			PLATFORMSPEED 		= 30,
			PLATFORMMAXSPEED 	= 40,
			PLATFORMMINSPEED 	= 30;

		// (Projectile)
		var PROJECTILESIZE		= 15,
			PROJECTILEMAXSIZE	= 20,
			PROJECTILECOLOR		= "#00CC66",
			PROJECTILESPEED 	= 5,
			PROJECTILEMAXSPEED 	= 9,
			PROJECTILEMINSPEED	= 3;


		// Global params
		var iAnimationRequestId = 0,
			iScore = 0,
			aBricks = [],
			oSourceCanvasRect = oApplication.canvas.getBoundingClientRect(),
			iTime = null,
			iBiggerStartedTime = null,
			iShorterStartedTime = null,
			iSlowerStartedTime = null,
			iFasterStartedTime = null;

		// Background
		var oBackground = {
			"color": "black",
			"render": function() {
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( 0, 0, oApplication.width, oApplication.height );

				ctx.fillStyle = "crimson";
				ctx.textAlign = "left";
				ctx.font = "500 12px 'Avenir Next'";
				ctx.fillText("Briques détruites : " + iScore, 20, oApplication.height - 20);
			}
		};

		// Bricks
		var Brick = function( iX, iY, sSpeciality ) {
			this.width = 		BRICKWIDTH;
			this.height = 		BRICKHEIGHT;
			this.x = 			iX;
			this.y = 			iY;
			this.cx = 			iX + BRICKWIDTH / 2;
			this.cy = 			iY + BRICKHEIGHT / 2;
			this.color = 		DEFAULTBRICKCOLOR;
			this.hits = 		0;
			this.maxHits = 		1;
			this.speciality = 	sSpeciality;
			if( sSpeciality == "harder" ){
				this.color = HARDERCOLOR;
				this.maxHits = 3;
			} else if( sSpeciality == "shorter" ){
				this.color = WIDENERCOLOR;
			} else if( sSpeciality == "faster" ){
				this.color = FASTERCOLOR;
			} else if( sSpeciality == "slower" ){
				this.color = SLOWERCOLOR;
			}
		};

		Brick.prototype.render = function() {
			aBricks.forEach( function( element ) {
				if( element.hits == 1 ){
					oApplication.context.fillStyle = "#BF0000";
				} else if( element.hits == 2 ){	
					oApplication.context.fillStyle = "crimson";
				} else {
					oApplication.context.fillStyle = element.color;
				}
				oApplication.context.fillRect( element.x, element.y, element.width, element.height );
			}, this );
		};

		Brick.prototype.update = function() {
			this.render();
		};

		var oPlatform = {
			"width": PLATFORMWIDTH,
			"height": PLATFORMHEIGHT,
			"color": PLATFORMCOLOR,
			"speed": PLATFORMSPEED,
			"posX": oApplication.canvas.width / 2 - 50,
			"posY": oApplication.canvas.height - 30,
			"update": function( oEvent ){
				if( oEvent.keyCode == 37 ){
					// Left key
					this.posX-=this.speed;
					( this.posX < 0 ) && ( this.posX = 0 );
					
				} else if( oEvent.keyCode == 39 ) {
					// Right key
					this.posX+=this.speed;
					( this.posX > oSourceCanvasRect.width - this.width ) && ( this.posX = oSourceCanvasRect.width - this.width  );
				} else if ( oEvent.keyCode == 40 ){
					oProjectile.speed -= 5;
				} else if ( oEvent.keyCode == 38 ){
					oProjectile.speed += 5;
				}
			},
			"render": function(){
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( this.posX, this.posY, this.width, this.height );
			}
		};

		var oProjectile = {
			"color": 	PROJECTILECOLOR,
			"size": 	PROJECTILESIZE,
			"speed": 	PROJECTILESPEED,
			"posX": 	oApplication.canvas.width / 2 - PROJECTILESIZE / 2,
			"posY": 	oApplication.canvas.height - 45,
			"cx": 		0,
			"cy": 		0,
			"angle": 	-45,
			"update": function() {
				// Movement
				var newX, newY, side;
				this.cx = this.posX + this.size / 2;
				this.cy = this.posY + this.size / 2;

				// Hitting left side of canvas
				if( this.posX <= 0 ){
					side = "left";
					fRebound( side );
				}
				// Hitting top side of canvas
				if( this.posY <= 0 ){
					side = "top";
					fRebound( side );
				}
				// Hitting right side of canvas
				if( this.posX + this.size >= oSourceCanvasRect.width ){
					side = "right";
					fRebound( side );
				}
				// Hitting bottom side of canvas
				if( this.posY + this.size > oSourceCanvasRect.height ){
					fGameOver();
				}

				fCheckPlatformHitzones();

				fCheckBricksHitzones();

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

				this.posX += newX * this.speed;
				this.posY += newY * this.speed;

				this.render();
			},
			"render": function() {
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				//ctx.arc( this.posX + this.size, this.posY + this.size, this.size, 0, Math.PI * 2, true );
				ctx.fillRect( this.posX, this.posY, this.size, this.size );
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
			console.log( "Starting game!" );
			// listen to arrow keys to trigger platform movement
			window.addEventListener( "keypress", oPlatform.update.bind( oPlatform ) );
			oApplication.canvas.removeEventListener( "click", start );
			fAnimationLoop();
		};

		var fGenerateBricks = function() {
			var iPaddingX = 150, 
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
				if( k == 15 ){
					speciality = "faster";
				}
				if( k == 20 || k == 30 ){
					speciality = "slower";
				}
				if( k == 1 ){
					speciality = "bigger";
				}
				if( k == 24 ){
					speciality = "shorter";
				}

				aBricks.push( new Brick( iXOffset, iYOffset, speciality ) );
				console.log( "Created a brick!" );

				if( i == topBrickCount ){
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

		var fCheckPlatformHitzones = function() {
			// Hitting top side of platform
			if( oProjectile.posY + oProjectile.size >= oPlatform.posY && oProjectile.posX > oPlatform.posX - oProjectile.size && oProjectile.posX + oProjectile.size <= oPlatform.posX + oPlatform.width ){
				fRebound( 'bottom' );
			}
		}

		var fCheckBricksHitzones = function() {
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
			if( oProjectile.angle == 45 ){
				px = oProjectile.posX + oProjectile.size;
				py = oProjectile.posY;
			} else if ( oProjectile.angle == -135 ){
				px = oProjectile.posX;
				py = oProjectile.posY + oProjectile.size;
			} else if ( oProjectile.angle == 135 ){
				px = oProjectile.posX + oProjectile.size;
				py = oProjectile.posY + oProjectile.size;
			} else if ( oProjectile.angle == -45 ){
				px = oProjectile.posX;
				py = oProjectile.posY;
			}

			aBricks.forEach( function( element ){

				// Brick hitbox
				x = element.x - oProjectile.size / 2;
				y = element.y - oProjectile.size / 2;
				xx = x + element.width + oProjectile.size;
				yy = y + element.height + oProjectile.size;

				if( ( oProjectile.cx > x && oProjectile.cx < xx ) && ( oProjectile.cy > y && oProjectile.cy < yy ) ) {
					// We have contact with the brick

					if( oProjectile.angle == -45 ){
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

					} else if( oProjectile.angle == 45 ){

						distX = px - element.x;
						distY = ( element.y + element.height ) - py;

						if( distX >= distY ){
							// alert('On entre par le bas');
							fRebound( 'top' );
						} else {
							// alert('On entre par la gauche');
							fRebound('right');
						}

					} else if( oProjectile.angle == 135 ){

						distX = px - element.x;
						distY = py - element.y;

						if( distX >= distY ){
							// alert('On entre par le haut');
							fRebound( 'bottom' );
						} else {
							// alert('On entre par la gauche');
							fRebound('right');
						}

					} else if( oProjectile.angle == -135 ){

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
					element.hits++;

					fBrickReact( element );

				}
					
			} );
		};

		var fBrickReact = function( element ){
			if( element.hits == element.maxHits ){
				switch( element.speciality ){
					case "shorter":
						oPlatform.width -= 50;
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
						console.log( iBiggerStartedTime );
						( oProjectile.size > PROJECTILEMAXSIZE ) && ( oProjectile.size = PROJECTILEMAXSIZE );
						break;
					default:
						break;
				}
				iScore++;
				aBricks.splice(aBricks.indexOf(element), 1);
			}
		}

		var fRebound = function( side ){

			if( oProjectile.angle == -45 && side == "left" ){
				oProjectile.angle = 45;
			} else if( oProjectile.angle == -135 && side == "left" ){
				oProjectile.angle = 135;
			} else if( oProjectile.angle == 45 && side == "top" ){
				oProjectile.angle = 135;
			} else if( oProjectile.angle == -45 && side == "top" ){
				oProjectile.angle = -135;
			} else if( oProjectile.angle == 45 && side == "right" ){
				oProjectile.angle = -45;
			} else if( oProjectile.angle == 135 && side == "right" ){
				oProjectile.angle = -135;
			} else if( oProjectile.angle == -135 && side == "bottom" ){
				oProjectile.angle = -45;
			} else if( oProjectile.angle == 135 && side == "bottom" ){
				oProjectile.angle = 45;
			}

		};

		var fShowStartscreen = function() {
			var ctx = oApplication.context;

			ctx.fillStyle = "cadetblue";
			ctx.fillRect( 0, 0, oApplication.canvas.width, oApplication.canvas.height );

			ctx.fillStyle = "white";
			ctx.font = "700 36px 'Avenir Next'";
			ctx.textAlign = "center";
			ctx.fillText("CLICK TO START", oApplication.width / 2, oApplication.height / 2);
			ctx.font = "500 12px 'Avenir Next'";
			ctx.fillText("Code by Adrien Leloup, 2284", oApplication.width / 2, oApplication.height / 1.2);
		};

		// Called at each animation frame request
		var fAnimationLoop = function() {
			iAnimationRequestId = window.requestAnimationFrame( fAnimationLoop );

			// Verify effects duration
			iTime = ( new Date() ).getTime();
			if( iTime - iBiggerStartedTime > EFFECTDURATION ){
				oProjectile.size = PROJECTILESIZE;
			}
			if( iTime - iShorterStartedTime > EFFECTDURATION ){
				oPlatform.width = PLATFORMWIDTH;
			}
			if( iTime - iSlowerStartedTime > EFFECTDURATION || iTime - iFasterStartedTime > EFFECTDURATION ){
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
			// render platform
			oPlatform.render();
			// update projectile
			oProjectile.update();
		};

		// Game over
		var fGameOver = function() {
			window.cancelAnimationFrame( iAnimationRequestId );
			window.alert( "Perdu !" );
			// Refresh to restart
			window.location.reload( true );
		};

		window.addEventListener( "load", init );
		oApplication.canvas.addEventListener( "click", start );
	};

} )();