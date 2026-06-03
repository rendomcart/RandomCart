export const getHexColor = (colorName) => {
  if (!colorName) return '#000000';
  
  // Clean up input
  const name = colorName.trim().toLowerCase();
  
  // Basic colors fallback if DOM method fails or for common colors
  const colorMap = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    blue: '#0000ff',
    green: '#008000',
    yellow: '#ffff00',
    purple: '#800080',
    orange: '#ffa500',
    pink: '#ffc0cb',
    brown: '#a52a2a',
    grey: '#808080',
    gray: '#808080',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    navy: '#000080',
    teal: '#008080',
    maroon: '#800000',
    olive: '#808000',
    silver: '#c0c0c0',
    gold: '#ffd700'
  };

  if (colorMap[name]) return colorMap[name];

  try {
    // DOM-based detection for more obscure colors
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = name;
    const computed = ctx.fillStyle; 
    
    // ctx.fillStyle returns hex like #000000 if it's a valid color name
    if (computed && computed.startsWith('#')) {
      return computed;
    }
  } catch (e) {
    console.error("Color detection failed", e);
  }
  
  return '#000000'; // Default fallback
};
