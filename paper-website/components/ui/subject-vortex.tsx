"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars, Sparkles, OrbitControls, Billboard } from "@react-three/drei";
import { useMemo, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Helper to sanitize subject names for URLs
function sanitizeKey(key: string): string {
  return key
    .replace(/‐/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/[^\x20-\x7E]/g, '_');
}

// Individual Subject Card
function SubjectItem({ 
  text, 
  position, 
  color = "#ffffff", 
  onClick 
}: { 
  text: string; 
  position: [number, number, number]; 
  color?: string; 
  onClick: (subject: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  
  // Smoothly animate hover state
  const targetScale = hovered ? 1.2 : 1;
  const targetColor = hovered ? "#ffffff" : color;

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
      <group position={position}>
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false} 
        >
          <group
            onClick={() => onClick(text)}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
            scale={targetScale}
          >
            {/* Glass Card Background */}
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[3.5, 1.2, 0.1]} />
              <meshPhysicalMaterial 
                color={hovered ? "#3b82f6" : "#1e293b"} // Blue on hover, dark slate otherwise
                transparent
                opacity={0.6}
                roughness={0.2}
                metalness={0.1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing Border/Rim */}
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[3.55, 1.25, 0.08]} />
              <meshBasicMaterial color={targetColor} transparent opacity={0.3} wireframe />
            </mesh>

            {/* Subject Text */}
            <Text
              position={[0, 0, 0.06]} // Slightly in front of card
              fontSize={0.35}
              fontWeight="bold"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              maxWidth={3.2}
              textAlign="center"
            >
              {text.toUpperCase()}
            </Text>
          </group>
        </Billboard>
      </group>
    </Float>
  );
}

// The Helix Scene Configuration
function HelixScene({ subjects, onSelect }: { subjects: string[], onSelect: (s: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Rotate the whole helix slowly
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  // Calculate positions for helix
  const items = useMemo(() => {
    const spacing = 1.2; // Increased for cards
    const radius = 7;    // Wider radius
    const turns = 2;     // Fewer turns for cleaner look
    const anglePerItem = (turns * Math.PI * 2) / subjects.length;

    return subjects.map((subject, i) => {
      const angle = i * anglePerItem;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (i - subjects.length / 2) * spacing;
      
      // Assign random nice colors
      const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#ec4899", "#06b6d4"];
      const color = colors[i % colors.length];

      return { subject, position: [x, y, z] as [number, number, number], color };
    });
  }, [subjects]);

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <SubjectItem 
          key={i} 
          text={item.subject} 
          position={item.position}
          color={item.color}
          onClick={onSelect}
        />
      ))}
    </group>
  );
}

// Main Component
export default function SubjectVortex({ subjects }: { subjects: string[] }) {
  const router = useRouter();

  const handleSelect = (subject: string) => {
    router.push(`/questions/${encodeURIComponent(subject)}`);
  };

  // Fallback for empty state or loading (though this component assumes data is passed)
  if (!subjects || subjects.length === 0) {
    return <div className="text-center p-10 text-muted-foreground">No subjects found.</div>;
  }

  return (
    <div className="w-full h-[600px] relative bg-black/90 rounded-xl overflow-hidden shadow-2xl border border-white/10">
       {/* Overlay instruction */}
       <div className="absolute top-4 left-0 w-full text-center z-10 pointer-events-none">
        <p className="text-white/50 text-sm uppercase tracking-widest font-light">
          Drag to Rotate • Click to Select
        </p>
      </div>

      <Canvas camera={{ position: [0, 0, 18], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <HelixScene subjects={subjects} onSelect={handleSelect} />
          
          {/* Environment Effects */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#4f46e5" />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={false} 
            maxDistance={30}
            minDistance={5}
          />
          
          <fog attach="fog" args={['#050505', 10, 40]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
