#version 300 es
precision mediump float;

in vec2 f_texcoord;

/* world parameters */
uniform sampler2D diffuse_tex;
uniform sampler2D gbuffer;
uniform sampler2D mat_buffer;

/* camera parameters */
uniform mat4 proj;
uniform mat4 view;

/* light parameters (directional) */
uniform vec4 l;
uniform vec3 col;
uniform float intensity;

out vec4 c;

vec3 reconstruct_normal(vec2 n) {
    return vec3(n, 1.0 - length(n));
}

void main(){
    vec4 d = texture(diffuse_tex, f_texcoord);
    vec4 g = texture(gbuffer, f_texcoord);
    vec4 m = texture(mat_buffer, f_texcoord);
    vec3 n = reconstruct_normal(g.xy);
    vec3 v = vec3(0,0,1);
    vec3 l_clip = (proj * view * l).xyz;

    c = vec4(dot(n, l_clip), 0 , 0, 1);
}
