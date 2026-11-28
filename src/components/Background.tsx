import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./Background.css";

//Vertex shader: sijoittaa koko ruudun peittävän neliön (PlaneGeometry(2, 2))
//suoraan näytön koordinaatteihin ja välittää UV-koordinaatit fragment shaderille.
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

//Fragment shader: laskee jokaisen pikselin värin ruudulla ajan ja paikan mukaan.
const fragmentShader = `
  uniform float uTime;       // Kulunut aika sekunteina (päivittyy animaatioloopissa)
  uniform vec2 uResolution;  // Ruudun koko pikseleinä (leveys, korkeus)

  varying vec2 vUv;

  // Näennäissatunnainen hash-funktio 2D-koordinaatille (perusta kohinalle)
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Pehmeä 2D-arvokohina (value noise) tasaisella interpoloinnilla
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Hermite-tasoitus (smoothstep-käyrä), jotta siirtymät eivät ole teräviä
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // Fractal Brownian Motion (fBm): yhdistää useita kohinakerroksia luonnolliseen liikkeeseen.
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 1.8;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    // Keskitetään koordinaatit ja huomioidaan näytön kuvasuhde
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Hieman rauhallisempi, sulava liike
    float t = uTime * 0.18;

    // Pehmeä virtaus, joka taivuttaa aaltoa orgaanisesti
    float flow = fbm(vec2(p.x * 0.7 + t * 0.4, p.y * 0.7 - t * 0.3));

    // Pääaalto: leveämpi S-kaari, joka kulkee myös kortin takaa ja kohti alareunaa
    float waveY = sin(p.x * 1.45 + t + flow * 1.8) * 0.24 - 0.14;

    // Toinen, pehmeämpi aaltokerros syvyyden luomiseksi
    float waveY2 = cos(p.x * 1.1 - t * 0.65 + flow * 1.4) * 0.18 - 0.22;

    // Etäisyydet aaltojen keskiviivoihin
    float d1 = abs(p.y - waveY);
    float d2 = abs(p.y - waveY2);

    // Leveä pehmeä violetti hehku (suurempi leveys = paksumpi valoalue)
    float broadGlow = exp(-d1 * 1.45) * 0.65 + exp(-d2 * 1.8) * 0.45;

    // Paksu, silkkimäinen pääaalto (ei ohut viiva)
    float silkBand = exp(-d1 * 3.4);

    // Leveähkö vaalea/helmiäinen kiilto aallon yläreunassa (luo kiiltävän 3D-tunnelman)
    float sheen = exp(-pow((p.y - (waveY + 0.06)) * 6.5, 2.0));

    // Syvä tumma taustasävy
    vec3 color = vec3(0.012, 0.008, 0.025);

    // Värisävyt: syvä violetti, kirkas lila ja vaalea helmiäis-/laventelihohto
    vec3 deepPurple = vec3(0.26, 0.04, 0.58);
    vec3 brightViolet = vec3(0.58, 0.22, 0.98);
    vec3 pearlSheen = vec3(0.92, 0.85, 1.0);

    // Yhdistetään kerrokset
    color += deepPurple * broadGlow;
    color += brightViolet * silkBand * 0.85;
    color += pearlSheen * sheen * 0.65;

    // Häivytetään vain aivan ulkoreunoja, jotta liike näkyy keskikortin takana
    float vignette = 1.0 - smoothstep(0.75, 1.65, length(p));
    color *= mix(0.5, 1.0, vignette);

    // Pehmeä sävykartoitus
    color = color / (1.0 + color * 0.3);
    color = pow(color, vec3(0.88));

    gl_FragColor = vec4(color, 1.0);
  }
`;

function Background() {

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;


        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;


        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);


        const uniforms = {
            uTime: { value: 0 },
            uResolution: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight),
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


        const timer = new THREE.Timer();
        let animationId = 0;

        function animate(timestamp?: number) {
            animationId = requestAnimationFrame(animate);

            timer.update(timestamp);
            uniforms.uTime.value = timer.getElapsed();

            renderer.render(scene, camera);
        }

        animate();


        function handleResize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
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