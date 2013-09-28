ig.module( 
	'game.entities.node' 
)
.requires(
	'impact.entity',
	'game.enums'
)
.defines(function(){

EntityNode = ig.Entity.extend({
	size: { x: 0, y: 0 },
	team: Color.gray,
	virus: 0,
	vaccine: 0,
	data: 5,
	threads: 0,
	threadCost: 1,
	production: 0,
	backbuffer: ig.$new( 'canvas' ),
	backbufferCtx: null,
	timer: null,
	iconTimer: null,
	productionTimer: null,
	animSheet: new ig.AnimationSheet( 'media/icons.png', 36, 36 ),

	virusAlpha: 0,
	vaccineAlpha: 0,
	virusRad: 0,
	vaccineRad: 0,
	dataRad: 0,
	dataVal: 0,
	threadAngle: 0,
	threadSlice: 0,
	threadAlpha: 0,
	threadMenu: false,


	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.timer = new ig.Timer();
		this.iconTimer = new ig.Timer();
		this.productionTimer = new ig.Timer();

        this.addAnim( 'idle', 1, [0] );
        this.addAnim( 'data', 1, [0] );
        this.addAnim( 'vaccine', 1, [1] );
        this.addAnim( 'virus', 1, [2] );
        this.addAnim( 'thread', 1, [3] );

		this.backbuffer.width = this.backbuffer.height = 1024;
		this.backbufferCtx = this.backbuffer.getContext( '2d' );

		this.threadSlice = this.threads;
		this.iconTimer.set( -2 );

		var self = this;
		setInterval( function() { 
			//debug
		}, 1000 );
	},


	distanceToPoint: function( point ) {
		var xs = 0;
		var ys = 0;

		xs = point.x - this.pos.x;
		xs = xs * xs;

		ys = point.y - this.pos.y;
		ys = ys * ys;

		return Math.sqrt( xs + ys );
	},
	

	update: function() {
		this.parent();


		// produce

		if( this.productionTimer.delta() > 15 ) {
			if( this.production === 1 ) this.data += this.threads;
			if( this.production === 2 ) this.vaccine += this.threads;
			if( this.production === 3 ) this.virus += this.threads;

			this.productionTimer.reset();
		}


		// ui / input

		var r1 = 35 + Math.min((this.dataRad-5),100);
		var r2 = this.vaccine !== 0 ? 5 + Math.min((this.vaccineRad),80) + r1 : r1;
		var r3 = this.virus !== 0 ? 5 + Math.min((this.virusRad),150) + r2 : r2;

		// down
		if( this.team === ig.game.playerColor ) {
			this.threadCost = this.threads * this.threads;
			if( ig.input.pressed( 'action' ) ) {
				if( this.threadMenu && this.distanceToPoint( ig.input.mouse ) < r1 ) {
					if( this.data > this.threadCost  && this.data >= 5+this.threadCost ) {
						this.data -= this.threadCost;
						this.threads++;
					}
				}
				if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
					this.timer.reset();
					this.threadCanOpen = true;
				}
				else if( this.distanceToPoint( ig.input.mouse ) < r3 && this.distanceToPoint( ig.input.mouse ) > r2 ) {
					// down virus
				}

				if( this.distanceToPoint( ig.input.mouse ) > r1 ) {
					this.threadMenu = false;
					this.threadCanOpen = false;
				}
			}
		}

		// hold
		if( ig.input.state( 'action' ) ) {
			if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
				if( this.threadCanOpen && this.timer.delta() >= 0.5 && !this.threadMenu ) {  
					this.threadMenu = true;
				}
			}
		}

		// up
		if( ig.input.released( 'action' ) ) {
			if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
				if( !this.threadMenu && this.timer.delta() < 0.5 ) { 
					this.production++;
					if( this.production > 3 ) this.production = 0;
					this.iconTimer.set(0);
				}
			}
			else if( this.distanceToPoint( ig.input.mouse ) < r3 && this.distanceToPoint( ig.input.mouse ) > r2 ) {
				// up virus
			}
		}

		// hover 
		if( this.distanceToPoint( ig.input.mouse ) < r1 ) {

		}


		// current icon
		this.currentAnim = 
			this.production === 0 ? this.anims.idle :
			this.production === 1 ? this.anims.data :
			this.production === 2 ? this.anims.vaccine :
								    this.anims.virus;
	},
	

	draw: function() {

		// animations

		if( this.virusRad < this.virus ) this.virusRad+=0.5;
		else if( this.virusRad > this.virus ) this.virusRad-=0.5;
		this.virusRad.limit( 0, this.virus );

		if( this.vaccineRad < this.vaccine ) this.vaccineRad+=0.5;
		else if( this.vaccineRad > this.vaccine ) this.vaccineRad-=0.5;
		this.virusRad.limit( 0, this.vaccine );

		if( this.dataRad < this.data ) this.dataRad+=0.5;
		else if( this.dataRad > this.data ) this.dataRad-=0.5;
		this.virusRad.limit( 0, this.data );

		this.threadAngle = this.threadAngle >= 360 ? 0 : this.threadAngle+Math.min( 1.5, Math.max(0.1, this.dataRad*0.0035) );

		this.lastSlice = this.threadSlice;
		if( this.threadSlice < this.threads ) this.threadSlice+=0.05;
		else if( this.threadSlice > this.threads ) this.threadSlice-=0.05;
		if( (this.lastSlice < this.threads && this.threadSlice >= this.threads) ||
		    (this.lastSlice > this.threads && this.threadSlice <= this.threads) ) {
			this.threadSlice = this.threads;
		}

		this.lastVal = this.dataVal;
		if( this.dataVal < this.data ) this.dataVal++;
		else if( this.dataVal > this.data ) this.dataVal--;
		if( (this.lastVal < this.data && this.dataVal >= this.data) ||
		    (this.lastVal > this.data && this.dataVal <= this.data) ) {
			this.dataVal = this.data;
		}



		var w = this.backbuffer.width/2;
		var r1 = 35 + Math.min((this.dataRad-5),100);
		var r2 = this.vaccine !== 0 ? 5 + Math.min((this.vaccineRad),125) + r1 : r1;
		var r3 = this.virus !== 0 ? 5 + Math.min((this.virusRad),200) + r2 : r2;

		var ctx = this.backbufferCtx;
		ctx.globalAlpha = 1;

		// virus
		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		if( this.virus > 0 ) {
			this.virusAlpha = Math.min( this.virusAlpha+0.05, 1 );

			// virus
			ctx.fillStyle = ctx.strokeStyle = this.team;
			ctx.lineWidth = 2;

			ctx.beginPath();
			ctx.arc( w, w, r3, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = this.virusAlpha.map( 0, 1, 0, 0.5 );
			ctx.fill();
			ctx.restore();

			ctx.save();
			ctx.globalAlpha = this.virusAlpha;
			ctx.stroke();
			ctx.restore();

			// cut out
			ctx.beginPath();
			ctx.arc( w, w, r2, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fill();
			ctx.restore();

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}
		else {
			this.virusAlpha = 0;
		}


		// vaccine
		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		if( this.vaccine > 0 ) {
			this.vaccineAlpha = Math.min( this.vaccineAlpha+0.05, 1 );

			ctx.fillStyle = ctx.strokeStyle = Color.black;
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.arc( w, w, r2-1, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = this.vaccineAlpha.map( 0, 1, 0, 0.35 );
			ctx.fill();
			ctx.restore();

			ctx.save();
			ctx.globalAlpha = this.vaccineAlpha.map( 0, 1, 0, 0.5 );
			ctx.stroke();
			ctx.restore();

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}
		else {
			this.vaccineAlpha = 0;
		}


		// data
		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		ctx.fillStyle = ctx.strokeStyle = this.team;
		ctx.beginPath();
		ctx.arc( w, w, r1, 0, Math.PI*2, true ); 
		ctx.closePath();
		ctx.fill();
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );


		// threads 
		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		if( this.threads > 0 ) {
			this.threadAlpha = Math.min( this.threadAlpha+0.05, 1 );
			var x, y, r = 8+Math.min((this.dataRad-5),100)*0.15;
			var slice = 360 / this.threadSlice;

			for( var i = 0; i < this.threads; i++ ) {
				if( this.threadSlice !== this.threads && i === this.threads-1 ) {
					slice = 360 / this.threads;
				}

				x = (r3) * Math.cos( (this.threadAngle+slice*i).toRad() ) + w;
				y = (r3) * Math.sin( (this.threadAngle+slice*i).toRad() ) + w;

				ctx.fillStyle = ctx.strokeStyle = this.team;
				ctx.beginPath();
				ctx.arc( x, y, Math.min(r,15), 0, Math.PI*2, true ); 
				ctx.closePath();
				if( this.threadSlice !== this.threads && i === this.threads-1 ) {
					ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, 0.7 );
				}
				else {
					ctx.globalAlpha = this.threadAlpha.map( 0, 1, 0, 0.7 );
				}
				ctx.fill();
				ctx.restore();
			}

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}
		else {
			this.threadAlpha = 0;
		}


		// draw thread buy menu
		if( this.threadMenu ) {
			ig.game.fonts.lato.draw( 
				(this.dataVal-5) + ' (' + this.threadCost + ')', 
				this.pos.x, 
				this.pos.y-(ig.game.fonts.lato.heightForString(this.data.toString())*0.5)+1-26,
				ig.Font.ALIGN.CENTER
			);
			this.anims.thread.draw( this.pos.x-18, this.pos.y-19 );
		}

		// draw data value 
		else if( this.iconTimer.delta() >= 2 ) {
			ig.game.fonts.latoLight.draw( 
				this.dataVal, 
				this.pos.x, 
				this.pos.y-(ig.game.fonts.latoLight.heightForString(this.data.toString())*0.5)+1,
				ig.Font.ALIGN.CENTER
			);
		}

		// draw production icon
		else {
			if( this.production === 0 ) {
				ig.game.fonts.latoLight.draw( 
					'X', 
					this.pos.x, 
					this.pos.y-(ig.game.fonts.latoLight.heightForString(this.data.toString())*0.5)+1,
					ig.Font.ALIGN.CENTER
				);
			} else {
				this.currentAnim.draw( this.pos.x-18, this.pos.y-17 );
			}
		}
		
	}
});

});
