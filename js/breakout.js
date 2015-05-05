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
		var Brick = function( x, y ) {
			var iWidth, iHeight, iX, iY;
			this.iWidth = 30;
			this.iHeight = 8;
			this.iX = x;
			this.iY = y;
		};

		Brick.prototype.render = function() {
			oApplication.context.fillStyle = "crimson";
			aBricks.forEach( function( element ) {
				oApplication.context.fillRect( element.iX, element.iY, element.iWidth, element.iHeight );
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
			"init": function(){
			},
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
			"speed": 5,
			"posX": oApplication.canvas.width / 2 - 15 / 2,
			"posY": oApplication.canvas.height - 45,
			"angle": -45,
			"update": function() {
				// TODO: movement
				var newX, newY;

				// Si on touche le bord gauche du canvas
				if( this.posX <= 0 ){
					if( this.angle == -45 ){
						this.angle = 45;
					} else if( this.angle == -135 ){
						this.angle = 135;
					}
				}
				// Si on touche le bord haut du canvas
				if( this.posY <= 0 ){
					if( this.angle == 45 ){
						this.angle = 135;
					} else if( this.angle == -45 ){
						this.angle = -135;
					} else if ( this.angle = 0 ) {
						this.angle = 180;
					}
				}
				// Si on touche le bord droit du canvas
				if( this.posX + this.size >= oSourceCanvasRect.width ){
					if( this.angle == 45 ){
						this.angle = -45;
					} else if( this.angle == 135 ){
						this.angle = -135;
					} 
				}
				// Si on touche le bord bas du canvas
				if( this.posY + this.size > oSourceCanvasRect.height ){
					fGameOver();
				}

				// Si on touche le bord haut de la plateforme
				if( this.posY + this.size >= oPlatform.posY && this.posX > oPlatform.posX - this.size && this.posX + this.size <= oPlatform.posX + oPlatform.width ){
					if( this.angle == 135 ){
						this.angle = 45;
					} else if( this.angle == -135 ){
						this.angle = -45;
					}
				}


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


		// start game
		var init = function() {
			console.log( "Initialising game" );
			// Draw background
			oBackground.render();
			// Generate bricks
			fGenerateBricks();
			// Draw platform
			oPlatform.init();

			fShowStartscreen();

		};

		var start = function() {
			console.log( "Starting game!" );
			// Modifier la position de platform
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
					iXOffset =  iPaddingX + lineNumber * ( ( aBricks[0].iWidth / 2 ) + ( Brick.spacing - aBricks[0].iWidth ) / 2 );
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
			// update platform
			oPlatform.render();
			// update projectile
			oProjectile.update();
		};

		// Game over
		var fGameOver = function() {
			window.cancelAnimationFrame( iAnimationRequestId );
			window.alert( "Perdu !" );
			// Relancer le jeu
			window.location.reload( true );
		};

		// init game: Loads the spritesheet, then launches a function when it's done loading.
		window.addEventListener( "load", init );
		oApplication.canvas.addEventListener( "click", start );


		

	};

} )();