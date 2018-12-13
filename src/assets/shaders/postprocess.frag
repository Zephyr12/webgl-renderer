#version 300 es

precision mediump float;

in vec2 f_texcoord;

uniform sampler2D diffuse_tex;

out vec4 c;

void main() {
    vec4 c_  = texture(diffuse_tex, f_texcoord, 0.0);
    c = vec4(vec3(c_.xyz), 1.0);
}
