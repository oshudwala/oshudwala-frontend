import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, AlertCircle, Check } from 'lucide-react';
import Badge from '../common/Badge';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { addToast } = useToast();

  const existingInCart = cartItems.find((item) => item.id === product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    addToast(`Added ${product.name} to cart`, 'success');
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, existingInCart.quantity + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, existingInCart.quantity - 1);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group bg-surface-pure rounded-3xl p-4 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1 mb-2.5">
          {product.prescriptionRequired ? (
            <Badge variant="prescription" size="xs">
              Rx Required
            </Badge>
          ) : (
            <Badge variant="otc" size="xs">
              OTC
            </Badge>
          )}

          {product.discountPercent > 0 && (
            <Badge variant="discount" size="xs">
              {product.discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Product Image */}
        <div className="relative mb-3 w-full aspect-square rounded-2xl overflow-hidden bg-forest-50/50 flex items-center justify-center border border-forest-100 p-2">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Brand & Strength */}
        <p className="text-[11px] font-medium text-brandText-muted truncate">
          {product.brand}
        </p>

        {/* Medicine Name */}
        <h3 className="font-heading font-bold text-sm sm:text-base text-forest-800 group-hover:text-forest-600 transition-colors line-clamp-1 mt-0.5">
          {product.name}
        </h3>

        {/* Generic Composition */}
        <p className="text-xs text-brandText-secondary truncate mt-0.5">
          {product.genericName}
        </p>

        {/* Packaging */}
        <p className="text-[11px] text-brandText-muted mt-1">
          {product.packaging}
        </p>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="pt-4 border-t border-brandBorder-light/70 mt-3 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading font-extrabold text-forest-800 text-base sm:text-lg">
              ₹{product.price}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-brandText-muted line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
        </div>

        {/* Add button or Stepper */}
        <div>
          {existingInCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center border border-forest-600 rounded-full bg-forest-50 px-2 py-1"
            >
              <button
                type="button"
                onClick={handleDecrement}
                className="w-5 h-5 flex items-center justify-center text-forest-700 hover:bg-forest-200 rounded-full"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-forest-800">
                {existingInCart.quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-5 h-5 flex items-center justify-center text-forest-700 hover:bg-forest-200 rounded-full"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
