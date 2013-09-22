ig.module(
	'game.entities.3d'
)
.requires(
	'impact.entity',
    'game.enums'
)
.defines(function(){

Entity3d = ig.Entity.extend({
    size: { x: 16, y: 16 },
    team: 0,
    active: true,
    flags: {},
    nodeSize: 0,
    firewall: false,


    init: function( x, y, settings ) {
        this.parent( x, y, settings );
    },
    
    
    init3d: function() {

        // set up

        var mesh, object, geometry, material, point, light, vertex;

        var posx = (this.pos.x + this.size.x*0.5);
        var posy = -(this.pos.y + this.size.y*0.5);
        var z0 = 0.5;
        var z1 = 1;
        var z2 = 2;
        var z3 = 24;

        this.object3d = new THREE.Object3D();
        this.object3d._igEntity = this; 
        this.object3d.name = 'node' + this.id;

        var color1 =
            this.team === Team.NONE ? 0x666666 :
            this.team === Team.RED ? 0xff0000 :
            this.team === Team.GREEN ? 0x00ff00 :
            this.team === Team.BLUE ? 0x0000ff :
            this.team === Team.PURPLE ? 0xff00ff :
            this.team === Team.ORANGE ? 0xff8800 :
            0x00ffff;
        var color2 =
            this.team === Team.NONE ? 0x666666 :
            this.team === Team.RED ? 0x880000 :
            this.team === Team.GREEN ? 0xffff00 :
            this.team === Team.BLUE ? 0x668888 :
            this.team === Team.PURPLE ? 0x0088ff :
            this.team === Team.ORANGE ? 0xff0088 :
            0x8866ff;



        // mouse hitbox

        object = new THREE.Object3D();
        object.name = 'marker';

        mesh = new THREE.Mesh(
            new THREE.CubeGeometry( 20, 20, 32 ), 
            new THREE.MeshNormalMaterial()
        );
        mesh.overdraw = true;
        mesh.position.x = posx;
        mesh.position.y = posy;
        mesh.position.z = 16;
        mesh.visible = false;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        mesh.name = 'mouse-hitbox';
        object.add( mesh );



        // tile marker

        mesh = new THREE.Mesh(
            new THREE.PlaneGeometry( 14, 14 ), 
            new THREE.MeshBasicMaterial({
                color: color1,
                wireframe: true,
                shading: THREE.FlatShading
            })
        );
        mesh.overdraw = true;
        mesh.position.x = posx;
        mesh.position.y = posy;
        mesh.position.z = z2;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        mesh.name = 'tile';
        object.add( mesh );



        // crystal

        mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry( 8 ), 
            new THREE.MeshLambertMaterial({
                color: 0xdddddd,
                wireframe: !this.active,
                shading: THREE.FlatShading
            })
        );
        mesh.overdraw = true;
        mesh.position.x = posx;
        mesh.position.y = posy;
        mesh.position.z = 24;
        mesh.name = 'crystal';
        object.add( mesh );

        ig.game.nodes.push( object );
        this.object3d.add( object );



        // shading

        light = new THREE.SpotLight( color1, 1.25 );
        light.position.x = posx;
        light.position.y = posy;
        light.position.z = 64;
        light.target = mesh;
        this.object3d.add( light );

        light = new THREE.SpotLight( color2, 0.75 );
        light.position.x = posx;
        light.position.y = posy - 32;
        light.position.z = 64;
        light.target = mesh;
        this.object3d.add( light );

        light = new THREE.PointLight( color1, 0.25 );
        light.position.x = posx;
        light.position.y = posy;
        light.position.z = 4;
        this.object3d.add( light );



        // outlines

        var lineMaterial = new THREE.LineBasicMaterial({ 
            color: color1, 
            transparent: true, 
            opacity: 0.7
        });
        var planeMaterial = new THREE.MeshBasicMaterial({ 
            color: color1, 
            transparent: true, 
            opacity: 0.15
        });
        var createPlane = function( x1, y1, x2, y2 ) {
            mesh = new THREE.Mesh( new THREE.PlaneGeometry( x1*16, y1*16 ), planeMaterial );
            mesh.overdraw = true;
            mesh.position.x = posx+(x2*16);
            mesh.position.y = posy+(y2*16);
            mesh.position.z = z0;
            THREE.GeometryUtils.merge( geometry, mesh );
        };


        if( this.nodeSize === 0 ) {
            geometry = new THREE.Geometry();
            createPlane( 1, 1, 0, 1 );
            createPlane( 3, 1, 0, 0 );
            createPlane( 1, 1, 0, -1 );

            geometry.computeFaceNormals();
            mesh = new THREE.Mesh( geometry, planeMaterial );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.visible = false;
            mesh.name = 'hover';
            this.object3d.add( mesh );


            geometry = new THREE.Geometry();
            geometry.vertices.push( new THREE.Vector3(posx-8, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-16, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-16, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-32, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-32, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-16, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx-8, posy+8+16, z1) );

            mesh = new THREE.Line( geometry, lineMaterial );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.visible = false;
            mesh.name = 'outline';
            this.object3d.add( mesh );
        }


        if( this.nodeSize === 1 ) {
            geometry = new THREE.Geometry();
            createPlane( 3, 3, 0, 0 );

            geometry.computeFaceNormals();
            mesh = new THREE.Mesh( geometry, planeMaterial );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.visible = false;
            mesh.name = 'hover';
            this.object3d.add( mesh );


            geometry = new THREE.Geometry();
            geometry.vertices.push( new THREE.Vector3(posx-8-16, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx-8-16, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx-8-16, posy+8+16, z1) );

            mesh = new THREE.Line( geometry, lineMaterial );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.visible = false;
            mesh.name = 'outline';
            this.object3d.add( mesh );
        }


        if( this.nodeSize === 2 ) {
            geometry = new THREE.Geometry();
            createPlane( 1, 1, 0, 2 );
            createPlane( 3, 1, 0, 1 );
            createPlane( 5, 1, 0, 0 );
            createPlane( 3, 1, 0, -1 );
            createPlane( 1, 1, 0, -2 );

            geometry.computeFaceNormals();
            mesh = new THREE.Mesh( geometry, planeMaterial );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.visible = false;
            mesh.name = 'hover';
            this.object3d.add( mesh );

            
            geometry = new THREE.Geometry();
            geometry.vertices.push( new THREE.Vector3(posx-8, posy+8+32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8+32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+32, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+32, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8+16, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8, posy+8-48, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-16, posy+8-48, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-16, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-32, posy+8-32, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-32, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-48, posy+8-16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-48, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-32, posy+8, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-32, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx+8-16, posy+8+16, z1) );
            geometry.vertices.push( new THREE.Vector3(posx-8, posy+8+32, z1) );

            mesh = new THREE.Line( geometry, lineMaterial );
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mesh.visible = false;
            mesh.name = 'outline';
            this.object3d.add( mesh );
        }


        // firewall shield effect

        this.firewallLines = [];
        var origGeometry = geometry.clone();
        if( this.firewall ) {
            for( var i = 0; i < 6; i++ ) {
                geometry = origGeometry.clone();
                for( var k = 0; k < geometry.vertices.length; k++ ) {
                    vertex = geometry.vertices[k];
                        console.log( k, geometry.vertices.length-1 );
                    if( k === geometry.vertices.length-1 ) {
                        vertex.x = geometry.vertices[0].x;
                        vertex.y = geometry.vertices[0].y;
                        vertex.z = geometry.vertices[0].z;
                    }
                    else {
                        vertex.x += Math.random()-0.5;
                        vertex.y += Math.random()-0.5;
                        vertex.z = (Math.random()*3-1.5);
                    }
                }
                lineMaterial = new THREE.LineBasicMaterial({ 
                    color: i%2===0?color1:color2, 
                    transparent: true,
                    blending: THREE.AdditiveBlending
                });
                mesh = new THREE.Line( geometry, lineMaterial );
                mesh.position.x = 0;
                mesh.position.y = 0;
                mesh.position.z = i*3+1;
                this.firewallLines.push( mesh );
                this.object3d.add( mesh );
            }
        }


        // data

        geometry = new THREE.Geometry();
        material = new THREE.MeshLambertMaterial({ 
            color: 0xffffff, 
            shading: THREE.FlatShading, 
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        mesh = new THREE.Mesh( new THREE.TetrahedronGeometry( 1 ), material ); 

        for( var i = 0; i < 25; i++ ) {
            point = this.randomSpherePoint( 
                (this.pos.x + this.size.x*0.5),
                -(this.pos.y + this.size.y*0.5),
                z3, 8.5
            );

            mesh.overdraw = true;
            mesh.position = point;
            mesh.rotation.x = (Math.random()*360).toRad();
            mesh.rotation.y = (Math.random()*360).toRad();
            mesh.rotation.z = (Math.random()*360).toRad();

            THREE.GeometryUtils.merge( geometry, mesh );
        }

        geometry.computeFaceNormals();
        mesh = new THREE.Mesh( geometry, material );
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        mesh.name = 'data';
        this.object3d.add( mesh );



        ig.game.level.add( this.object3d );
    },


    randomSpherePoint: function( x0, y0, z0, radius ) {
        radius += Math.random()*2;
        var u = Math.random();
        var v = Math.random();
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
        var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
        var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
        var z = z0 + (radius * Math.cos(phi));

        return new THREE.Vector3( x, y, z );
    },


    hover: function( evt ) {
        this.flags.showOutline = true; 
    },


    click: function( evt ) {

    },


    update: function() {
        this.parent();

        var mesh;
        var min = 0.17;

        // rotate crystal
        mesh = this.object3d.getObjectByName( 'crystal', true );
        mesh.rotation.x += 0.02;
        mesh.rotation.y += 0.0225;
        mesh.rotation.z += 0.0175;


        // fade out data with zoom
        mesh = this.object3d.getObjectByName( 'data' );
        if( mesh && mesh.material ) {
            if( ig.game.zoom > min ) {
                mesh.material.opacity = ig.game.zoom.map( min, min+0.1, 0.1, 1 );
                mesh.visible = true;
            } 
            else {
                mesh.visible = false;
            }
        }

        // show/hide outline on hover
        if( this.flags.showOutline ) {
            this.object3d.getObjectByName( 'outline' ).visible = true;
            this.object3d.getObjectByName( 'hover' ).visible = true;
        }
        else {
            this.object3d.getObjectByName( 'outline' ).visible = false;
            this.object3d.getObjectByName( 'hover' ).visible = false;
        }

        // animate lines
        if( this.firewall ) {
            for( var i = 0; i < this.firewallLines.length; i++ ) {
                mesh = this.firewallLines[i];
                if( ig.game.zoom > min ) {
                    mesh.position.z += 0.05;
                    if( mesh.position.z < 2 ) {
                        mesh.material.opacity = mesh.position.z.map( 1, 2, 0, this.flags.showOutline?0.7:0.35 );
                    } else {
                        mesh.material.opacity = mesh.position.z.map( 2, 18, this.flags.showOutline?0.7:0.35, 0 );
                    }
                    mesh.material.opacity = ig.game.zoom.map( min, min+0.1, 0, mesh.material.opacity );
                    mesh.visible = true;
                    if( mesh.position.z > 18+1 ) {
                        mesh.position.z = 1;
                    }
                }
                else {
                    mesh.visible = false;
                }
            }
        }

        // reset flags
        this.flags.showOutline = false;
    }
});

});