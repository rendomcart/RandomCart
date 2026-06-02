const VariantSelector = ({ variants, selectedVariant, onSelect }) => {
  if (!variants || variants.length === 0) return null;

  // Extract unique colors and sizes
  const colors = [...new Map(variants.filter(v => v.color).map(v => [v.color, v])).values()];
  
  // Get ALL unique sizes across all variants so the UI doesn't jump
  const allUniqueSizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];
  
  // Get available sizes based on selected color to know which ones to disable
  const selectedColor = selectedVariant?.color;
  const availableSizesForColor = selectedColor 
    ? variants.filter(v => v.color === selectedColor && v.size && v.stock > 0).map(v => v.size)
    : variants.filter(v => v.size && v.stock > 0).map(v => v.size);

  // Handle color click
  const handleColorClick = (colorVariant) => {
    // If a size was already selected, try to find the matching size for the new color
    if (selectedVariant?.size) {
      const match = variants.find(v => v.color === colorVariant.color && v.size === selectedVariant.size);
      if (match) {
        onSelect(match);
        return;
      }
    }
    // Otherwise just select the first variant with this color
    const firstOfColor = variants.find(v => v.color === colorVariant.color);
    onSelect(firstOfColor);
  };

  // Handle size click
  const handleSizeClick = (size) => {
    // If a color is selected, find the specific variant
    if (selectedVariant?.color) {
      const match = variants.find(v => v.color === selectedVariant.color && v.size === size);
      if (match) onSelect(match);
    } else {
      const firstOfSize = variants.find(v => v.size === size);
      onSelect(firstOfSize);
    }
  };

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <span className="block text-sm font-medium mb-2">Color: <span className="font-semibold">{selectedVariant?.color || 'Select'}</span></span>
          <div className="flex flex-wrap gap-2">
            {colors.map(colorVariant => (
              <button
                key={`color-${colorVariant._id}`}
                onClick={() => handleColorClick(colorVariant)}
                className={`w-8 h-8 rounded-full border-2 ${selectedVariant?.color === colorVariant.color ? 'border-accent p-0.5' : 'border-transparent'}`}
                title={colorVariant.color}
              >
                <div 
                  className="w-full h-full rounded-full border border-gray-200" 
                  style={{ backgroundColor: colorVariant.colorHex || '#ccc' }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {allUniqueSizes.length > 0 && (
        <div>
          <span className="block text-sm font-medium mb-2">Size: <span className="font-semibold">{selectedVariant?.size || 'Select'}</span></span>
          <div className="flex flex-wrap gap-2">
            {allUniqueSizes.map(size => {
              const isAvailable = availableSizesForColor.includes(size);
              const isSelected = selectedVariant?.size === size;
              
              return (
                <button
                  key={`size-${size}`}
                  onClick={() => isAvailable && handleSizeClick(size)}
                  disabled={!isAvailable}
                  className={`min-w-[40px] px-3 py-1 text-sm border rounded transition-colors ${
                    isSelected 
                      ? 'border-accent bg-blue-50 text-accent font-medium' 
                      : isAvailable 
                        ? 'border-gray-300 hover:border-gray-400 text-gray-700' 
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through opacity-60'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {selectedVariant && (
        <div className="text-sm mt-2">
          {selectedVariant.stock > 0 ? (
            <span className={selectedVariant.stock < 5 ? 'text-orange-500 font-medium' : 'text-green-600 font-medium'}>
              {selectedVariant.stock < 5 ? `Only ${selectedVariant.stock} left in stock` : 'In Stock'}
            </span>
          ) : (
            <span className="text-red-500 font-medium">Out of Stock</span>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantSelector;
