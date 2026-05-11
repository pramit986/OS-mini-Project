import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const hoverEffect = {
  scale: 1.02,
  y: -5,
  transition: { type: 'spring', stiffness: 400, damping: 25 },
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  cursor: 'default'
}

export function LandingPage({ onStart }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.95 }}
      variants={containerVariants}
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Top Navigation Bar */}
      <motion.nav 
        variants={itemVariants}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--os-border)',
          background: 'rgba(6,10,15,0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="MemOS Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.01em' }} className="gradient-text">
            MemOS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a 
            href="#info" 
            className="os-btn"
            style={{ textDecoration: 'none' }}
          >
            More Info
          </a>
          <a 
            href="https://github.com/pramit986/OS-mini-Project" 
            target="_blank" 
            rel="noopener noreferrer"
            className="os-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
          </a>
          <button 
            className="os-btn os-btn-primary" 
            onClick={onStart}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '6px 14px' }}
          >
            Start Simulation ▶
          </button>
        </div>
      </motion.nav>

      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '3rem 2rem' }}>
        
        {/* Header Section (Removed Large Logo/Name, added clear title) */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '1rem' }}>
          <h1 
            style={{ 
              fontSize: '3rem', 
              fontWeight: 800, 
              letterSpacing: '-0.02em',
              marginBottom: '1.2rem',
              color: 'var(--os-text)'
            }}
          >
            Interactive <span className="gradient-text">Virtual Memory</span> Simulator
          </h1>
          <p style={{ color: 'var(--os-text-dim)', fontSize: '1.2rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
            A comprehensive tool supporting demand paging, multiple page replacement algorithms, dynamic frame allocation, and graphical fault-rate analysis.
          </p>
        </motion.div>

        {/* Section: Overview & Objectives */}
        <motion.div id="info" variants={itemVariants} style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--os-text)', marginBottom: '1rem', borderBottom: '1px solid var(--os-border)', paddingBottom: '0.5rem' }}>
            1. Overview & Objectives
          </h3>
          <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
            <p style={{ color: 'var(--os-text)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              Design and implement a Virtual Memory Simulator that supports demand paging, simulates four page replacement algorithms, displays a dynamic frame allocation table after each reference, and performs graphical fault-rate analysis.
            </p>
            <ul style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
              <li>Simulate demand paging with a configurable number of frames.</li>
              <li>Implement FIFO, LRU, Optimal, and Second Chance (Clock) page replacement.</li>
              <li>Display frame contents and page fault/hit status after each reference step.</li>
              <li>Analyze page fault rate as a function of frame count (demonstrate working set effect).</li>
              <li>Compare performance across all four algorithms graphically.</li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Section: Theory */}
        <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--os-text)', marginBottom: '1rem', borderBottom: '1px solid var(--os-border)', paddingBottom: '0.5rem' }}>
            2. Theory
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🧠</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-accent)' }}>Virtual Memory</h2>
              </div>
              <p style={{ color: 'var(--os-text)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                Allows a process to execute without being fully loaded into physical memory. Demand paging loads pages only when referenced.
              </p>
            </motion.div>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-fault)' }}>Page Faults</h2>
              </div>
              <p style={{ color: 'var(--os-text)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                When a referenced page is absent, a page fault occurs and a page replacement algorithm selects the victim page to evict.
              </p>
            </motion.div>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-accent2)' }}>Working Set Principle</h2>
              </div>
              <p style={{ color: 'var(--os-text)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                At time t with window Δ, the working set W(t,Δ) = set of pages referenced in the last Δ references. Keeping the working set in memory minimizes faults.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Section: Page Replacement Algorithms */}
        <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--os-text)', marginBottom: '1rem', borderBottom: '1px solid var(--os-border)', paddingBottom: '0.5rem' }}>
            3. Page Replacement Algorithms Evaluated
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', borderTop: '3px solid var(--os-muted)', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-text)' }}>FIFO</h2>
              </div>
              <p style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                Evicts the oldest page in memory. It's simple but ignores usage frequency and can suffer from Belady's Anomaly.
              </p>
            </motion.div>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', borderTop: '3px solid var(--os-accent)', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-text)' }}>LRU</h2>
              </div>
              <p style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                Evicts the page that has not been used for the longest period. Often the best practical choice.
              </p>
            </motion.div>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', borderTop: '3px solid var(--os-hit)', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-text)' }}>Optimal</h2>
              </div>
              <p style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                Evicts the page that will not be used for the longest time in the future. Serves as a benchmark.
              </p>
            </motion.div>
            <motion.div whileHover={hoverEffect} className="glass-card-solid" style={{ padding: '1.5rem', borderTop: '3px solid var(--os-accent2)', transition: 'box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--os-text)' }}>Second Chance</h2>
              </div>
              <p style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                An improvement over FIFO. If the oldest page's reference bit is 1, it gets a "second chance" (reset to 0 and moved to the back).
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Section: System Modules */}
        <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--os-text)', marginBottom: '1rem', borderBottom: '1px solid var(--os-border)', paddingBottom: '0.5rem' }}>
            4. System Modules
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { title: "Module 1 — Reference String Generator", desc: "Manual input or random generation with configurable page range." },
              { title: "Module 2 — Frame Allocation Manager", desc: "Maintains frame table and displays contents after each step." },
              { title: "Module 3 — Page Replacement Engine", desc: "Executes FIFO, LRU, Optimal, and Second Chance algorithms." },
              { title: "Module 4 — Fault & Hit Analyzer", desc: "Tracks cumulative faults and hits; computes ratios." },
              { title: "Module 5 — Comparison Graph", desc: "Plots page faults vs. number of frames (visible Belady's Anomaly)." }
            ].map((mod, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 10, backgroundColor: 'rgba(88, 166, 255, 0.05)' }}
                className="glass-card-solid" 
                style={{ padding: '1rem 1.5rem', transition: 'background-color 0.2s', borderLeft: '3px solid var(--os-border)' }}
              >
                <strong style={{ color: 'var(--os-text)', display: 'block', marginBottom: '0.25rem' }}>{mod.title}</strong> 
                <span style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem' }}>{mod.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section: Expected Output & Future Enhancements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <motion.div whileHover={hoverEffect} variants={itemVariants} className="glass-card-solid" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--os-hit)', marginBottom: '1rem' }}>
              5. Expected Output
            </h3>
            <ul style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
              <li>Step-by-step frame allocation table (F=fault, H=hit).</li>
              <li>Summary of Total Faults, Total Hits, and Hit Ratio%.</li>
              <li>Graph of Page Faults vs. Frame Count for each algorithm.</li>
              <li>Comparative bar chart across all four algorithms.</li>
            </ul>
          </motion.div>
          
          <motion.div whileHover={hoverEffect} variants={itemVariants} className="glass-card-solid" style={{ padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--os-accent)', marginBottom: '1rem' }}>
              6. Future Enhancements
            </h3>
            <ul style={{ color: 'var(--os-text-dim)', fontSize: '0.85rem', lineHeight: '1.6', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
              <li>Implement the Working Set page replacement policy.</li>
              <li>Add thrashing simulation: show CPU utilization drop as degree of multiprogramming increases.</li>
              <li>Simulate TLB with configurable size and measure effective access time.</li>
            </ul>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '2rem', marginTop: '2rem' }}>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(59, 130, 246, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            className="os-btn os-btn-primary" 
            onClick={onStart}
            style={{ 
              padding: '1rem 3rem', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Launch Simulator <span style={{ fontSize: '1.2rem' }}>🚀</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
