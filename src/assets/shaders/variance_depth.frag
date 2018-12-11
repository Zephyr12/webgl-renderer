#version 300 es
precision mediump float;

out vec2 variance_rt;

void main(){
    float z = 1.0;
    variance_rt = vec2(z,z*z);
}
