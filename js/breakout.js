// Code principal
( function(){
	"use strict";

	window.Breakout = function( oApplication ){

		// Global params
		var iAnimationRequestId = 0,
			aBricks = [];

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

		var oPlatform = {
			"width": 100,
			"height": 10,
			"init": function(){},
			"update": function(){},
			"render": function(){}
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
				iXSpacing = 40;
			console.log( "Generating bricks!" );
			for( var i = 1; i <= topBrickCount ; i++ ){
				aBricks.push( new Brick( iXOffset, iYOffset ) );
				console.log( "Created a brick!" );

				if( i == topBrickCount ){
					iXOffset =  iPaddingX + lineNumber * ( ( aBricks[0].iWidth / 2 ) + ( iXSpacing - aBricks[0].iWidth ) / 2 );
					iYOffset += 25;
					lineNumber++;
					topBrickCount--;
					if( lineNumber <= maxLines ){
						i = 0;
					}
				} else {
					iXOffset += iXSpacing;
				}
			}
		};

		var fShowStartscreen = function() {
			var ctx = oApplication.context;
			ctx.fillStyle = "white";
			ctx.font = "700 36px 'Avenir Next'";
			ctx.textAlign = "center";
			ctx.fillText("CLICK TO START", oApplication.width / 2, oApplication.height / 2);
		}

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
			oPlatform.update();

			oPlatform.render();
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


		// TODO: Modifier la position de platform
		window.addEventListener( "keypress", function( e ){
			if( e.keyCode == 37 ){
				// Left key
				console.log( "Left" );

			} else if( e.keyCode == 39 ) {
				// Right key
				console.log( "Right" );
			}
		} );

	};

} )();