class Geometry {
    constructor(mesh_id, material_id) {
        this.mesh = mesh_id;
        this.material = material_id;
    }
}

class Material {

    constructor(uniforms, program_id){
        this.uniforms = uniforms;
        this.program_id = program_id;
    }
}


class PointLight {
    constructor(color, intensity, shadow, shadow_res){
        color = vec3.clone(color);
        this.color = color;
        this.intensity = intensity;
        this.radius = Math.sqrt(20 * vec3.length(color) * intensity);
        this.shadow = shadow;
        this.shadow_res = shadow_res;
        this.shadow_cube = gl.createTexture();
        this.shadow_cube.is_cube = true;
        this.depth_renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.shadow_res, this.shadow_res, this.depth_renderbuffer);
        let Vec3 = vec3.fromValues;
        this.shadow_fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_fbo);
        this.cube_face_matrix = new Map(
            [[gl.TEXTURE_CUBE_MAP_POSITIVE_X, mat4.lookAt(mat4.create(), Vec3(0,0,0), Vec3(1,0,0),  Vec3(0,-1,0))],
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, mat4.lookAt(mat4.create(), Vec3(0,0,0), Vec3(-1,0,0), Vec3(0,-1,0))],
            [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, mat4.lookAt(mat4.create(), Vec3(0,0,0), Vec3(0,-1,0),  Vec3(0,0,-1))],
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, mat4.lookAt(mat4.create(), Vec3(0,0,0), Vec3(0,1,0), Vec3(0,0,1))],
            [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, mat4.lookAt(mat4.create(), Vec3(0,0,0), Vec3(0,0,1),  Vec3(0,-1,0))],
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, mat4.lookAt(mat4.create(), Vec3(0,0,0), Vec3(0,0,-1), Vec3(0,-1,0))]]
        );

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadow_cube);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        for (const [k,v] of this.cube_face_matrix.entries()) {
            console.log(k);
            gl.texImage2D(k, 0, gl.RGBA32F, 
                         this.shadow_res, this.shadow_res, 0, gl.RGBA, gl.FLOAT, null);
        }

        

        gl.clearColor(this.radius,this.radius * this.radius,0.0,1);
        for (const [k,v] of this.cube_face_matrix.entries()) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, k, this.shadow_cube, 0);
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_renderbuffer);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.RENDERBUFFER, this.depth_renderbuffer);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        this.projection_matrix = mat4.create();
        mat4.perspective(this.projection_matrix, glMatrix.toRadian(90), 1, 0.01, this.radius);
    }

    update_shadow_map(v) {
        /*
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0,0,800,600);
        gl.drawBuffers([gl.BACK]);
        /*/
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_fbo);
        gl.viewport(0,0,this.shadow_res, this.shadow_res);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        /**/
        gl.clearColor(this.radius, this.radius * this.radius, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.cullFace(gl.FRONT);
        gl.disable(gl.BLEND);
        for (const [k,v_mat] of this.cube_face_matrix.entries()) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, k, this.shadow_cube, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            scene.traverse("geometry", scene.scene_root, mat4.create(), (geo, m) => {
                let material = mat.mat_cache["variance_depth.json"];
                let v_mat_inv = mat4.create();
                mat4.invert(v_mat_inv, v_mat);
                let view = mat4.clone(v);
                mat4.multiply(view, v_mat_inv, view);
                let uniforms = {
                    m: m,
                    p: this.projection_matrix,
                    v: view
                };
                let program  = material.program_id;

                let gmesh = mesh.meshes[geo.mesh];
                let indexes = gmesh.indexBuffer;

                let attribute_arrays = {
                    "position" : gmesh.vertexBuffer,
                }

                scene.render_opaque_geometry_call(uniforms, attribute_arrays, indexes, program);
            });
        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadow_cube);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.cullFace(gl.BACK);
        gl.viewport(0,0,800, 600);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

class DirectionalLight {
    constructor(color, intensity, shadow, shadow_size, shadow_res) {
        color = vec3.clone(color)
        this.color = color;
        this.intensity = intensity;
        this.shadow_fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_fb);
        this.shadow = shadow;
        this.shadow_tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadow_tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, shadow_res, shadow_res, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadow_tex, 0);

        this.depth_buffer_tex = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_buffer_tex);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, shadow_res, shadow_res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_fb);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_buffer_tex);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.shadow_res = shadow_res;
        this.projection_matrix = mat4.create();
        gl.generateMipmap(gl.TEXTURE_2D);

        mat4.ortho(this.projection_matrix, 
            -shadow_size, shadow_size,
            -shadow_size, shadow_size,
            0, 100);
    }

    update_shadow_map(v) {
        /*
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0,0,800,600);
        gl.drawBuffers([gl.BACK]);
        /*/
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_fb);
        gl.viewport(0,0,this.shadow_res, this.shadow_res);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        /**/
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.cullFace(gl.FRONT);
        gl.disable(gl.BLEND);

        scene.traverse("geometry", scene.scene_root, mat4.create(), (geo, m) => {
            let material = mat.mat_cache["variance_depth.json"];

            let uniforms = {
                m: m,
                p: this.projection_matrix,
                v: v
            };
            let program  = material.program_id;

            let gmesh = mesh.meshes[geo.mesh];
            let indexes = gmesh.indexBuffer;

            let attribute_arrays = {
                "position" : gmesh.vertexBuffer,
            }

            scene.render_opaque_geometry_call(uniforms, attribute_arrays, indexes, program);
        });
        gl.bindTexture(gl.TEXTURE_2D, this.shadow_tex);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.cullFace(gl.BACK);
        gl.viewport(0,0,800, 600);
    }
}

class Camera {
    constructor(fov, aspect_ratio, orthosize=50, framebuffer=0) {
        this.fov          = fov
        this.aspect_ratio = aspect_ratio;
        this.orthosize    = orthosize;
        this.framebuffer  = framebuffer;
        this.projection_matrix = mat4.create();
        mat4.perspective(this.projection_matrix, fov, aspect_ratio, 0.01, 100);
    }

}
