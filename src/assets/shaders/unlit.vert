#version 300 es

in vec2 position;

out vec2 f_texcoord;

void main() {
    gl_Position = vec4(position,0,1);
    f_texcoord = 0.5*(position + vec2(1));
}
