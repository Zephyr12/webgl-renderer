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
    constructor(color, intensity){
        color = vec3.clone(color);
        this.color = color;
        this.intensity = intensity;
        this.radius = Math.sqrt(20 * vec3.length(color) * intensity);
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
