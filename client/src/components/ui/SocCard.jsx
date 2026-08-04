import React from 'react';
import { motion } from 'framer-motion';

export default function SocCard({ title, icon, action, children, className = '', highlight = false }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      className={`soc-panel flex flex-col ${highlight ? 'border-soc-cyan shadow-[0_0_20px_rgba(0,240,255,0.1)]' : ''} ${className}`}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between p-4 border-b border-soc-panel-border bg-[#0a1122]">
          <div className="flex items-center gap-2">
            {icon && <span className="text-soc-cyan">{icon}</span>}
            {title && <h3 className="font-mono-tabular text-sm font-bold text-soc-text tracking-wide uppercase">{title}</h3>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4 flex-1">
        {children}
      </div>
    </motion.div>
  );
}
