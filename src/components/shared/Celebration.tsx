import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--accent))", "hsl(var(--warning))"];

interface CelebrationProps {
  /** Flip this from false to true (or increment a key) to fire a burst. */
  trigger: boolean;
  particleCount?: number;
}

/** A small dependency-free confetti burst for success moments (diary submit, story complete). */
export function Celebration({ trigger, particleCount = 20 }: CelebrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [burstId, setBurstId] = useState(0);
  const [prevTrigger, setPrevTrigger] = useState(trigger);

  // Fire a new burst the instant `trigger` flips to true. Adjusting state
  // directly during render (rather than in an effect) is the React-recommended
  // pattern for "sync state from a prop change" -- see the same pattern in
  // ChildReader.tsx / StoryReader.tsx.
  if (trigger !== prevTrigger) {
    setPrevTrigger(trigger);
    if (trigger && !prefersReducedMotion) {
      setBurstId((id) => id + 1);
    }
  }

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <AnimatePresence>{burstId > 0 && <Burst key={burstId} particleCount={particleCount} />}</AnimatePresence>
    </div>
  );
}

function Burst({ particleCount }: { particleCount: number }) {
  // Lazy useState initializer: the recommended escape hatch for one-time
  // impure computation (Math.random) that must not re-run on every render.
  const [particles] = useState(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 70 + Math.random() * 70;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        shape: i % 3 === 0,
      };
    })
  );

  return (
    <>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={p.shape ? "absolute h-2 w-2 rounded-full" : "absolute h-2.5 w-2.5 rounded-sm"}
          style={{ backgroundColor: p.color }}
        />
      ))}
    </>
  );
}
