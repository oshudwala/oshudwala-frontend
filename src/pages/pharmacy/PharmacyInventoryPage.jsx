import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  Calendar,
  X,
  Tag,
  Check,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

// Pre-curated CDSCO standard medicines grouped by category
const CATEGORIZED_MEDICINES = {
  'Antibiotics': [
    { name: 'Augmentin 625 Duo Tablet', generic: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', manufacturer: 'GSK Pharmaceuticals Ltd.', mrp: 223.5, sellingPrice: 201.5 },
    { name: 'Azithral 500 Tablet', generic: 'Azithromycin (500mg)', manufacturer: 'Alembic Pharmaceuticals', mrp: 145.0, sellingPrice: 130.0 },
    { name: 'Cefix 200 DT Tablet', generic: 'Cefixime (200mg)', manufacturer: 'Cipla Ltd.', mrp: 110.0, sellingPrice: 98.0 },
    { name: 'Ciplox 500 Tablet', generic: 'Ciprofloxacin (500mg)', manufacturer: 'Cipla Ltd.', mrp: 45.0, sellingPrice: 40.0 },
    { name: 'Mox 500 Capsule', generic: 'Amoxicillin (500mg)', manufacturer: 'Sun Pharma', mrp: 72.0, sellingPrice: 65.0 },
  ],
  'Pain & Analgesics': [
    { name: 'Dolo 650 Tablet', generic: 'Paracetamol (650mg)', manufacturer: 'Micro Labs Ltd.', mrp: 38.0, sellingPrice: 34.0 },
    { name: 'Combiflam Tablet', generic: 'Ibuprofen (400mg) + Paracetamol (325mg)', manufacturer: 'Sanofi India', mrp: 42.0, sellingPrice: 38.0 },
    { name: 'Zerodol-SP Tablet', generic: 'Aceclofenac (100mg) + Paracetamol (325mg) + Serratiopeptidase (15mg)', manufacturer: 'Ipca Laboratories', mrp: 135.0, sellingPrice: 121.0 },
    { name: 'Ultracet Tablet', generic: 'Tramadol (37.5mg) + Paracetamol (325mg)', manufacturer: 'Janssen Pharmaceuticals', mrp: 240.0, sellingPrice: 215.0 },
    { name: 'Volini Pain Relief Gel 50g', generic: 'Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate', manufacturer: 'Sun Pharma', mrp: 160.0, sellingPrice: 145.0 },
  ],
  'Gastroenterology': [
    { name: 'Pan 40 Tablet', generic: 'Pantoprazole (40mg)', manufacturer: 'Alkem Laboratories', mrp: 172.0, sellingPrice: 155.0 },
    { name: 'Omez 20 Capsule', generic: 'Omeprazole (20mg)', manufacturer: "Dr. Reddy's Laboratories", mrp: 65.0, sellingPrice: 58.0 },
    { name: 'Rantac 150 Tablet', generic: 'Ranitidine (150mg)', manufacturer: 'JB Chemicals', mrp: 42.0, sellingPrice: 37.0 },
    { name: 'Digene Gel Mint 200ml', generic: 'Magnesium Hydroxide + Aluminium Hydroxide + Simethicone', manufacturer: 'Abbott Healthcare', mrp: 152.0, sellingPrice: 136.0 },
    { name: 'Cremaffin Plus Syrup 225ml', generic: 'Liquid Paraffin + Milk of Magnesia + Sodium Picosulfate', manufacturer: 'Abbott Healthcare', mrp: 285.0, sellingPrice: 255.0 },
  ],
  'Cardiac & Blood Pressure': [
    { name: 'Telma 40 Tablet', generic: 'Telmisartan (40mg)', manufacturer: 'Glenmark Pharmaceuticals', mrp: 235.0, sellingPrice: 210.0 },
    { name: 'Concor 2.5 Tablet', generic: 'Bisoprolol (2.5mg)', manufacturer: 'Merck Ltd.', mrp: 130.0, sellingPrice: 117.0 },
    { name: 'Rosuvas 10 Tablet', generic: 'Rosuvastatin (10mg)', manufacturer: 'Sun Pharma', mrp: 290.0, sellingPrice: 260.0 },
    { name: 'Ecosprin 75 Tablet', generic: 'Aspirin (75mg)', manufacturer: 'USV Ltd.', mrp: 6.5, sellingPrice: 6.0 },
    { name: 'Amlong 5 Tablet', generic: 'Amlodipine (5mg)', manufacturer: 'Micro Labs Ltd.', mrp: 45.0, sellingPrice: 40.0 },
  ],
  'Diabetes Care': [
    { name: 'Glycomet GP 1 Tablet', generic: 'Metformin (500mg SR) + Glimepiride (1mg)', manufacturer: 'USV Ltd.', mrp: 125.0, sellingPrice: 112.0 },
    { name: 'Janumet 50/500 Tablet', generic: 'Sitagliptin (50mg) + Metformin (500mg)', manufacturer: 'MSD Pharma', mrp: 410.0, sellingPrice: 369.0 },
    { name: 'Galvus Met 50/500 Tablet', generic: 'Vildagliptin (50mg) + Metformin (500mg)', manufacturer: 'Novartis India', mrp: 380.0, sellingPrice: 342.0 },
    { name: 'Glucophage 500mg Tablet', generic: 'Metformin (500mg)', manufacturer: 'Merck Ltd.', mrp: 92.0, sellingPrice: 82.0 },
  ],
  'Vitamins & Minerals': [
    { name: 'Shelcal 500 Tablet', generic: 'Calcium (500mg) + Vitamin D3 (250IU)', manufacturer: 'Torrent Pharmaceuticals', mrp: 145.0, sellingPrice: 131.0 },
    { name: 'Becosules Capsules', generic: 'Vitamin B-Complex + Vitamin C', manufacturer: 'Pfizer Ltd.', mrp: 52.0, sellingPrice: 47.0 },
    { name: 'Neurobion Forte Tablet', generic: 'Vitamin B1 + B6 + B12', manufacturer: 'Procter & Gamble Health', mrp: 41.0, sellingPrice: 37.0 },
    { name: 'Limcee 500mg Chewable Tablet', generic: 'Ascorbic Acid (Vitamin C 500mg)', manufacturer: 'Abbott Healthcare', mrp: 28.0, sellingPrice: 25.0 },
    { name: 'Supradyn Daily Multivitamin Tablet', generic: 'Multivitamins + Multi-minerals + Amino Acids', manufacturer: 'Bayer Pharmaceuticals', mrp: 62.0, sellingPrice: 56.0 },
  ],
  'Dermatology': [
    { name: 'Nadoxin Ointment 10g', generic: 'Nadifloxacin (1% w/w)', manufacturer: 'Wockhardt Ltd.', mrp: 165.0, sellingPrice: 148.0 },
    { name: 'Betnovate-N Cream 20g', generic: 'Betamethasone (0.1%) + Neomycin (0.5%)', manufacturer: 'GSK Pharmaceuticals Ltd.', mrp: 54.0, sellingPrice: 49.0 },
    { name: 'Candid-B Cream 20g', generic: 'Clotrimazole (1%) + Beclomethasone (0.025%)', manufacturer: 'Glenmark Pharmaceuticals', mrp: 185.0, sellingPrice: 166.0 },
    { name: 'Moiz Moisturizing Cream 100g', generic: 'Cetyl Alcohol + Stearyl Alcohol Skin Emollient', manufacturer: 'Glowderma Labs', mrp: 290.0, sellingPrice: 260.0 },
  ],
  'Respiratory & Allergy': [
    { name: 'Allegra 120mg Tablet', generic: 'Fexofenadine (120mg)', manufacturer: 'Sanofi India', mrp: 245.0, sellingPrice: 220.0 },
    { name: 'Montair-LC Tablet', generic: 'Montelukast (10mg) + Levocetirizine (5mg)', manufacturer: 'Cipla Ltd.', mrp: 215.0, sellingPrice: 193.0 },
    { name: 'Asthalin Inhaler 100mcg', generic: 'Salbutamol (100mcg per puff)', manufacturer: 'Cipla Ltd.', mrp: 165.0, sellingPrice: 150.0 },
    { name: 'Ascoril-D Plus Cough Syrup 100ml', generic: 'Dextromethorphan + Chlorpheniramine + Phenylephrine', manufacturer: 'Glenmark Pharmaceuticals', mrp: 135.0, sellingPrice: 122.0 },
  ],
};

const CATEGORY_NAMES = Object.keys(CATEGORIZED_MEDICINES);

export const PharmacyInventoryPage = () => {
  const { inventory, adjustStock, addStock, removeStock } = useWorkspaceStore();
  const { addToast } = useToast();

  // Inward existing stock modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustUnits, setAdjustUnits] = useState(10);

  // New Stock Modal state (Category wise selection)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_NAMES[0]);
  const [selectedMedicineName, setSelectedMedicineName] = useState('');
  const [customName, setCustomName] = useState('');
  const [genericFormula, setGenericFormula] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNo, setBatchNo] = useState(`WB-${Math.floor(1000 + Math.random() * 9000)}-26`);
  const [expiryDate, setExpiryDate] = useState('2027-11-30');
  const [mrp, setMrp] = useState('150');
  const [sellingPrice, setSellingPrice] = useState('135');
  const [stockUnits, setStockUnits] = useState('100');

  const filterOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Expiring (<30d)', value: 'EXPIRING_SOON' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
  ];

  // When medicine chosen from category list, auto fill details
  const handlePickMedicine = (med) => {
    setSelectedMedicineName(med.name);
    setCustomName(med.name);
    setGenericFormula(med.generic);
    setManufacturer(med.manufacturer);
    setMrp(String(med.mrp));
    setSellingPrice(String(med.sellingPrice));
  };

  // Submit New Stock from Category Modal
  const handleAddNewStockSubmit = (e) => {
    e.preventDefault();
    const finalDrugName = customName.trim() || selectedMedicineName;
    if (!finalDrugName) {
      addToast('Please pick a medicine or enter the drug name.', 'warning');
      return;
    }

    if (!expiryDate) {
      addToast('Please provide the medicine expiry date.', 'warning');
      return;
    }

    const created = addStock({
      name: finalDrugName,
      generic: genericFormula.trim() || 'Standard Formulation',
      manufacturer: manufacturer.trim() || 'Certified Pharmaceuticals',
      category: selectedCategory,
      batchNo: batchNo.trim() || `WB-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate,
      mrp: Number(mrp) || 100,
      sellingPrice: Number(sellingPrice) || Number(mrp) || 90,
      units: Number(stockUnits) || 50,
    });

    setIsAddStockModalOpen(false);
    setSelectedMedicineName('');
    setCustomName('');
    setGenericFormula('');
    setManufacturer('');
    setBatchNo(`WB-${Math.floor(1000 + Math.random() * 9000)}-26`);
    addToast(`Successfully added ${created.name} (${created.stock} units) to pharmacy stock!`, 'success');
  };

  // Adjust units on existing item
  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    adjustStock(selectedItem.id, adjustUnits, 'Stock Received from Central Distributor');
    addToast(`Updated stock units for ${selectedItem.name}!`, 'success');
    setSelectedItem(null);
  };

  // Delete item from inventory (Explicit user requirement)
  const handleDeleteItem = (row) => {
    if (window.confirm(`Are you sure you want to remove "${row.name}" (Batch ${row.batchNo}) from pharmacy inventory ledger?`)) {
      removeStock(row.id);
      addToast(`Removed ${row.name} from stock inventory.`, 'error');
    }
  };

  const columns = [
    {
      header: 'Drug Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.generic}</p>
          <p className="text-[10px] text-brandText-muted">{row.manufacturer}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      render: (row) => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-warm text-forest-800 border border-brandBorder-subtle">
          {row.category || 'General'}
        </span>
      ),
    },
    {
      header: 'Batch No & Expiry',
      key: 'batchNo',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-forest-800">{row.batchNo}</span>
          <p className="text-[10px] text-brandText-muted">Exp: {row.expiryDate}</p>
          {row.daysToExpiry <= 30 && (
            <span className="inline-block text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
              ⚠️ {row.daysToExpiry} days left!
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Retail Price (MRP)',
      key: 'mrp',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">₹{row.sellingPrice.toFixed(2)}</span>
          <p className="text-[10px] text-brandText-muted">MRP: ₹{row.mrp.toFixed(2)}</p>
        </div>
      ),
    },
    {
      header: 'Stock in Counter',
      key: 'stock',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">{row.stock} packs</span>
          <p className="text-[10px] text-brandText-muted">Reorder: {row.reorderLevel}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItem(row)}
            className="text-xs py-1"
          >
            Add Units
          </Button>
          <button
            type="button"
            onClick={() => handleDeleteItem(row)}
            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors border border-rose-200"
            title="Delete medicine from inventory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add Stock Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Pharmacy Medicine Stock & Expiry Control
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Real-time stock ledger, batch tracking, and mandatory CDSCO expiry alert monitoring.
          </p>
        </div>

        {/* Add Stock Button Above the Table (Explicit User Requirement) */}
        <div>
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsAddStockModalOpen(true)}
            className="text-xs font-bold shadow-md"
          >
            + Add Stock
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        searchKey="name"
        searchPlaceholder="Search medicine name, generic formula or batch..."
        filterOptions={filterOptions}
        filterKey="status"
      />

      {/* CATEGORY-WISE MEDICINE PICKER MODAL (Requirement 6) */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsAddStockModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-2xl w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Add Stock to Pharmacy Inventory
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Pick a medicine from curated categories or enter details manually
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStockModalOpen(false)}
                className="p-1 rounded-full text-brandText-muted hover:text-forest-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewStockSubmit} className="space-y-4">
              {/* Category Selector Tabs */}
              <div>
                <label className="text-xs font-bold text-forest-900 block mb-1.5">
                  Select Medicine Category
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORY_NAMES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedMedicineName('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-forest-800 text-white shadow-sm'
                          : 'bg-surface-warm text-brandText-main hover:bg-forest-50 border border-brandBorder-subtle'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicines List under selected category to pick from */}
              <div>
                <label className="text-xs font-bold text-forest-900 block mb-1.5">
                  Pick Medicine from Category ({selectedCategory})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 bg-surface-warm/50 rounded-2xl border border-brandBorder-subtle">
                  {CATEGORIZED_MEDICINES[selectedCategory]?.map((med, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePickMedicine(med)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedMedicineName === med.name
                          ? 'bg-forest-50 border-forest-600 shadow-sm'
                          : 'bg-surface-pure border-brandBorder-subtle hover:border-forest-300'
                      }`}
                    >
                      <p className="font-bold text-xs text-forest-900 truncate">{med.name}</p>
                      <p className="text-[10px] text-brandText-secondary truncate">{med.generic}</p>
                      <div className="flex items-center justify-between text-[10px] font-bold text-forest-700 mt-1">
                        <span>{med.manufacturer}</span>
                        <span>₹{med.sellingPrice}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drug Name & Generic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-forest-900">Drug Brand Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Augmentin 625 Duo"
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Generic Composition</label>
                  <input
                    type="text"
                    required
                    value={genericFormula}
                    onChange={(e) => setGenericFormula(e.target.value)}
                    placeholder="e.g. Amoxicillin + Clavulanic Acid"
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-900">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. GSK Pharmaceuticals"
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    placeholder="e.g. WB-24K09"
                    className="w-full mt-1 px-3 py-2 text-xs font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 uppercase"
                  />
                </div>
              </div>

              {/* Price, Units & Expiry Date Inputs (Requirement 6) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-900">Units to Add</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockUnits}
                    onChange={(e) => setStockUnits(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="150"
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="135"
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddStockModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  className="text-xs font-bold px-4"
                >
                  Add Medicine to Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Units Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Inward Stock: {selectedItem.name}
            </h3>
            <p className="text-xs text-brandText-secondary">
              Current Counter Balance: <strong>{selectedItem.stock}</strong> units &bull; Batch:{' '}
              {selectedItem.batchNo}
            </p>
            <form onSubmit={handleStockUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-forest-800">
                  New Units Received / Added
                </label>
                <input
                  type="number"
                  required
                  value={adjustUnits}
                  onChange={(e) => setAdjustUnits(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-bold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Update Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyInventoryPage;
