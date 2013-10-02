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
	efficiency: 5,
	virus: 0,
	vaccine: 0,
	data: 5,
	threads: 0,
	threadCost: 1,
	production: 1,
	timer: null,
	travelTimer: null,
	productionTimer: null,
	alive: true,

	globalAlpha: 0,
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
	attackPointsVisible: 0,

	radius: 0,


	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.timer = new ig.Timer();
		this.travelTimer = new ig.Timer(-2);
		this.productionTimer = new ig.Timer();

		this.threadSlice = this.threads;

		var self = this;
		setInterval( function() { 
			//debug
		}, 1000 );
	},


	distanceToPoint: function( point ) {
		var xs = 0;
		var ys = 0;

		xs = (point.x - this.pos.x);
		xs = xs * xs;

		ys = (point.y - this.pos.y);
		ys = ys * ys;

		return Math.sqrt( xs + ys );
	},


	battleStatusMsg: function( a, b ) {
		if( a > b*2 ) return 'Major Victory'.toUpperCase();
		else if( a > b*1.3 ) return 'Victory'.toUpperCase();
		else if( a > b ) return 'Minor Victory'.toUpperCase();
		else if( a === b ) return 'Just Barely'.toUpperCase();
		else if( a < b ) return 'Minor Defeat'.toUpperCase();
		else if( a < b*1.3 ) return 'Defeat'.toUpperCase();
		else if( a < b*2 ) return 'Major Defeat'.toUpperCase();
	},


	drawCross: function() {
		var posx = (ig.game.mouse.x-this.pos.x)*ig.game.zoom;
		var posy = (ig.game.mouse.y-this.pos.y)*ig.game.zoom;

		ig.system.context.strokeStyle = Color.red;
		ig.system.context.lineWidth = 3;

		ig.system.context.beginPath();
		ig.system.context.moveTo( posx-7, posy-7 );
		ig.system.context.lineTo( posx+7, posy+7 );
		ig.system.context.closePath();
		ig.system.context.stroke();

		ig.system.context.beginPath();
		ig.system.context.moveTo( posx+7, posy-7 );
		ig.system.context.lineTo( posx-7, posy+7 );
		ig.system.context.closePath();
		ig.system.context.stroke();
	},


	drawArrow: function() {
		var posx = (ig.game.mouse.x-this.pos.x)*ig.game.zoom;
		var posy = (ig.game.mouse.y-this.pos.y)*ig.game.zoom;
		var dx = (this.dragPos.y-this.pos.y) - (ig.game.mouse.y-this.pos.y);
		var dy = (this.dragPos.x-this.pos.x) - (ig.game.mouse.x-this.pos.x);
		var angle = Math.atan2(dx,dy) + (90).toRad();

		ig.system.context.save();

		ig.system.context.strokeStyle = Color.green;
		ig.system.context.lineWidth = 3;

		ig.system.context.translate( posx, posy );
		ig.system.context.rotate( angle );

		ig.system.context.beginPath();
		ig.system.context.moveTo( -9, -9 );
		ig.system.context.lineTo( 0, 0 );
		ig.system.context.lineTo( 9, -9 );
		ig.system.context.stroke();

		ig.system.context.restore();
	},


	drawValueTooltip: function( color, value, viral ) {
		var dx = (this.dragPos.y-this.pos.y)*ig.game.zoom - (ig.game.mouse.y-this.pos.y)*ig.game.zoom;
		var dy = (this.dragPos.x-this.pos.x)*ig.game.zoom - (ig.game.mouse.x-this.pos.x)*ig.game.zoom;
		var dist = Math.sqrt( dx * dx + dy * dy );
		var angle = Math.atan2(dx,dy) + (90).toRad();

		var x = (dist+32) * Math.cos( angle + (90).toRad() ) + (this.dragPos.x-this.pos.x)*ig.game.zoom;
		var y = (dist+32) * Math.sin( angle + (90).toRad() ) + (this.dragPos.y-this.pos.y)*ig.game.zoom;

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
	},


	receiveDamage: function( amount, from ) {
		this.attackPool = Math.max( 0, amount - (this.vaccine+this.data) );

		var coreamt = amount - this.vaccine;
		this.vaccine = Math.max( 0, this.vaccine-amount );

		this.data = Math.max( 0, this.data-Math.max(0,coreamt) );
		ig.game.attackingNode.virus -= ig.game.attackingForce;

		if( this.data <= 1 ) {
			this.kill();
			this.attacker = ig.game.attackingNode.team;
		}
	},


	kill: function() {
		this.alive = false;
	},


	assimilate: function() {
		// todo: create awesoome particle effects

		this.team = this.attacker;
		this.data = 5 + Math.round(this.attackPool*0.25);
		this.vaccine = 0;
		this.virus = 0;

		this.alive = true;
	},


	update: function() {
		this.parent();




		// produce

		if( this.productionTimer.delta() > this.efficiency ) {
			if( this.production === 1 ) this.data += Math.ceil(this.threads*0.25);
			if( this.production === 2 ) this.vaccine += Math.ceil(this.threads*0.25);
			if( this.production === 3 ) this.virus += Math.ceil(this.threads*0.25);

			this.productionTimer.reset();
			this.threadAlpha = 1;
		}



		// ui / input

		var dx = this.dragPos.y - ig.game.mouse.y;
		var dy = this.dragPos.x - ig.game.mouse.x; 
		var dist = Math.sqrt( dx * dx + dy * dy );
		var distCenter = this.distanceToPoint( ig.game.mouse );

		var r1 = 60 + Math.min((this.dataRad-5)*3,300);
		var r2 = Math.min((this.vaccineRad+5)*3,375) + r1;
		var r3 = Math.min((this.virusRad+5)*3,600) + r2;
		this.radius = r3;



		// mouse pressed

		this.threadCost = this.threads * this.threads;
		if( this.team === ig.game.playerColor ) {
			if( ig.input.pressed( 'action' ) ) {

				if( !ig.game.playerAttacking ) {
					// buy new thread
					if( this.threadMenu && distCenter < r1 ) {

						if( this.data-5 >= this.threadCost ) {
							this.data -= this.threadCost;
							this.threads++;
						}
					}

					// clicked on core
					if( this.data >= 5 && distCenter < r1 ) {
						this.timer.set(0);
						this.travelTimer.set(0);
						this.threadCanOpen = true;
						this.dragType = 'core';
						this.dragPos = { x: ig.game.mouse.x, y: ig.game.mouse.y };
					}

					// clicked on virus
					else if( this.virus > 0 && distCenter < r3 && distCenter > r2 ) {
						this.timer.set(0);
						this.travelTimer.set(0);
						this.dragType = 'virus';
						this.dragPos = { x: ig.game.mouse.x, y: ig.game.mouse.y };

						ig.game.attackingNode = this;
					}

					// clicked outside of core
					if( distCenter > r1 ) {
						this.threadMenu = false;
						this.threadCanOpen = false;

						this.drawCoreDragUi = false;
						this.drawVirusDragUi = false;

						this.attacking = false;
					}
				} else {
					if( distCenter < r1 ) {
						this.virus += Math.max( 1, Math.round(ig.game.attackingForce - Math.ceil(ig.game.attackingNode.distanceToPoint( this.pos)/50 )) );
						ig.game.attackingNode.virus -= ig.game.attackingForce;
					}
				}

				this.attacking = false;
			}
		}
		else {
			if( ig.input.pressed( 'action' ) && distCenter < r1 ) {
				if( ig.game.playerAttacking ) {
					if( 
						this !== ig.game.attackingNode && 
						ig.game.attackingNode.distanceToPoint( this.pos ) < ig.game.attackingNode.radius*3 
					) {
						this.receiveDamage( ig.game.attackingForce, ig.game.attackingNode );
					}
				}
			}
		}



		// mouse state down

		if( ig.input.state( 'action' ) ) {

			// open thread menu
			if( distCenter < r1 ) {
				if( this.threadCanOpen && this.timer.delta() >= 0.5 && !this.threadMenu ) {  
					this.threadMenu = true;
				}
			} 

			// enable drag ui
			else {
				this.threadCanOpen = false;
				if( this.timer.delta() < 0.5 && !this.threadMenu && !this.dragStart && dist > 5 && this.travelTimer.delta() < 0.5 ) {
					if( this.dragType === 'core' ) {
						this.drawCoreDragUi = true;
						this.dragStart = true;
					}
					if( this.dragType === 'virus' ) {
						this.drawVirusDragUi = true;
						this.dragStart = true;
					}
				}
			}

			if( this.drawCoreDragUi || this.drawVirusDragUi ) {

				// far enough from core to expand
				var ent;
				if( this.dragType === 'core' && distCenter > r3+128 ) {
					this.cost = Math.ceil(dist/20);

					if( this.data-this.cost >= 5 ) this.canExpand = true;
					else this.canExpand = false;

					for( var i = 0; i < ig.game.entities.length; i++ ) {
						ent = ig.game.entities[i];
						if( ent !== this && ent.distanceToPoint( ig.game.mouse ) < ent.radius+128 ) {
							this.canExpand = false;
							this.cost = 0;
							break;
						}
					}
				}
				else if( this.dragType === 'virus' && dist > 5 ) {
					this.cost = this.virus*(dist/this.radius*0.75);
					this.cost = Math.min( this.virus, this.cost );
					this.cost = Math.ceil( this.cost );

					if( this.virus-this.cost >= 0 ) this.canExpand = true;
					else this.canExpand = false;
				}
				else { 
					this.canExpand = false;
					this.cost = 0;
				}
			}
		}



		// mouse up

		if( ig.input.released( 'action' ) ) {
			this.travelTimer.set(-2);

			// drag stop
			if( this.dragStart ) {

				// try to create a new node
				if( this.dragType === 'core' ) {
					this.drawCoreDragUi = false;
					if( this.canExpand ) {
						ig.game.spawnEntity( 'EntityNode', ig.game.mouse.x, ig.game.mouse.y, { team: this.team, threads: 1, production: 3 } );
						this.data -= this.cost;
					}
				}

				// try to start attacking
				if( this.dragType === 'virus' ) {
					if( this.canExpand && distCenter > r1 ) {
						ig.game.attackingForce = this.cost;

						this.attacking = true;
						this.attackPoints = new Float32Array( ((this.cost*2)<<0)*3 );
						this.attackPointsVisible = this.attackPoints.length/5;

						slice = 360/((this.cost/2)<<0);
						for( var i = 0; i < this.attackPoints.length; i+=5 ) {
							x = 15 * Math.cos( (slice*i).toRad() );
							y = 15 * Math.sin( (slice*i).toRad() );

							this.attackPoints[i] = x+ig.game.mouse.x;
							this.attackPoints[i+1] = y+ig.game.mouse.y;
							this.attackPoints[i+2] = (Math.random()-0.5)*(this.canAttack ? 7 : 4);
							this.attackPoints[i+3] = (Math.random()-0.5)*(this.canAttack ? 7 : 4);
							this.attackPoints[i+4] = Math.random();
						}
					}
					this.drawVirusDragUi = false;
				}
			}
			this.dragStart = false;
			this.canExpand = false;
			this.canAttack = false;

			if( distCenter < r1 && !ig.game.playerAttacking ) {
				if( this.threads > 0 && !this.threadMenu && this.timer.delta() < 0.5 ) { 
					this.production++;
					if( this.production > 3 ) this.production = 1;
				}
			}
			else if( distCenter < r3 && distCenter > r2 ) {
				// up virus
			}
		}



		// hover 

		this.flashWarning = false;
		if( distCenter < r1 ) {
			this.uiAlpha = 1;

			if( !ig.input.state( 'action' ) && ig.game.playerAttacking && ig.game.attackingNode !== this && this.team !== ig.game.playerColor ) {
				if( ig.game.attackingNode.distanceToPoint( this.pos ) < ig.game.attackingNode.radius*3 ) {
					this.flashWarning = true;
				}
			}

			if( !ig.input.state( 'action' ) && !ig.game.playerAttacking ) {
				this.zIndex = 100;
				ig.game.sortEntitiesDeferred();
			}
		} else {
			this.uiAlpha = 0;
			this.zIndex = 0;
		}



		// can attack

		if( this.attacking && distCenter < this.radius*3 ) {
			this.canAttack = true;
		} else {
			this.canAttack = false;
		}



		// show ui if attacking

		if( this.drawVirusDragUi || this.attacking ) {
			this.uiAlpha = 1;
			if( this.zIndex !== 100 ) {
				this.zIndex = 100;
				ig.game.sortEntitiesDeferred();
			}
		}


		// animations

		if( this.virusRad < this.virus ) this.virusRad+=0.5;
		else if( this.virusRad > this.virus ) this.virusRad-=0.5;
		//this.virusRad.limit( 0, this.virus );

		if( this.vaccineRad < this.vaccine ) this.vaccineRad+=0.5;
		else if( this.vaccineRad > this.vaccine ) this.vaccineRad-=0.5;
		//this.vaccineRad.limit( 0, this.vaccine );

		if( this.dataRad < this.data ) this.dataRad+=0.5;
		else if( this.dataRad > this.data ) this.dataRad-=0.5;
		//this.dataRad.limit( 0, this.data );

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

		var x, y, v, a;
		var sin;
		if( this.attackPoints && this.attackPoints.length > 0 ) {
			for( var i = 0; i < this.attackPoints.length; i+=5 ) {
				x = this.attackPoints[i];
				y = this.attackPoints[i+1];
				vx = this.attackPoints[i+2];
				vy = this.attackPoints[i+3];
				a = this.attackPoints[i+4];

				sin = Math.sin( (Math.random()-0.5)/1000 + (i*20) ) * 20;

				this.attackPoints[i] += this.attackPoints[i+2];
				this.attackPoints[i+1] += this.attackPoints[i+3];

				this.attackPoints[i+4] = Math.max( 0, a-0.025 );

				if( this.attackPoints[i+4] <= 0 ) {

					if( this.attacking ) {
						this.attackPoints[i] = ig.game.mouse.x+(Math.random()-0.5)*20;
						this.attackPoints[i+1] = ig.game.mouse.y+(Math.random()-0.5)*20;
						this.attackPoints[i+2] = (Math.random()-0.5)*(this.canAttack ? 7 : 4);
						this.attackPoints[i+3] = (Math.random()-0.5)*(this.canAttack ? 7 : 4);
						this.attackPoints[i+4] = Math.random();
					}
				}

				this.attackPoints[i+2] *= 0.99;
				this.attackPoints[i+3] *= 0.99;
			}
		}

		if( !this.alive ) {
			this.uiAlpha = 0;
			this.threadAlpha = 0;
			this.uiAlpha = Math.max( 0, this.globalAlpha - 0.1 );
			this.globalAlpha = Math.max( 0, this.globalAlpha - 0.01 );

			if( this.globalAlpha === 0 ) {
				this.dataRad = this.dataVal = this.data = 0;
				this.virusRad = this.virus = 0;
				this.vaccineRad = this.vaccine = 0;

				this.assimilate();
			}
		}
		else {
			this.globalAlpha = Math.min( 1, this.globalAlpha + 0.025 );
		}
	},


	draw: function() {

		// this is for flashing stuff
		this.threadAlpha = Math.max( this.threadAlpha-0.004, 0.5 );

		var r1 = 60 + Math.min((this.dataRad-5)*3,300) - ig.game.zoom;
		var r2 = Math.min((this.vaccineRad+5)*3,375) + r1;
		var r3 = Math.min((this.virusRad+5)*3,600) + r2;
		var pos = {};
			pos.x = this.pos.x - ig.game.screen.x;
			pos.y = this.pos.y - ig.game.screen.y;
		var lineWidth1 = 3;
		var lineWidth2 = 6;
		var lineWidth3 = 9;
		var lineWidth5 = 15;

		var ctx = ig.system.context;
		ctx.globalAlpha = 1;



		// zoom

		ig.system.context.save();
		ig.system.context.translate( this.pos.x+ig.game.screen.x, this.pos.y+ig.game.screen.y );



		// aura of influence

		ig.system.context.save();

		var grd = ctx.createRadialGradient( 0, 0, 1, 0, 0, r3*3 );
			grd.addColorStop( 0, 'transparent' );
			grd.addColorStop( (r3/(r3*3)), 'transparent' );
			grd.addColorStop( (r3/(r3*3)), this.team );
			grd.addColorStop( 1, 'transparent' );
		ig.system.context.fillStyle = grd;
		
		ig.system.context.beginPath();
		ig.system.context.arc( 0, 0, r3*3, 0, Math.PI*2, true ); 
		ig.system.context.closePath();

		ig.system.context.globalAlpha = this.virusAlpha.map( 0, 1, 0, this.threadAlpha*0.35 )*this.globalAlpha;
		ig.system.context.fill();

		ig.system.context.restore();



		// virus

		ctx.save();

		var grd = ctx.createRadialGradient( 0, 0, 1, 0, 0, r3 );
			grd.addColorStop( 0, 'transparent' );
			grd.addColorStop( r2/r3, 'transparent' );
			grd.addColorStop( r2/r3, ig.game.hexToRGBA( this.team, 0.4 ) );
			grd.addColorStop( 1, this.team );
		ctx.fillStyle = grd;
		ctx.strokeStyle = this.team;
		ctx.lineWidth = lineWidth2;

		ctx.beginPath();
		ctx.arc( 0, 0, r3, 0, Math.PI*2, true ); 
		ctx.closePath();

		ctx.globalAlpha = this.virusAlpha.map( 0, 1, 0, this.threadAlpha )*this.globalAlpha;
		ctx.fill();

		ctx.globalAlpha = this.virusAlpha*this.globalAlpha;
		ctx.stroke();

		ctx.restore();



		// vaccine

		ctx.save();

		ctx.fillStyle = ctx.strokeStyle = Color.black;
		ctx.lineWidth = lineWidth2;
		
		ctx.beginPath();
		ctx.arc( 0, 0, r2-1, 0, Math.PI*2, true ); 
		ctx.closePath();

		ctx.globalAlpha = this.vaccineAlpha.map( 0, 1, 0, 0.35 )*this.globalAlpha;
		ctx.fill();

		ctx.beginPath();
		ctx.arc( 0, 0, r2-lineWidth2/2, 0, Math.PI*2, true ); 
		ctx.closePath();

		ctx.globalAlpha = this.vaccineAlpha.map( 0, 1, 0, 0.5 )*this.globalAlpha;
		ctx.stroke();

		ctx.restore();



		// data

		ctx.globalAlpha = this.globalAlpha;
		ctx.fillStyle = ctx.strokeStyle = this.team;
		ctx.lineWidth = lineWidth1;
		ctx.beginPath();
		ctx.arc( 0, 0, r1, 0, Math.PI*2, true ); 
		ctx.closePath();
		ctx.stroke();

		ctx.fill();



		// threads 
		if( this.threads > 0 ) {
			var x, y, r = (8+Math.min((this.dataRad-5),100)*0.15)*3;
			var slice = 360 / this.threadSlice;

			for( var i = 0; i < this.threads; i++ ) {
				if( this.threadSlice !== this.threads && i === this.threads-1 ) {
					slice = 360 / this.threads;
				}

				x = (r3) * Math.cos( (this.threadAngle+slice*i).toRad() );
				y = (r3) * Math.sin( (this.threadAngle+slice*i).toRad() );

				ctx.fillStyle = ctx.strokeStyle = this.team;

				// circle
				if( this.production === 1 ) {
					ctx.save();
					ctx.globalCompositeOperation = 'lighter';

					ctx.beginPath();
					ctx.arc( x, y, r, 0, Math.PI*2, true ); 
					ctx.closePath();

					if( this.threadSlice !== this.threads && i === this.threads-1 ) {
						ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, this.threadAlpha )*this.globalAlpha;
					}
					else {
						ctx.globalAlpha = this.threadCurAlpha.map( 0, 1, 0, this.threadAlpha )*this.globalAlpha;
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
						ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, this.threadAlpha )*this.globalAlpha;
					}
					else {
						ctx.globalAlpha = this.threadCurAlpha.map( 0, 1, 0, this.threadAlpha )*this.globalAlpha;
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
						ctx.globalAlpha = (this.threads-this.threadSlice).map( 1, 0, 0, this.threadAlpha )*this.globalAlpha;
					}
					else {
						ctx.globalAlpha = this.threadCurAlpha.map( 0, 1, 0, this.threadAlpha )*this.globalAlpha;
					}
					ctx.fill();	

				    ctx.restore();
				}
				
			}
		}
		else {
			this.threadCurAlpha = 0;
		}



		// attack boundry (rings)
		var ringSin = Math.sin( new Date().getTime() / 20 );
		var ringAlpha = this.flashWarning ? (ringSin>0?1:this.threadAlpha) : this.threadAlpha;
		ig.system.context.save();

		ig.system.context.strokeStyle = this.team;
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, ringAlpha )*this.globalAlpha;

		ig.system.context.lineWidth = 5/ig.game.zoom;
		ig.system.context.beginPath();
		ig.system.context.arc( 0, 0, r3*3, 0, Math.PI*2, true ); 
		ig.system.context.closePath();
		ig.system.context.stroke();

		ig.system.context.lineWidth = 3/ig.game.zoom;
		ig.system.context.beginPath();
		ig.system.context.arc( 0, 0, r3*3-(6/ig.game.zoom), 0, Math.PI*2, true ); 
		ig.system.context.closePath();
		ig.system.context.stroke();

		ig.system.context.restore();

		ig.system.context.restore();
	},


	drawUI: function() {
		var r1 = 60*ig.game.zoom + Math.min((this.dataRad-5)*3,300)*ig.game.zoom - ig.game.zoom;
		var r2 = Math.min((this.vaccineRad+5)*3,375)*ig.game.zoom + r1;
		var r3 = Math.min((this.virusRad+5)*3,600)*ig.game.zoom + r2;
		var pos = {};
			pos.x = this.pos.x - ig.game.screen.x;
			pos.y = this.pos.y - ig.game.screen.y;
		var lineWidth1 = 1;
		var lineWidth2 = 2;
		var lineWidth3 = 3;
		var lineWidth5 = 5;

		var dx = this.dragPos.y - ig.game.mouse.y;
		var dy = this.dragPos.x - ig.game.mouse.x; 
		var dist = Math.sqrt( dx * dx + dy * dy );
		var distCenter = this.distanceToPoint( ig.game.mouse );

		var ctx = ig.system.context;
		ctx.globalAlpha = 1;


		// zoom

		ig.system.context.save();
		ig.system.context.translate( this.pos.x+ig.game.screen.x, this.pos.y+ig.game.screen.y );
		ig.system.context.scale( 1/ig.game.zoom, 1/ig.game.zoom );



		// draw thread buy menu

		if( this.threadMenu ) {
			ig.system.context.save();

			ig.game.fonts.lato.draw( 
				Math.ceil(this.dataVal-5) + ' / ' + this.threadCost, 
				0, 
				-(ig.game.fonts.lato.heightForString(this.data.toString())*0.5),
				ig.Font.ALIGN.CENTER
			);

			ig.system.context.restore();
		}



		// draw data value 

		else {
			ig.system.context.save();

			ig.system.context.globalAlpha = this.globalAlpha;

			var value = Math.ceil(this.dataVal) - (this.dragStart?5:0);
			ig.game.fonts.latoLight.draw( 
				value, 
				0, 
				-(ig.game.fonts.latoLight.heightForString(this.data.toString())*0.5),
				ig.Font.ALIGN.CENTER
			);

			ig.system.context.restore();
		}



		// draw tooltip on hover

		ctx.save();
		ctx.rotate( (15).toRad() );
		ctx.lineWidth = 2;

		// virus

		ctx.strokeStyle = Color.black;
		ctx.beginPath();
		ctx.moveTo( -r3 + ((r3-r2)*0.5) + 2, 2 );
		ctx.lineTo( -r3 + ((r3-r2)*0.5) + 2 - Math.max(40, r3-r2), 2 );
		ctx.closePath();
		ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.35 )*this.globalAlpha;
		ctx.stroke();

		ctx.strokeStyle = Color.white;
		ctx.beginPath();
		ctx.moveTo( -r3 + ((r3-r2)*0.5), 0 );
		ctx.lineTo( -r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2), 0 );
		ctx.closePath();
		ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 1 )*this.globalAlpha;
		ctx.stroke();

		// vaccine

		ctx.strokeStyle = Color.black;
		ctx.beginPath();
		ctx.moveTo( r2 - ((r2-r1)*0.5) + 2, 2 );
		ctx.lineTo( r2 - ((r2-r1)*0.5) + 2 + Math.max(60, r2-r1), 2 );
		ctx.closePath();
		ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.35 )*this.globalAlpha;
		ctx.stroke();

		ctx.strokeStyle = Color.white;
		ctx.beginPath();
		ctx.moveTo( r2 - ((r2-r1)*0.5), 0 );
		ctx.lineTo( r2 - ((r2-r1)*0.5) + Math.max(60, r2-r1), 0 );
		ctx.closePath();
		ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 1 )*this.globalAlpha;
		ctx.stroke();

		// attack results

		if( ig.game.playerAttacking && ig.game.attackingNode !== this && this.team !== ig.game.playerColor && this.alive && ig.game.attackingNode.distanceToPoint( this.pos ) < ig.game.attackingNode.radius*3 ) {

			ctx.rotate( (-15).toRad() );
			ctx.lineWidth = 2;

			ctx.strokeStyle = Color.black;
			ctx.beginPath();
			ctx.moveTo( 2, -r1 + ((r2-r1)*0.5) + 2 );
			ctx.lineTo( 2, -r3 + ((r3-r2)*0.5) + 2 - Math.max(40, r3-r2) );
			ctx.closePath();
			ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.35 )*this.globalAlpha;
			ctx.stroke();

			ctx.strokeStyle = Color.white;
			ctx.beginPath();
			ctx.moveTo( 0, -r1 + ((r2-r1)*0.5) );
			ctx.lineTo( 0, -r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) );
			ctx.closePath();
			ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 1 )*this.globalAlpha;
			ctx.stroke();

		}

		// transfer results

		if( ig.game.playerAttacking && ig.game.attackingNode !== this && this.team === ig.game.playerColor && this.alive ) {

			ctx.rotate( (-15).toRad() );
			ctx.rotate( (180).toRad() );
			ctx.lineWidth = 2;

			ctx.strokeStyle = Color.black;
			ctx.beginPath();
			ctx.moveTo( -2, -r1 + ((r2-r1)*0.5) - 2 );
			ctx.lineTo( -2, -r3 + ((r3-r2)*0.5) - 2 - Math.max(40, r3-r2) );
			ctx.closePath();
			ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.35 )*this.globalAlpha;
			ctx.stroke();

			ctx.strokeStyle = Color.white;
			ctx.beginPath();
			ctx.moveTo( 0, -r1 + ((r2-r1)*0.5) );
			ctx.lineTo( 0, -r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) );
			ctx.closePath();
			ctx.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 1 )*this.globalAlpha;
			ctx.stroke();

		}

		ctx.restore();



		// draw tooltip labels 

		// vaccine 

		x = (r2 - ((r2-r1)*0.5) + 2 + Math.max(60, r2-r1) + 10) * Math.cos( (15).toRad() );
		y = (r2 - ((r2-r1)*0.5) + 2 + Math.max(60, r2-r1) + 10) * Math.sin( (15).toRad() );

		ig.system.context.save();

		ig.system.context.translate( Math.round(x)+0.5, Math.round(y)+0.5 );
		
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 )*this.globalAlpha;

		ig.game.fonts.lato.draw( 
			this.vaccine, 
			0, 
			-(ig.game.fonts.lato.heightForString(this.vaccine.toString())*0.5),
			ig.Font.ALIGN.LEFT
		);
		ig.game.fonts.latoSmall.draw( 
			'vaccine', 
			ig.game.fonts.lato.widthForString(this.vaccine.toString())+2, 
			-(ig.game.fonts.lato.heightForString(this.vaccine.toString())*0.5)+6,
			ig.Font.ALIGN.LEFT
		);

		ig.system.context.restore();



		// virus

		x = (-r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) - 10) * Math.cos( (15).toRad() );
		y = (-r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) - 10) * Math.sin( (15).toRad() );

		ig.system.context.save();
		
		ig.system.context.translate( Math.round(x), Math.round(y) );
		
		ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 )*this.globalAlpha;

		ig.game.fonts.lato.draw( 
			this.virus, 
			0, 
			-(ig.game.fonts.lato.heightForString(this.virus.toString())*0.5),
			ig.Font.ALIGN.RIGHT
		);
		ig.game.fonts.latoSmall.draw( 
			'viral', 
			-ig.game.fonts.lato.widthForString(this.virus.toString())-2, 
			-(ig.game.fonts.lato.heightForString(this.virus.toString())*0.5)+6,
			ig.Font.ALIGN.RIGHT
		);

		ig.system.context.restore();



		// attack results

		if( ig.game.playerAttacking && ig.game.attackingNode !== this && this.team !== ig.game.playerColor && this.alive && ig.game.attackingNode.distanceToPoint( this.pos ) < ig.game.attackingNode.radius*3 ) {

			x = (-r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) - 10) * Math.cos( (90).toRad() );
			y = (-r3 + ((r3-r2)*0.5) - Math.max(40, r3-r2) - 10) * Math.sin( (90).toRad() );

			ig.system.context.save();
		
			ig.system.context.translate( Math.round(x), Math.round(y) );
			
			ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 )*this.globalAlpha;

			ig.game.fonts.latoSmall.letterSpacing = 2;
			ig.game.fonts.latoSmall.draw( 
				this.battleStatusMsg(ig.game.attackingForce,this.data+this.vaccine), 
				0, 
				-(ig.game.fonts.latoSmall.heightForString('vs')*0.5)-32-4,
				ig.Font.ALIGN.CENTER
			);
			ig.game.fonts.latoSmall.letterSpacing = 1;

			ig.game.fonts.lato.draw( 
				this.data+this.vaccine,
				16, 
				-(ig.game.fonts.lato.heightForString('X')*0.5)-8-4,
				ig.Font.ALIGN.LEFT
			);
			ig.game.fonts.lato.draw( 
				ig.game.attackingForce, 
				-16, 
				-(ig.game.fonts.lato.heightForString('X')*0.5)-8-4,
				ig.Font.ALIGN.RIGHT
			);
			ig.game.fonts.latoSmall.draw( 
				'vs', 
				0, 
				-(ig.game.fonts.latoSmall.heightForString('vs')*0.5)+2-8-4,
				ig.Font.ALIGN.CENTER
			);

			ig.system.context.restore();
		}



		// virus move results

		var xfer = ig.game.attackingNode ? ig.game.attackingNode.distanceToPoint( this.pos ) : 0;
		if( ig.game.playerAttacking && ig.game.attackingNode !== this && this.team === ig.game.playerColor && this.alive ) {

			x = (r3 - ((r3-r2)*0.5) + Math.max(40, r3-r2) + 10) * Math.cos( (90).toRad() );
			y = (r3 - ((r3-r2)*0.5) + Math.max(40, r3-r2) + 10) * Math.sin( (90).toRad() );

			ig.system.context.save();

			ig.system.context.translate( Math.round(x), Math.round(y) );
			
			ig.system.context.globalAlpha = this.uiCurAlpha.map( 0, 1, 0, 0.7 )*this.globalAlpha;

			ig.game.fonts.latoSmall.letterSpacing = 2;
			ig.game.fonts.latoSmall.draw(
				Math.round(100-((ig.game.attackingForce - Math.ceil(xfer/50))/ig.game.attackingForce)*100)+
				'% loss', 
				0, 
				-(ig.game.fonts.latoSmall.heightForString('vs')*0.5)+32+4,
				ig.Font.ALIGN.CENTER
			);
			ig.game.fonts.latoSmall.letterSpacing = 1;

			ig.game.fonts.lato.draw( 
				Math.round(ig.game.attackingForce - Math.ceil(xfer/50))+'/'+ig.game.attackingForce,
				0, 
				-(ig.game.fonts.lato.heightForString('X')*0.5)+8+4,
				ig.Font.ALIGN.CENTER
			);

			ig.system.context.restore();
		}



		pos.x = (ig.game.mouse.x-this.pos.x)*ig.game.zoom;
		pos.y = (ig.game.mouse.y-this.pos.y)*ig.game.zoom;

		// data drag ui

		if( this.drawCoreDragUi && ig.input.state( 'action' ) && !this.threadMenu && dist > 5 ) {

			// area
			ig.system.context.save();

			ig.system.context.strokeStyle = this.canExpand ? this.team : Color.gray;
			ig.system.context.globalAlpha = 0.35*this.globalAlpha;
			ig.system.context.lineWidth = lineWidth2;

			ig.system.context.beginPath();
			ig.system.context.arc( pos.x, pos.y, 128*ig.game.zoom, 0, Math.PI*2, true ); 
			ig.system.context.closePath();
			ig.system.context.stroke();

			ig.system.context.restore();

			// line
			ig.system.context.save();

			ig.system.context.strokeStyle = Color.black;
			ig.system.context.lineWidth = lineWidth3;
			ig.system.context.globalAlpha = 0.7*this.globalAlpha;

			ig.system.context.beginPath();
			ig.system.context.moveTo( 0, 0 );
			ig.system.context.lineTo( pos.x, pos.y );
			ig.system.context.closePath();
			ig.system.context.stroke();

			ig.system.context.restore();

			this.canExpand ? this.drawArrow() : this.drawCross();
			this.drawValueTooltip( this.canExpand ? Color.green : Color.gray, this.cost === 0 ? '' : this.cost );
		}



		// virus drag ui

		if( this.drawVirusDragUi && ig.input.state( 'action' ) && !this.threadMenu && dist > 5 ) {
			ig.system.context.save();

			ig.system.context.strokeStyle = Color.black;
			ig.system.context.lineWidth = lineWidth3;
			ig.system.context.globalAlpha = 0.7*this.globalAlpha;

			ig.system.context.beginPath();
			ig.system.context.moveTo( pos.x, pos.y );
			ig.system.context.lineTo( pos.x, pos.y );
			ig.system.context.closePath();
			ig.system.context.stroke();

			ig.system.context.restore();

			this.canExpand ? this.drawArrow() : this.drawCross();
			this.drawValueTooltip( this.canExpand ? Color.green : Color.gray, this.cost === 0 ? '' : this.cost, true );
		}



		// draw attack particles
		var color = this.canAttack ? this.team : Color.gray;

		ig.system.context.save();
		ig.system.context.globalCompositeOperation = 'lighter';

		// glow

		if( ig.game.playerAttacking ) {
			var grd = ctx.createRadialGradient(ig.game.mouse.x,ig.game.mouse.y,5,ig.game.mouse.x,ig.game.mouse.y,36);
				grd.addColorStop( 0, color );
				grd.addColorStop( 1, 'transparent' );

			ig.system.context.beginPath();
			ig.system.context.globalAlpha = this.canAttack ? 0.45*this.globalAlpha : 0.05*this.globalAlpha;
			ig.system.context.arc( ig.game.mouse.x, ig.game.mouse.y, 36, 0, Math.PI*2, true ); 
			ig.system.context.closePath();

			ig.system.context.fillStyle = grd;
			ig.system.context.fill();
		}

		// todo: god rays

		// particles

		ig.system.context.fillStyle = ctx.strokeStyle = color;
		var size, alpha, dx, dy, angle;
		for( var i = 0; i < this.attackPointsVisible*5; i+=5 ) {
			size = this.canAttack ? (Math.random()*6)+3 : 4;
	        alpha = this.canAttack ? Math.random() : 0.3;
	        x = this.attackPoints[i];
	        y = this.attackPoints[i+1];

			ig.system.context.save();

			ig.system.context.beginPath();
			ig.system.context.globalAlpha = this.attackPoints[i+4] ? this.attackPoints[i+4].map( 0, 1, 0, alpha )*this.globalAlpha : 0;

			ig.system.context.translate( x, y );
			ig.system.context.rotate( (Math.random()*360).toRad() );
			ig.system.context.translate( -x, -y );

			var side = size*2.25;
			var h = side * (Math.sqrt(3)/2);
	        ig.system.context.moveTo( x, (-h/2)+y );
	        ig.system.context.lineTo( (-side/2)+x, (h/2)+y );
	        ig.system.context.lineTo( (side/2)+x, (h/2)+y );
	        ig.system.context.lineTo( x, (-h/2)+y );

			ig.system.context.closePath();
			ig.system.context.fill();

			ig.system.context.restore();
		}

		ig.system.context.restore();

		ig.system.context.restore();
	}
});

});
