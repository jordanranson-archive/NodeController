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
	dragPos: { x: 0, y: 0 },
	team: Color.gray,
	efficiency: 15,
	virus: 0,
	vaccine: 0,
	data: 5,
	threads: 0,
	threadCost: 1,
	production: 1,
	backbuffer: ig.$new( 'canvas' ),
	backbufferCtx: null,
	timer: null,
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
	threadCurAlpha: 0,
	threadMenu: false,
	uiAlpha: 0,
	uiLastAlpha: 0,
	uiCurAlpha: 0,
	attack: false,
	cost: 0,

	radius: 0,


	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.timer = new ig.Timer();
		this.productionTimer = new ig.Timer();

        this.addAnim( 'idle', 1, [0] );
        this.addAnim( 'thread', 1, [3] );

		this.backbuffer.width = this.backbuffer.height = 1024;
		this.backbufferCtx = this.backbuffer.getContext( '2d' );

		this.threadSlice = this.threads;

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


	drawCross: function() {
		ig.system.context.strokeStyle = Color.red;

		ig.system.context.beginPath();
		ig.system.context.moveTo( ig.input.mouse.x-7, ig.input.mouse.y-7 );
		ig.system.context.lineTo( ig.input.mouse.x+7, ig.input.mouse.y+7 );
		ig.system.context.closePath();
		ig.system.context.stroke();

		ig.system.context.beginPath();
		ig.system.context.moveTo( ig.input.mouse.x+7, ig.input.mouse.y-7 );
		ig.system.context.lineTo( ig.input.mouse.x-7, ig.input.mouse.y+7 );
		ig.system.context.closePath();
		ig.system.context.stroke();
	},


	drawArrow: function() {
		var dx = this.dragPos.y - ig.input.mouse.y;
		var dy = this.dragPos.x - ig.input.mouse.x;
		var angle = Math.atan2(dx,dy) + (90).toRad();

		ig.system.context.save();

		ig.system.context.strokeStyle = Color.green;
		ig.system.context.translate( ig.input.mouse.x, ig.input.mouse.y );
		ig.system.context.rotate( angle );

		ig.system.context.beginPath();
		ig.system.context.moveTo( -9, -9 );
		ig.system.context.lineTo( 0, 0 );
		ig.system.context.lineTo( 9, -9 );
		ig.system.context.stroke();

		ig.system.context.restore();
	},


	drawValueTooltip: function( color, value, viral ) {
		var dx = this.dragPos.y - ig.input.mouse.y;
		var dy = this.dragPos.x - ig.input.mouse.x; 
		var dist = Math.sqrt( dx * dx + dy * dy );
		var angle = Math.atan2(dx,dy) + (90).toRad();

		var x = (dist+32) * Math.cos( angle + (90).toRad() ) + this.dragPos.x;
		var y = (dist+32) * Math.sin( angle + (90).toRad() ) + this.dragPos.y;

		ig.system.context.save();

		ig.system.context.fillStyle = color;
		ig.system.context.strokeStyle = color;
		ig.system.context.lineWidth = 2;

		ig.system.context.beginPath();
		ig.system.context.globalAlpha = viral ? 0.5 : 0.7;
		ig.system.context.arc( x, y, 20, 0, Math.PI*2, true ); 
		ig.system.context.closePath();
		ig.system.context.fill();

		if( viral ) {
			ig.system.context.globalAlpha = 0.7;
			ig.system.context.stroke();
		}

		ig.game.fonts.latoSmall.draw( 
			value, 
			x, 
			y-(ig.game.fonts.lato.heightForString(value.toString())*0.5)+4,
			ig.Font.ALIGN.CENTER
		);

		ig.system.context.restore();
	},


	update: function() {
		this.parent();


		// produce

		if( this.productionTimer.delta() > this.efficiency ) {
			if( this.production === 1 ) this.data += this.threads;
			if( this.production === 2 ) this.vaccine += this.threads;
			if( this.production === 3 ) this.virus += this.threads;

			this.productionTimer.reset();
			this.threadAlpha = 1;
		}


		// ui / input

		var r1 = 20 + Math.min((this.dataRad-5),100);
		var r2 = this.vaccine !== 0 ? 5 + Math.min((this.vaccineRad),125) + r1 : r1;
		var r3 = this.virus !== 0 ? 5 + Math.min((this.virusRad),200) + r2 : r2;
		this.radius = r3;


		// down
		if( this.team === ig.game.playerColor ) {

			this.threadCost = this.threads * this.threads;
			if( ig.input.pressed( 'action' ) ) {

				// buy new thread
				if( this.threadMenu && this.distanceToPoint( ig.input.mouse ) < r1 ) {
					if( this.data > this.threadCost  && this.data >= 5+this.threadCost ) {
						this.data -= this.threadCost;
						this.threads++;
					}
				}

				// clicked on core
				if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
					this.timer.reset();
					this.threadCanOpen = true;
					this.dragType = 'core';
					this.dragPos = { x: ig.input.mouse.x, y: ig.input.mouse.y };
				}

				// clicked on virus
				else if( this.distanceToPoint( ig.input.mouse ) < r3 && this.distanceToPoint( ig.input.mouse ) > r2 ) {
					// TODO: attack
					this.timer.reset();
					this.dragType = 'virus';
					this.dragPos = { x: ig.input.mouse.x, y: ig.input.mouse.y };
				}

				// clicked outside of core
				if( this.distanceToPoint( ig.input.mouse ) > r1 ) {
					this.threadMenu = false;
					this.threadCanOpen = false;

					this.drawCoreDragUi = false;
					this.drawVirusDragUi = false;
				}
			}
		}

		// hold
		var dx = this.dragPos.y - ig.input.mouse.y;
		var dy = this.dragPos.x - ig.input.mouse.x; 
		var dist = Math.sqrt( dx * dx + dy * dy );
		var distCenter = this.distanceToPoint( ig.input.mouse );
		if( ig.input.state( 'action' ) ) {

			// open thread menu
			if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
				if( this.threadCanOpen && this.timer.delta() >= 0.5 && !this.threadMenu ) {  
					this.threadMenu = true;
				}
			} 

			// enable drag ui
			else {
				this.threadCanOpen = false;
				if( this.timer.delta() < 0.5 && !this.threadMenu && !this.dragStart ) {
					if( this.dragType === 'core' ) {
						this.dragStart = true;
					}
					if( this.dragType === 'virus' ) {
						this.dragStart = true;
					}
				}
			}

			// display drag ui
			if( this.dragStart ) {
				if( this.dragType === 'core' ) {
					this.drawCoreDragUi = true;
				}
				if( this.dragType === 'virus' ) {
					this.drawVirusDragUi = true;
				}
			}

			if( this.drawCoreDragUi || this.drawVirusDragUi ) {

				// far enough from core to expand
				var ent;
				if( this.dragType === 'core' && distCenter > r3+128 ) {
					this.cost = Math.ceil(dist/30);

					if( this.data-this.cost >= 5 ) this.canExpand = true;
					else this.canExpand = false;

					for( var i = 0; i < ig.game.entities.length; i++ ) {
						ent = ig.game.entities[i];
						if( ent !== this && ent.distanceToPoint( ig.input.mouse ) < ent.radius+128 ) {
							this.canExpand = false;
							this.cost = 0;
							break;
						}
					}
				}
				else if( this.dragType === 'virus' && dist > 1 ) {
					this.cost = Math.ceil(this.virus*(dist/this.radius));
					this.cost = Math.min( this.virus, this.cost );

					if( this.virus-this.cost >= 0 ) this.canExpand = true;
					else this.canExpand = false;
				}
				else { 
					this.canExpand = false;
					this.cost = 0;
				}
			}
		}

		// up
		if( ig.input.released( 'action' ) ) {

			// drag stop
			if( this.dragStart ) {
				if( this.dragType === 'core' ) {
					this.drawCoreDragUi = false;
					if( this.canExpand ) {
						ig.game.spawnEntity( 'EntityNode', ig.input.mouse.x, ig.input.mouse.y, { team: this.team, threads: 1, production: 3 } );
						this.data -= this.cost;
					}
				}
				if( this.dragType === 'virus' ) {
					if( this.canExpand && distCenter > r1 ) {
						this.attacking = true;
						this.attackPoints = new Float32Array( ((this.cost)<<0)*3 );

						var sin;
						slice = 360/((this.cost/2)<<0);
						for( var i = 0; i < this.attackPoints.length; i+=4 ) {
							x = 15 * Math.cos( (slice*i).toRad() );
							y = 15 * Math.sin( (slice*i).toRad() );

							//sin = Math.sin( new Date().getTime()/500 + (i*200) ) * 10;
							this.attackPoints[i] = x+ig.input.mouse.x;
							this.attackPoints[i+1] = y+ig.input.mouse.y;
							this.attackPoints[i+2] = Math.random();
							this.attackPoints[i+3] = Math.random();
						}

						console.log( this.attackPoints );
					}
					this.drawVirusDragUi = false;
				}
			}
			this.dragStart = false;

			if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
				if( this.threads > 0 && !this.threadMenu && this.timer.delta() < 0.5 ) { 
					this.production++;
					if( this.production > 3 ) this.production = 1;
				}
			}
			else if( this.distanceToPoint( ig.input.mouse ) < r3 && this.distanceToPoint( ig.input.mouse ) > r2 ) {
				// up virus
			}
		}

		// hover 
		if( this.distanceToPoint( ig.input.mouse ) < r1 ) {
			this.uiAlpha = 1;
			if( !ig.input.state( 'action' ) ) {
				this.zIndex = 100;
				ig.game.sortEntitiesDeferred();
			}
		} else {
			this.uiAlpha = 0;
			this.zIndex = 0;
		}



		// show ui if attacking

		if( this.drawVirusDragUi ) {
			this.uiAlpha = 1;
		}



		// current icon

		this.currentAnim = 
			this.production === 0 ? this.anims.idle :
			this.production === 1 ? this.anims.data :
			this.production === 2 ? this.anims.vaccine :
								    this.anims.virus;


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
		if( this.dataVal < this.data ) this.dataVal += Math.abs(this.data-this.dataVal)*0.1;
		else if( this.dataVal > this.data ) this.dataVal -= Math.abs(this.data-this.dataVal)*0.1;
		if( (this.lastVal < this.data && this.dataVal >= this.data) ||
		    (this.lastVal > this.data && this.dataVal <= this.data) ) {
			this.dataVal = this.data;
		}

		this.uiLastAlpha = this.uiCurAlpha;
		if( this.uiCurAlpha < this.uiAlpha ) this.uiCurAlpha += Math.abs(this.uiAlpha-this.uiCurAlpha)*0.1;
		else if( this.uiCurAlpha > this.uiAlpha ) this.uiCurAlpha -= Math.abs(this.uiAlpha-this.uiCurAlpha)*0.1;
		if( (this.uiLastAlpha < this.uiAlpha && this.uiCurAlpha >= this.uiAlpha) ||
		    (this.uiLastAlpha > this.uiAlpha && this.uiCurAlpha <= this.uiAlpha) ) {
			this.uiCurAlpha = this.uiAlpha;
		}


		// ui alpha fade

		this.virusAlpha = Math.min( this.virusAlpha+0.05, 1 );
		this.vaccineAlpha = Math.min( this.vaccineAlpha+0.05, 1 );
		this.threadCurAlpha = Math.min( this.threadCurAlpha+0.05, 1 );


		// move attack points around 
		var x, y, v, speed = 0.7;
		if( this.attackPoints && this.attackPoints.length > 0 ) {
			for( var i = 0; i < this.attackPoints.length; i+=4 ) {
				x = this.attackPoints[i];
				y = this.attackPoints[i+1];
				vx = this.attackPoints[i+2];
				vy = this.attackPoints[i+3];
				
				if( x > ig.input.mouse.x ) this.attackPoints[i+2] -= speed;
				if( x < ig.input.mouse.x ) this.attackPoints[i+2] += speed;
				if( y > ig.input.mouse.y ) this.attackPoints[i+3] -= speed;
				if( y < ig.input.mouse.y ) this.attackPoints[i+3] += speed;

				this.attackPoints[i] += this.attackPoints[i+2];
				this.attackPoints[i+1] += this.attackPoints[i+3];

				this.attackPoints[i+2] *= 0.97;
				this.attackPoints[i+3] *= 0.97;
			}
		}
	},
	

	draw: function() {



		// this is for flashing stuff
		this.threadAlpha = Math.max( this.threadAlpha-0.004, 0.5 );

		var w = this.backbuffer.width/2;
		var r1 = 20 + Math.min((this.dataRad-5),100);
		var r2 = this.vaccine !== 0 ? 5 + Math.min((this.vaccineRad),125) + r1 : r1;
		var r3 = this.virus !== 0 ? 5 + Math.min((this.virusRad),200) + r2 : r2;

		var ctx = this.backbufferCtx;
		ctx.globalAlpha = 1;



		// virus

		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		if( this.virus > 0 ) {

			// virus
			ctx.fillStyle = ctx.strokeStyle = this.team;
			ctx.lineWidth = 2;

			ctx.beginPath();
			ctx.arc( w, w, r3, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = this.virusAlpha.map( 0, 1, 0, this.threadAlpha );
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
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc( w, w, r1, 0, Math.PI*2, true ); 
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );



		// threads 

		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		if( this.threads > 0 ) {
			var x, y, r = 8+Math.min((this.dataRad-5),100)*0.15;
			var slice = 360 / this.threadSlice;

			for( var i = 0; i < this.threads; i++ ) {
				if( this.threadSlice !== this.threads && i === this.threads-1 ) {
					slice = 360 / this.threads;
				}

				x = (r3) * Math.cos( (this.threadAngle+slice*i).toRad() ) + w;
				y = (r3) * Math.sin( (this.threadAngle+slice*i).toRad() ) + w;

				ctx.fillStyle = ctx.strokeStyle = this.team;

				// circle
				if( this.production === 1 ) {
					ctx.save();
					ctx.globalCompositeOperation = 'lighter';

					ctx.beginPath();
					ctx.arc( x, y, Math.min(r,15), 0, Math.PI*2, true ); 
					ctx.closePath();

					if( this.threadSlice !== this.threads && i === this.threads-1 ) {
						ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, this.threadAlpha );
					}
					else {
						ctx.globalAlpha = this.threadCurAlpha.map( 0, 1, 0, this.threadAlpha );
					}
					ctx.fill();	

					ctx.restore();
				}

				// square
				if( this.production === 2 ) {
					ctx.save();
					ctx.globalCompositeOperation = 'lighter';
				    ctx.translate( x, y );

					if( this.threadSlice !== this.threads && i === this.threads-1 ) {
						ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, this.threadAlpha );
					}
					else {
						ctx.globalAlpha = this.threadCurAlpha.map( 0, 1, 0, this.threadAlpha );
					}
					ctx.rotate( (this.threadAngle+slice*i).toRad() );
					ctx.fillRect( -r, -r, r*2.25, r*1.5 );

					ctx.restore();
				}

				// triangle
				if( this.production === 3 ) {
					var side = r*2.25;
					var h = side * (Math.sqrt(3)/2);
				    ctx.save();
					ctx.globalCompositeOperation = 'lighter';

				    ctx.translate( x, y );
					ctx.rotate( (this.threadAngle-90+slice*i).toRad() );

				    ctx.beginPath();
				        
			        ctx.moveTo( 0, -h/2 );
			        ctx.lineTo( -side/2, h/2 );
			        ctx.lineTo( side/2, h/2 );
			        ctx.lineTo( 0, -h/2 );
				        
				    ctx.closePath();
			        
					if( this.threadSlice !== this.threads && i === this.threads-1 ) {
						ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, this.threadAlpha );
					}
					else {
						ctx.globalAlpha = this.threadCurAlpha.map( 0, 1, 0, this.threadAlpha );
					}
					ctx.fill();	

				    ctx.restore();
				}
				
			}

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}
		else {
			this.threadCurAlpha = 0;
		}



		// draw drag ui

		if( this.drawCoreDragUi ) {
			ig.system.context.save();

			ig.system.context.strokeStyle = this.canExpand ? this.team : Color.gray;
			ig.system.context.globalAlpha = 0.35;
			ig.system.context.lineWidth = 2;

			ig.system.context.beginPath();
			ig.system.context.arc( ig.input.mouse.x, ig.input.mouse.y, 128, 0, Math.PI*2, true ); 
			ig.system.context.closePath();
			ig.system.context.stroke();

			ig.system.context.restore();


			ig.system.context.save();
			ig.system.context.strokeStyle = Color.black;
			ig.system.context.lineWidth = 3;
			ig.system.context.globalAlpha = 0.7;

			ig.system.context.beginPath();
			ig.system.context.moveTo( this.dragPos.x, this.dragPos.y );
			ig.system.context.lineTo( ig.input.mouse.x, ig.input.mouse.y );
			ig.system.context.closePath();
			ig.system.context.stroke();

			this.canExpand ? this.drawArrow() : this.drawCross();
			this.drawValueTooltip( this.canExpand ? Color.green : Color.gray, this.cost === 0 ? '' : this.cost );

			ig.system.context.restore();
		}


		ig.system.context.save();

		ig.system.context.strokeStyle = this.team;
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, this.threadAlpha );

		ig.system.context.lineWidth = 5;
		ig.system.context.beginPath();
		ig.system.context.arc( this.pos.x, this.pos.y, this.radius*3, 0, Math.PI*2, true ); 
		ig.system.context.closePath();
		ig.system.context.stroke();

		ig.system.context.lineWidth = 2;
		ig.system.context.beginPath();
		ig.system.context.arc( this.pos.x, this.pos.y, this.radius*3-6, 0, Math.PI*2, true ); 
		ig.system.context.closePath();
		ig.system.context.stroke();

		ig.system.context.restore();


		if( this.drawVirusDragUi ) {
			ig.system.context.save();

			ig.system.context.strokeStyle = Color.black;
			ig.system.context.lineWidth = 3;
			ig.system.context.globalAlpha = 0.7;

			ig.system.context.beginPath();
			ig.system.context.moveTo( this.dragPos.x, this.dragPos.y );
			ig.system.context.lineTo( ig.input.mouse.x, ig.input.mouse.y );
			ig.system.context.closePath();
			ig.system.context.stroke();

			this.canExpand ? this.drawArrow() : this.drawCross();
			this.drawValueTooltip( this.canExpand ? Color.green : Color.gray, this.cost === 0 ? '' : this.cost );

			ig.system.context.restore();
		}



		// draw thread buy menu

		if( this.threadMenu ) {
			ig.system.context.save();

			ig.game.fonts.lato.draw( 
				Math.ceil(this.dataVal-5) + ' (' + this.threadCost + ')', 
				this.pos.x, 
				this.pos.y-(ig.game.fonts.lato.heightForString(this.data.toString())*0.5)-26,
				ig.Font.ALIGN.CENTER
			);
			this.anims.thread.draw( this.pos.x-18, this.pos.y-18 );

			ig.system.context.restore();
		}



		// draw data value 

		else {
			ig.system.context.save();

			var value = Math.ceil(this.dataVal) - (this.dragStart?5:0);
			ig.game.fonts.latoLight.draw( 
				value, 
				this.pos.x, 
				this.pos.y-(ig.game.fonts.latoLight.heightForString(this.data.toString())*0.5),
				ig.Font.ALIGN.CENTER
			);

			ig.system.context.restore();
		}



		// draw tooltip on hover

		ctx.clearRect( 0, 0, this.backbuffer.width, this.backbuffer.width );
		ctx.save();
		ctx.translate( w, w );
		ctx.rotate( (15).toRad() );
		ctx.lineWidth = 2;

		ctx.strokeStyle = Color.black;
		ctx.beginPath();
		ctx.moveTo( -r3 + ((r3-r2)*0.5) + 2, 2 );
		ctx.lineTo( -r3 + ((r3-r2)*0.5) + 2 - Math.max(40, r3-r2), 2 );
		ctx.closePath();
		ctx.globalAlpha = 0.35;
		ctx.stroke();

		ctx.strokeStyle = Color.white;
		ctx.beginPath();
		ctx.moveTo( -r3 + ((r3-r2)*0.5), 0 );
		ctx.lineTo( -r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2), 0 );
		ctx.closePath();
		ctx.globalAlpha = 1;
		ctx.stroke();

		ctx.strokeStyle = Color.black;
		ctx.beginPath();
		ctx.moveTo( r2 - ((r2-r1)*0.5) + 2, 2 );
		ctx.lineTo( r2 - ((r2-r1)*0.5) + 2 + Math.max(60, r2-r1), 2 );
		ctx.closePath();
		ctx.globalAlpha = 0.35;
		ctx.stroke();

		ctx.strokeStyle = Color.white;
		ctx.beginPath();
		ctx.moveTo( r2 - ((r2-r1)*0.5), 0 );
		ctx.lineTo( r2 - ((r2-r1)*0.5) + Math.max(60, r2-r1), 0 );
		ctx.closePath();
		ctx.globalAlpha = 1;
		ctx.stroke();

		ctx.restore();

		ig.system.context.save();
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 );
		ig.system.context.globalCompositeOperation = 'darker';
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		ig.system.context.globalCompositeOperation = 'lighter';
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		ig.system.context.restore();



		// draw tooltip labels 

		ig.system.context.save();
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 );

		x = (r2 - ((r2-r1)*0.5) + 2 + Math.max(60, r2-r1) + 10) * Math.cos( (15).toRad() ) + this.pos.x;
		y = (r2 - ((r2-r1)*0.5) + 2 + Math.max(60, r2-r1) + 10) * Math.sin( (15).toRad() ) + this.pos.y;
		ig.game.fonts.lato.draw( 
			this.vaccine, 
			x, 
			y-(ig.game.fonts.lato.heightForString(this.vaccine.toString())*0.5),
			ig.Font.ALIGN.LEFT
		);
		ig.game.fonts.latoSmall.draw( 
			'vaccine', 
			x+ig.game.fonts.lato.widthForString(this.vaccine.toString())+2, 
			y-(ig.game.fonts.lato.heightForString(this.vaccine.toString())*0.5)+6,
			ig.Font.ALIGN.LEFT
		);

		x = (-r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) - 10) * Math.cos( (15).toRad() ) + this.pos.x;
		y = (-r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) - 10) * Math.sin( (15).toRad() ) + this.pos.y;
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 );
		ig.game.fonts.lato.draw( 
			this.virus, 
			x, 
			y-(ig.game.fonts.lato.heightForString(this.virus.toString())*0.5),
			ig.Font.ALIGN.RIGHT
		);
		ig.game.fonts.latoSmall.draw( 
			'viral', 
			x-ig.game.fonts.lato.widthForString(this.virus.toString())-2, 
			y-(ig.game.fonts.lato.heightForString(this.virus.toString())*0.5)+6,
			ig.Font.ALIGN.RIGHT
		);

		ig.system.context.restore();



		// draw attack particles
		if( this.attacking ) {
			ig.system.context.save();

			ig.system.context.fillStyle = ctx.strokeStyle = this.team;
			ig.system.context.lineWidth = 2;

			ig.system.context.beginPath();
			ig.system.context.globalAlpha = 0.5;
			ig.system.context.arc( ig.input.mouse.x, ig.input.mouse.y, 24, 0, Math.PI*2, true ); 
			ig.system.context.closePath();
			ig.system.context.fill();

			ig.system.context.globalCompositeOperation = 'lighter';

			for( var i = 0; i < this.attackPoints.length; i+=4 ) {
				ig.system.context.beginPath();
				ig.system.context.globalAlpha = Math.random();
				ig.system.context.arc( this.attackPoints[i], this.attackPoints[i+1], (Math.random()*4)+2, 0, Math.PI*2, true ); 
				ig.system.context.closePath();
				ig.system.context.fill();
			}

			ig.system.context.restore();
		}
	}
});

});
