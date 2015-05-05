// Code principal
( function(){
	"use strict";

	window.Breakout = function( oApplication ){

		// Global params
		var iAnimationRequestId = 0,
			aBricks = [],
			oSourceCanvasRect = oApplication.canvas.getBoundingClientRect();

		// Background
		var oBackground = {
			"color": "black",
			"render": function() {
				oApplication.context.fillStyle = this.color;
				oApplication.context.fillRect( 0, 0, oApplication.width, oApplication.height );
			}
		};

		// Bricks
		var Brick = function( iX, iY ) {
			this.width = 30;
			this.height = 8;
			this.x = iX;
			this.y = iY;
		};

		Brick.prototype.render = function() {
			oApplication.context.fillStyle = "crimson";
			aBricks.forEach( function( element ) {
				oApplication.context.fillRect( element.x, element.y, element.width, element.height );
			} );
		};

		Brick.prototype.update = function() {
			this.render();
		};

		Brick.spacing = 40;

		var oPlatform = {
			"width": 100,
			"height": 10,
			"color": "white",
			"speed": 30,
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
				}
			},
			"render": function(){
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( this.posX, this.posY, this.width, this.height );
			}
		};

		var oProjectile = {
			"color": "#00CC66",
			"size": 15,
			"speed": 3,
			"posX": oApplication.canvas.width / 2 - 15 / 2,
			"posY": oApplication.canvas.height - 45,
			"angle": 45,
			"update": function() {
				// Movement
				var newX, newY;

				// Hitting left side of canvas
				if( this.posX <= 0 ){
					if( this.angle == -45 ){
						this.angle = 45;
					} else if( this.angle == -135 ){
						this.angle = 135;
					}
				}
				// Hitting top side of canvas
				if( this.posY <= 0 ){
					if( this.angle == 45 ){
						this.angle = 135;
					} else if( this.angle == -45 ){
						this.angle = -135;
					} else if ( this.angle = 0 ) {
						this.angle = 180;
					}
				}
				// Hitting right side of canvas
				if( this.posX + this.size >= oSourceCanvasRect.width ){
					if( this.angle == 45 ){
						this.angle = -45;
					} else if( this.angle == 135 ){
						this.angle = -135;
					} 
				}
				// Hitting bottom side of canvas
				if( this.posY + this.size > oSourceCanvasRect.height ){
					fGameOver();
				}

				// Hitting top side of platform
				if( this.posY + this.size >= oPlatform.posY && this.posX > oPlatform.posX - this.size && this.posX + this.size <= oPlatform.posX + oPlatform.width  ){
					if( this.angle == 135 ){
						this.angle = 45;
					} else if( this.angle == -135 ){
						this.angle = -45;
					}
				}

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
				maxLines = 8;
			console.log( "Generating bricks:" );
			for( var i = 1; i <= topBrickCount ; i++ ){
				aBricks.push( new Brick( iXOffset, iYOffset ) );
				console.log( "Created a brick!" );

				if( i == topBrickCount ){
					iXOffset =  iPaddingX + lineNumber * ( ( aBricks[0].width / 2 ) + ( Brick.spacing - aBricks[0].width ) / 2 );
					iYOffset += 25;
					lineNumber++;
					topBrickCount--;
					if( lineNumber <= maxLines ){
						i = 0;
					}
				} else {
					iXOffset += Brick.spacing;
				}
			}
			console.log("Done! Ready to start...");
		};

		var fCheckBricksHitzones = function() {
			aBricks.forEach( function( element, index, array ){
				if( oProjectile.posY <= element.y + element.height && oProjectile.posX >= element.x && oProjectile.posX + oProjectile.size >= element.x && oProjectile.posX + oProjectile.size <= element.x + element.width && oProjectile.posY > element.y ){
					// Projectile top hits brick's bottom
					aBricks.splice(aBricks.indexOf(element), 1);
				} else if ( oProjectile.posY + oProjectile.size >= element.y && oProjectile.posX >= element.x  && oProjectile.posX + oProjectile.size >= element.x && oProjectile.posX + oProjectile.size <= element.x + element.width && oProjectile.posY <= element.y + element.height ){
					// Projectile's bottom hits brick's top
					aBricks.splice(aBricks.indexOf(element), 1);
				} else if ( ((oProjectile.posY >= element.y + element.height && oProjectile.posY + oProjectile.size >= element.y + element.height && oProjectile.posY < element.y + element.height ) 
							|| ( oProjectile.posY <= element.y && oProjectile.posY + oProjectile.size <= element.y + element.height && oProjectile.posY + oProjectile.size > element.y ) ) 
							&& ( oProjectile.posX <= element.x + element.width && oProjectile.posX >= element.x )  ) {
					// Projectile's left hits brick's right
					aBricks.splice(aBricks.indexOf(element), 1);
				}
			} );
		};

		var fShowStartscreen = function() {
			var ctx = oApplication.context;
			ctx.fillStyle = "white";
			ctx.font = "700 36px 'Avenir Next'";
			ctx.textAlign = "center";
			ctx.fillText("CLICK TO START", oApplication.width / 2, oApplication.height / 2);
			ctx.font = "500 12px 'Avenir Next'";
			ctx.textAlign = "center";
			ctx.fillText("Code by Adrien Leloup, 2284", oApplication.width / 2, oApplication.height / 1.2);
		};

		// Called at each animation frame request
		var fAnimationLoop = function() {
			iAnimationRequestId = window.requestAnimationFrame( fAnimationLoop );
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