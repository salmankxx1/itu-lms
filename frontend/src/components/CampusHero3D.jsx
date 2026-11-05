import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Box, RoundedBox, OrbitControls } from "@react-three/drei";

// Modern 3D architectural Campus Building representing Burki Road Campus
function CampusBuilding({ position, color = "#0284c7" }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Main Administrative / Academic Tower */}
      <RoundedBox args={[2.2, 3.8, 1.8]} radius={0.1} smoothness={4} position={[0, 1.9, 0]}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
          transparent
          opacity={0.92}
        />
      </RoundedBox>

      {/* Tech Glass Facade Windows */}
      <Box args={[2.0, 3.2, 1.9]} position={[0, 1.9, 0]}>
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.6}
          opacity={0.8}
          transparent
          roughness={0.1}
          ior={1.5}
        />
      </Box>

      {/* West Wing - Research Center */}
      <RoundedBox args={[1.8, 2.2, 1.6]} radius={0.08} smoothness={4} position={[-2.1, 1.1, 0.2]}>
        <meshStandardMaterial color="#0369a1" roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* East Wing - Innovation & AI Labs */}
      <RoundedBox args={[1.8, 2.6, 1.6]} radius={0.08} smoothness={4} position={[2.1, 1.3, -0.2]}>
        <meshStandardMaterial color="#0f766e" roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* Campus Ground Podium */}
      <Box args={[7.5, 0.2, 5]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
      </Box>

      {/* Futuristic Orbiting Technology Node */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <Sphere args={[0.3, 32, 32]} position={[0, 4.4, 0]}>
          <MeshDistortMaterial color="#38bdf8" distort={0.4} speed={3} roughness={0} />
        </Sphere>
      </Float>
    </group>
  );
}

// Particle field representing digital data & tech nodes
function TechParticles({ count = 80 }) {
  const points = useRef();

  const [particlesPosition] = useState(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 15;
      positions[i + 1] = Math.random() * 8 - 1;
      positions[i + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  });

  useFrame(() => {
    if (points.current) {
      points.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlesPosition, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#38bdf8"
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

export default function CampusHero3D() {
  return (
    <div style={{ width: "100%", height: "480px", position: "relative" }}>
      <Canvas
        camera={{ position: [5, 4.5, 7.5], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} color="#e0f2fe" />
        <pointLight position={[-8, 6, -5]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[5, -2, 4]} intensity={0.8} color="#0284c7" />

        <CampusBuilding position={[0, -1, 0]} />
        <TechParticles />

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>

      {/* Floating 3D Badge Info */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "20px",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }}></span>
        <span>Interactive 3D View: <strong>Burki Road Campus Model</strong> (Drag to rotate)</span>
      </div>
    </div>
  );
}
