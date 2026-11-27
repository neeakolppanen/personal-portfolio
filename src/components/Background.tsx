
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./Background.css";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float time = uTime * 0.16;

    // Organic movement
    vec2 q = vec2(
      fbm(p * 2.0 + vec2(time, 0.0)),
      fbm(p * 2.0 + vec2(0.0, -time))
    );

    vec2 warped = p + (q - 0.5) * 0.65;

    // Flowing ribbon structures
    float wave = sin(
      warped.x * 2.2 +
      warped.y * 3.0 +
      fbm(warped * 2.5) * 4.0 +
      time
    );

    float distance = abs(warped.y - wave * 0.20);

    float ribbon = exp(-distance * 8.0);
    float innerLight = exp(-distance * 24.0);

    // Additional organic light layers
    float folds = sin(
      warped.x * 4.0 -
      warped.y * 5.0 +
      fbm(warped * 4.0) * 5.0 -
      time * 1.5
    );

    float secondary = exp(
      -abs(warped.y - folds * 0.11 - 0.12) * 13.0
    );

    // Soft volumetric glow
    float glow = exp(-distance * 3.0);

    vec3 color = vec3(0.008, 0.004, 0.015);

    color += vec3(0.16, 0.015, 0.36) * ribbon * 0.8;
    color += vec3(0.42, 0.025, 0.85) * innerLight * 0.75;
    color += vec3(0.24, 0.015, 0.55) * secondary * 0.55;
    color += vec3(0.12, 0.005, 0.3) * glow * 0.55;

    // Fine light details
    float detail = fbm(warped * 12.0 + time);
    color += vec3(0.16, 0.035, 0.24) * detail * ribbon;

    // Fade towards the edges
    float vignette = smoothstep(1.0, 1.0, length(p));
    color *= vignette;

    // Subtle overall light
    color = pow(color, vec3(0.85));

    gl_FragColor = vec4(color, 1.0);
  }
`;

function Background() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();

        const camera = new THREE.OrthographicCamera(
            -1, 1, 1, -1, 0.1, 10
        );

        camera.position.z = 1;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.5)
        );

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        container.appendChild(renderer.domElement);

        const uniforms = {
            uTime: { value: 0 },
            uResolution: {
                value: new THREE.Vector2(
                    window.innerWidth,
                    window.innerHeight
                ),
            },
        };

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);

        scene.add(mesh);

        const clock = new THREE.Clock();
        let animationId = 0;

        function animate() {
            animationId = requestAnimationFrame(animate);

            uniforms.uTime.value = clock.getElapsedTime();

            renderer.render(scene, camera);
        }

        animate();

        function handleResize() {
            renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );

            uniforms.uResolution.value.set(
                window.innerWidth,
                window.innerHeight
            );
        }

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);

            geometry.dispose();
            material.dispose();
            renderer.dispose();

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className="background" />;
}

export default Background;
