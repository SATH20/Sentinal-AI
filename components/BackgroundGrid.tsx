export default function BackgroundGrid() {
  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none opacity-20" 
      style={{ 
        backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }}
    />
  );
}
