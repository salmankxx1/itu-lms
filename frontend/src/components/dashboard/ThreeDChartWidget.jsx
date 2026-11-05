import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// 3D Animated Bar with Hover Glow & Tooltip
function AnimatedBar({ position, targetHeight, color }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, delta * 3.5);
      meshRef.current.position.y = (meshRef.current.scale.y * 1.5) / 2;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, 0.75, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.75, 1.5, 0.75]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.15}
          metalness={0.7}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.25}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Pedestal Base */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D Glass Platform Grid with Cosmic Glow
function ChartPlatform() {
  return (
    <group position={[0, -0.1, 0]}>
      <RoundedBox args={[7.6, 0.2, 5.2]} radius={0.1} smoothness={4} position={[0, -0.1, 0]}>
        <meshPhysicalMaterial
          color="#070913"
          roughness={0.1}
          metalness={0.85}
          reflectivity={1}
          clearcoat={0.8}
          transmission={0.3}
        />
      </RoundedBox>
      <gridHelper args={[7.2, 8, "#38bdf8", "#1e293b"]} position={[0, 0.015, 0]} />
    </group>
  );
}

// Floating Cosmic Torus Ring
function FloatingMetricRing({ position, color = "#38bdf8" }) {
  const ringRef = useRef();
  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.x += 0.015;
      ringRef.current.rotation.y += 0.02;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={1.5} floatIntensity={1.2}>
      <mesh ref={ringRef} position={position}>
        <torusGeometry args={[0.55, 0.14, 16, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.15}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
}

export default function ThreeDChartWidget({ data = [] }) {
  const chartData = data.slice(0, 5);
  const largest = Math.max(1, ...chartData.map((item) => item.value));

  return (
    <div
      style={{
        width: "100%",
        height: "clamp(280px, 50vw, 360px)",
        position: "relative",
        background: "radial-gradient(circle at 50% 20%, rgba(15, 23, 42, 0.95) 0%, #070913 100%)",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid rgba(56, 189, 248, 0.3)",
        boxShadow: "0 15px 35px -5px rgba(0,0,0,0.6), 0 0 30px rgba(56, 189, 248, 0.2)",
      }}
    >
      {/* Legend */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          zIndex: 5,
          pointerEvents: "none",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          color: "#e2e8f0",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {chartData.map((item) => (
          <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
            {item.label}: {item.value}
          </span>
        ))}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 4.5, 6.8], fov: 45 }}
        style={{ width: "100%", height: "100%", cursor: "grab" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 14, 8]} intensity={1.8} color="#e0f2fe" />
        <pointLight position={[-6, 5, -4]} intensity={1} color="#06b6d4" />
        <pointLight position={[6, 3, 5]} intensity={0.9} color="#a855f7" />

        <ChartPlatform />

        {chartData.map((item, index) => {
          const xPos = (index - (chartData.length - 1) / 2) * 1.25;
          return (
            <AnimatedBar
              key={index}
              position={[xPos, 0, 0]}
              targetHeight={Math.max(0.05, (item.value / largest) * 1.7)}
              color={item.color}
            />
          );
        })}

        <FloatingMetricRing position={[2.8, 3.2, -1.2]} color="#06b6d4" />
        <FloatingMetricRing position={[-2.8, 2.8, -1.5]} color="#a855f7" />

        <OrbitControls
          enableZoom={true}
          enableRotate={true}
          enablePan={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
          minDistance={3.5}
          maxDistance={12}
        />
      </Canvas>
    </div>
  );
}
