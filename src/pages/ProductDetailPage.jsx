import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Truck,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { productService } from '../services/productService';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import PrescriptionModal from '../components/home/PrescriptionModal';
import ProductCard from '../components/shop/ProductCard';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetch = async () => {
      const res = await productService.getProductById(id);
      setProduct(res.product);
      setQuantity(1);

      // fetch related
      const rel = await productService.getProducts({ category: res.product?.category, limit: 4 });
      setRelatedProducts(rel.products.filter(p => p.id !== id).slice(0, 4));
    };
    fetch();
  }, [id]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-brandText-secondary">Loading medicine details...</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    addToast(`Added ${quantity}x ${product.name} to cart`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-forest-700 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Medicines</span>
      </button>

      {/* Main Product Layout */}
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-10 border border-brandBorder-subtle shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Image */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full aspect-square rounded-3xl bg-forest-50/50 border border-forest-100 p-8 flex items-center justify-center relative overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="w-full mt-4 p-3.5 bg-forest-50/80 rounded-2xl border border-forest-100 flex items-center gap-3 text-xs text-forest-900">
            <ShieldCheck className="w-5 h-5 text-forest-600 flex-shrink-0" />
            <div>
              <p className="font-bold">100% Genuine Medicine</p>
              <p className="text-[11px] text-brandText-secondary">
                Dispensed by licensed pharmacies under CDSCO & West Bengal regulations.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Add to Cart */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header & Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.prescriptionRequired ? (
                <Badge variant="prescription" size="sm">
                  Doctor's Prescription Required
                </Badge>
              ) : (
                <Badge variant="otc" size="sm">
                  Over-The-Counter (OTC)
                </Badge>
              )}
              <span className="text-xs font-semibold text-brandText-muted">
                {product.categoryName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800">
              {product.name}
            </h1>
            <p className="text-sm font-semibold text-forest-700 mt-0.5">
              {product.genericName}
            </p>
            <p className="text-xs text-brandText-secondary mt-1">
              Manufactured by <span className="font-bold text-brandText-main">{product.brand}</span>
            </p>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle text-xs">
            <div>
              <p className="text-brandText-secondary">Strength</p>
              <p className="font-bold text-forest-800">{product.strength}</p>
            </div>
            <div>
              <p className="text-brandText-secondary">Dosage Form</p>
              <p className="font-bold text-forest-800">{product.dosageForm}</p>
            </div>
            <div>
              <p className="text-brandText-secondary">Packaging</p>
              <p className="font-bold text-forest-800">{product.packaging}</p>
            </div>
          </div>

          {/* Prescription Warning Notice if Rx required */}
          {product.prescriptionRequired && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Prescription Required for this Medicine</p>
                  <p className="mt-0.5 text-amber-800 leading-snug">
                    You can add this medicine to cart, but our pharmacist will require your prescription document before final dispatch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm flex-shrink-0"
              >
                Upload Now
              </button>
            </div>
          )}

          {/* Price & Quantity & Actions */}
          <div className="pt-2 border-t border-brandBorder-subtle space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-heading font-extrabold text-forest-800">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="text-sm text-brandText-muted line-through">
                    ₹{product.mrp}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Save ₹{product.mrp - product.price}
                  </span>
                </>
              )}
            </div>

            {/* Stepper + Add to Cart Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-brandBorder-subtle rounded-full bg-surface-warm px-3 py-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 flex items-center justify-center text-forest-700 hover:bg-forest-100 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-forest-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-6 h-6 flex items-center justify-center text-forest-700 hover:bg-forest-100 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                leftIcon={ShoppingBag}
                onClick={handleAddToCart}
                className="flex-1 shadow-card"
              >
                Add To Cart (₹{product.price * quantity})
              </Button>
            </div>
          </div>

          {/* Delivery & Assurance Perks */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-brandText-secondary">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-forest-600" />
              <span>45-Minute Superfast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest-600" />
              <span>Temperature Insulated Rider Box</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Information Tabs */}
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle space-y-5">
        <div className="flex gap-4 border-b border-brandBorder-subtle overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Indication' },
            { id: 'dosage', label: 'Dosage & Administration' },
            { id: 'sideEffects', label: 'Side Effects' },
            { id: 'precautions', label: 'Precautions & Warnings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? 'text-forest-700'
                  : 'text-brandText-secondary hover:text-forest-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="text-xs sm:text-sm text-brandText-main leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <p>{product.description}</p>
              <p className="text-xs text-brandText-secondary">
                Always consult a registered medical practitioner or your primary care physician before beginning new medications.
              </p>
            </div>
          )}

          {activeTab === 'dosage' && (
            <div className="space-y-2">
              <h4 className="font-bold text-forest-800">Directions for use:</h4>
              <p>{product.directions}</p>
            </div>
          )}

          {activeTab === 'sideEffects' && (
            <div className="space-y-2">
              <h4 className="font-bold text-forest-800">Reported Adverse Effects:</h4>
              <p>{product.sideEffects}</p>
            </div>
          )}

          {activeTab === 'precautions' && (
            <div className="space-y-2">
              <h4 className="font-bold text-forest-800">Special Precautions:</h4>
              <p>{product.precautions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Medicines */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-extrabold text-forest-800">
            Similar Medicines in {product.categoryName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Prescription Upload Modal */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />
    </div>
  );
};

export default ProductDetailPage;
