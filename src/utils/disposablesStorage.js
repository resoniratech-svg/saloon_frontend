import { getActiveTenantId } from './saasStorage';

export const initialDisposables = [
  {
    id: 'disp_1',
    name: 'Disposable Cutting Capes (Pack of 50)',
    sku: 'DSP-CP-01',
    category: 'Hair & Styling',
    unit: 'Pack',
    unitCost: 250,
    packPrice: 250,
    boxPrice: 1200,
    piecesPerUnit: 50,
    piecePrice: 5,
    stock: 18,
    minStock: 5,
    supplier: 'Salon Supplies Direct',
    status: 'In Stock',
  },
  {
    id: 'disp_2',
    name: 'Barber Neck Paper Strips (Pack of 5 Rolls)',
    sku: 'DSP-NS-02',
    category: 'Hair & Styling',
    unit: 'Pack',
    unitCost: 180,
    packPrice: 180,
    boxPrice: 850,
    piecesPerUnit: 5,
    piecePrice: 40,
    stock: 22,
    minStock: 6,
    supplier: 'Glamour Essentials',
    status: 'In Stock',
  },
  {
    id: 'disp_3',
    name: 'Black Nitrile Gloves Large (Box of 100)',
    sku: 'DSP-GL-03',
    category: 'Hair & Styling',
    unit: 'Box',
    unitCost: 420,
    packPrice: 220,
    boxPrice: 420,
    piecesPerUnit: 100,
    piecePrice: 5,
    stock: 4,
    minStock: 5,
    supplier: 'HygienePro Healthcare',
    status: 'Low Stock',
  },
  {
    id: 'disp_4',
    name: 'Disposable Plastic Ear Covers (Pack of 100)',
    sku: 'DSP-EC-04',
    category: 'Hair & Styling',
    unit: 'Pack',
    unitCost: 120,
    packPrice: 120,
    boxPrice: 550,
    piecesPerUnit: 100,
    piecePrice: 2,
    stock: 14,
    minStock: 4,
    supplier: 'Salon Supplies Direct',
    status: 'In Stock',
  },
  {
    id: 'disp_5',
    name: 'Embossed Aluminum Tinting Foil (Roll 100m)',
    sku: 'DSP-FL-05',
    category: 'Hair & Styling',
    unit: 'Roll',
    unitCost: 350,
    packPrice: 350,
    boxPrice: 1650,
    piecesPerUnit: 1,
    piecePrice: 350,
    stock: 2,
    minStock: 3,
    supplier: 'Loreal Professional Vendor',
    status: 'Low Stock',
  },
  {
    id: 'disp_6',
    name: 'Non-Woven Facial Bed Sheet Roll (50m)',
    sku: 'DSP-BS-06',
    category: 'Skin & Facial',
    unit: 'Roll',
    unitCost: 480,
    packPrice: 480,
    boxPrice: 2250,
    piecesPerUnit: 50,
    piecePrice: 12,
    stock: 9,
    minStock: 3,
    supplier: 'Dermacare Supplies',
    status: 'In Stock',
  },
  {
    id: 'disp_7',
    name: 'Stretchable Disposable Headbands (Pack of 50)',
    sku: 'DSP-HB-07',
    category: 'Skin & Facial',
    unit: 'Pack',
    unitCost: 160,
    packPrice: 160,
    boxPrice: 750,
    piecesPerUnit: 50,
    piecePrice: 4,
    stock: 15,
    minStock: 5,
    supplier: 'Dermacare Supplies',
    status: 'In Stock',
  },
  {
    id: 'disp_8',
    name: '100% Pure Cotton Facial Rounds (Pack of 200)',
    sku: 'DSP-CP-08',
    category: 'Skin & Facial',
    unit: 'Pack',
    unitCost: 110,
    packPrice: 110,
    boxPrice: 500,
    piecesPerUnit: 200,
    piecePrice: 1,
    stock: 28,
    minStock: 8,
    supplier: 'SoftTouch Cotton Mills',
    status: 'In Stock',
  },
  {
    id: 'disp_9',
    name: 'Wooden Waxing & Facial Spatulas (Pack of 100)',
    sku: 'DSP-SP-09',
    category: 'Skin & Facial',
    unit: 'Pack',
    unitCost: 95,
    packPrice: 95,
    boxPrice: 450,
    piecesPerUnit: 100,
    piecePrice: 1,
    stock: 35,
    minStock: 10,
    supplier: 'Organic Spa Tools',
    status: 'In Stock',
  },
  {
    id: 'disp_10',
    name: 'Heavy Duty Non-Woven Wax Strips (Pack of 100)',
    sku: 'DSP-WS-10',
    category: 'Waxing & Nails',
    unit: 'Pack',
    unitCost: 130,
    packPrice: 130,
    boxPrice: 600,
    piecesPerUnit: 100,
    piecePrice: 2,
    stock: 20,
    minStock: 6,
    supplier: 'Organic Spa Tools',
    status: 'In Stock',
  },
  {
    id: 'disp_11',
    name: 'Pedicure Tub Elastic Plastic Liners (Pack of 50)',
    sku: 'DSP-PL-11',
    category: 'Waxing & Nails',
    unit: 'Pack',
    unitCost: 220,
    packPrice: 220,
    boxPrice: 1000,
    piecesPerUnit: 50,
    piecePrice: 5,
    stock: 3,
    minStock: 4,
    supplier: 'NailArt Express',
    status: 'Low Stock',
  },
  {
    id: 'disp_12',
    name: 'Disposable Foam Spa Flip-Flops (Pack of 20)',
    sku: 'DSP-FF-12',
    category: 'Waxing & Nails',
    unit: 'Pack',
    unitCost: 290,
    packPrice: 290,
    boxPrice: 1350,
    piecesPerUnit: 20,
    piecePrice: 16,
    stock: 12,
    minStock: 4,
    supplier: 'NailArt Express',
    status: 'In Stock',
  },
  {
    id: 'disp_13',
    name: 'Foam Toe Separators (Pack of 50 Pairs)',
    sku: 'DSP-TS-13',
    category: 'Waxing & Nails',
    unit: 'Pack',
    unitCost: 140,
    packPrice: 140,
    boxPrice: 650,
    piecesPerUnit: 50,
    piecePrice: 3,
    stock: 16,
    minStock: 5,
    supplier: 'NailArt Express',
    status: 'In Stock',
  },
  {
    id: 'disp_14',
    name: 'Single-Edge Stainless Razor Blades (Box of 100)',
    sku: 'DSP-RB-14',
    category: 'Sanitization & Grooming',
    unit: 'Box',
    unitCost: 190,
    packPrice: 100,
    boxPrice: 190,
    piecesPerUnit: 100,
    piecePrice: 2,
    stock: 11,
    minStock: 4,
    supplier: 'Gillette Professional',
    status: 'In Stock',
  },
  {
    id: 'disp_15',
    name: 'Isopropyl Alcohol 70% Disinfectant Wipes (Tub of 150)',
    sku: 'DSP-AW-15',
    category: 'Sanitization & Grooming',
    unit: 'Tub',
    unitCost: 310,
    packPrice: 310,
    boxPrice: 1450,
    piecesPerUnit: 150,
    piecePrice: 3,
    stock: 6,
    minStock: 3,
    supplier: 'HygienePro Healthcare',
    status: 'In Stock',
  },
];

export const getDisposablePriceForUnit = (item, targetUnit) => {
  if (!item) return 0;
  const unit = targetUnit || item.selectedUnit || item.unit || 'Pack';
  const packPrice = Number(item.packPrice) || (item.unit === 'Pack' ? Number(item.unitCost) : Number(item.unitCost || 250));
  const boxPrice = Number(item.boxPrice) || (item.unit === 'Box' ? Number(item.unitCost) : Math.round(packPrice * 4.5));
  const ppu = Number(item.piecesPerUnit) || 50;
  const piecePrice = Number(item.piecePrice) || Math.max(1, Math.round(packPrice / ppu) || 5);

  if (unit === 'Box') return boxPrice;
  if (unit === 'Pieces' || unit === 'Piece' || unit === 'Pcs') return piecePrice;
  return packPrice;
};

const getStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_disposables_${tenantId}`;
};

const getConsumptionKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_disp_consumption_${tenantId}`;
};

const getWastageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_disp_wastage_${tenantId}`;
};

const getInwardKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_disp_inward_${tenantId}`;
};

export const getDisposables = () => {
  try {
    const key = getStorageKey();
    const tenantId = getActiveTenantId();
    const isCustomTenant = tenantId !== 'tenant_glamour';
    const data = localStorage.getItem(key);
    let list = isCustomTenant ? [] : initialDisposables;
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }

    if (isCustomTenant && list.length > 0) {
      const mockIds = new Set(initialDisposables.map(d => String(d.id)));
      const customOnly = list.filter(d => {
        const did = String(d.id);
        const isMock = mockIds.has(did) || /^disp_?\d+$/i.test(did);
        return !isMock;
      });
      if (customOnly.length !== list.length) {
        localStorage.setItem(key, JSON.stringify(customOnly));
        list = customOnly;
      }
    }
    // Enrich items with multi-unit pricing if missing
    return list.map(item => {
      const packPrice = Number(item.packPrice) || (item.unit === 'Pack' ? Number(item.unitCost) : Number(item.unitCost || 250));
      const ppu = Number(item.piecesPerUnit) || (
        item.name.includes('200') ? 200 :
        item.name.includes('150') ? 150 :
        item.name.includes('100') ? 100 :
        item.name.includes('50') ? 50 :
        item.name.includes('20') ? 20 :
        item.name.includes('5') ? 5 : 50
      );
      const piecePrice = Number(item.piecePrice) || Math.max(1, Math.round(packPrice / ppu) || 5);
      const boxPrice = Number(item.boxPrice) || (item.unit === 'Box' ? Number(item.unitCost) : Math.round(packPrice * 4.5));
      return {
        ...item,
        packPrice,
        boxPrice,
        piecesPerUnit: ppu,
        piecePrice,
      };
    });
  } catch (e) {
    console.error('Error loading disposables:', e);
    return initialDisposables;
  }
};

export const saveDisposables = (list) => {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event('disposablesUpdated'));
    return true;
  } catch (e) {
    console.error('Error saving disposables:', e);
    return false;
  }
};

export const addDisposableItem = (item) => {
  const list = getDisposables();
  const newItem = {
    ...item,
    id: item.id || `disp_${Date.now()}`,
    stock: Number(item.stock) || 0,
    minStock: Number(item.minStock) || 5,
    unitCost: Number(item.unitCost) || 0,
    status: (Number(item.stock) || 0) <= 0 
      ? 'Out of Stock' 
      : (Number(item.stock) || 0) <= (Number(item.minStock) || 5) 
      ? 'Low Stock' 
      : 'In Stock',
    createdAt: new Date().toISOString()
  };
  list.unshift(newItem);
  saveDisposables(list);
  return newItem;
};

export const updateDisposableItem = (id, updates) => {
  const list = getDisposables();
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return null;

  const current = list[idx];
  const updatedStock = updates.stock !== undefined ? Number(updates.stock) : current.stock;
  const updatedMin = updates.minStock !== undefined ? Number(updates.minStock) : current.minStock;

  list[idx] = {
    ...current,
    ...updates,
    stock: updatedStock,
    minStock: updatedMin,
    unitCost: updates.unitCost !== undefined ? Number(updates.unitCost) : current.unitCost,
    status: updatedStock <= 0 ? 'Out of Stock' : updatedStock <= updatedMin ? 'Low Stock' : 'In Stock'
  };

  saveDisposables(list);
  return list[idx];
};

export const deleteDisposableItem = (id) => {
  const list = getDisposables();
  const filtered = list.filter(i => i.id !== id);
  saveDisposables(filtered);
  return true;
};

// ----------------- Inward Restock -----------------
export const recordInwardStock = ({ itemId, quantity, supplier, invoiceNo, notes }) => {
  const list = getDisposables();
  const idx = list.findIndex(i => i.id === itemId);
  if (idx === -1) return false;

  const item = list[idx];
  const addedQty = Number(quantity) || 0;
  const newStock = item.stock + addedQty;

  list[idx] = {
    ...item,
    stock: newStock,
    status: newStock <= 0 ? 'Out of Stock' : newStock <= item.minStock ? 'Low Stock' : 'In Stock'
  };
  saveDisposables(list);

  // Inward log
  const inwardKey = getInwardKey();
  const logs = getInwardLogs();
  const entry = {
    id: `inw_${Date.now()}`,
    itemId,
    itemName: item.name,
    category: item.category,
    quantity: addedQty,
    unit: item.unit,
    supplier: supplier || item.supplier || 'Vendor',
    invoiceNo: invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
    notes: notes || '',
    date: new Date().toLocaleString()
  };
  logs.unshift(entry);
  localStorage.setItem(inwardKey, JSON.stringify(logs));
  window.dispatchEvent(new Event('disposablesInwardUpdated'));

  return entry;
};

export const getInwardLogs = () => {
  try {
    const data = localStorage.getItem(getInwardKey());
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// ----------------- Internal Consumption (Staff Check-out) -----------------
export const recordConsumption = ({ itemId, quantity, unit, unitCost, totalCost, staffName, purpose, notes }) => {
  const list = getDisposables();
  const idx = list.findIndex(i => i.id === itemId);
  if (idx === -1) return false;

  const item = list[idx];
  const usedQty = Number(quantity) || 1;
  const usedUnit = unit || item.unit || 'Pack';

  // Compute proportional stock deduction based on unit
  let stockDeduction = usedQty;
  if (usedUnit === 'Pieces' || usedUnit === 'Piece' || usedUnit === 'Pcs') {
    const ppu = Number(item.piecesPerUnit) || 50;
    stockDeduction = Number((usedQty / ppu).toFixed(2));
  } else if (usedUnit === 'Box' && item.unit === 'Pack') {
    stockDeduction = usedQty * 5;
  }

  const newStock = Math.max(0, Number((item.stock - stockDeduction).toFixed(2)));

  list[idx] = {
    ...item,
    stock: newStock,
    status: newStock <= 0 ? 'Out of Stock' : newStock <= item.minStock ? 'Low Stock' : 'In Stock'
  };
  saveDisposables(list);

  const cKey = getConsumptionKey();
  const logs = getConsumptionLogs();
  const effectiveUnitCost = unitCost !== undefined ? Number(unitCost) : getDisposablePriceForUnit(item, usedUnit);
  const effectiveTotalCost = totalCost !== undefined ? Number(totalCost) : (effectiveUnitCost * usedQty);

  const entry = {
    id: `csm_${Date.now()}`,
    itemId,
    itemName: item.name,
    category: item.category,
    quantity: usedQty,
    unit: usedUnit,
    unitCost: effectiveUnitCost,
    totalCost: effectiveTotalCost,
    staffName: staffName || 'Stylist / Staff',
    purpose: purpose || 'Client Service',
    notes: notes || '',
    date: new Date().toLocaleString()
  };
  logs.unshift(entry);
  localStorage.setItem(cKey, JSON.stringify(logs));
  window.dispatchEvent(new Event('disposablesConsumptionUpdated'));

  return entry;
};

export const getConsumptionLogs = () => {
  try {
    const data = localStorage.getItem(getConsumptionKey());
    if (data) return JSON.parse(data);
    // Initial sample consumption logs for realistic demo
    const sample = [
      {
        id: 'csm_1',
        itemName: 'Disposable Cutting Capes (Pack of 50)',
        category: 'Hair & Styling',
        quantity: 2,
        unit: 'Pack',
        unitCost: 250,
        totalCost: 500,
        staffName: 'Respark Trial',
        purpose: 'Hair Cut & Styling Service',
        date: new Date(Date.now() - 3600000 * 2).toLocaleString()
      },
      {
        id: 'csm_2',
        itemName: 'Black Nitrile Gloves Large (Box of 100)',
        category: 'Hair & Styling',
        quantity: 1,
        unit: 'Box',
        unitCost: 420,
        totalCost: 420,
        staffName: 'Swati R',
        purpose: 'Hair Color Highlights Station',
        date: new Date(Date.now() - 3600000 * 4).toLocaleString()
      },
      {
        id: 'csm_3',
        itemName: '100% Pure Cotton Facial Rounds (Pack of 200)',
        category: 'Skin & Facial',
        quantity: 1,
        unit: 'Pack',
        unitCost: 110,
        totalCost: 110,
        staffName: 'Sohum K',
        purpose: 'Hydra Deep Facial Treatment',
        date: new Date(Date.now() - 3600000 * 6).toLocaleString()
      }
    ];
    localStorage.setItem(getConsumptionKey(), JSON.stringify(sample));
    return sample;
  } catch (e) {
    return [];
  }
};

// ----------------- Wastage & Damage -----------------
export const recordWastage = ({ itemId, quantity, reason, notes }) => {
  const list = getDisposables();
  const idx = list.findIndex(i => i.id === itemId);
  if (idx === -1) return false;

  const item = list[idx];
  const lostQty = Number(quantity) || 1;
  const newStock = Math.max(0, item.stock - lostQty);

  list[idx] = {
    ...item,
    stock: newStock,
    status: newStock <= 0 ? 'Out of Stock' : newStock <= item.minStock ? 'Low Stock' : 'In Stock'
  };
  saveDisposables(list);

  const wKey = getWastageKey();
  const logs = getWastageLogs();
  const entry = {
    id: `wst_${Date.now()}`,
    itemId,
    itemName: item.name,
    category: item.category,
    quantity: lostQty,
    unit: item.unit,
    unitCost: item.unitCost || 0,
    totalLoss: (item.unitCost || 0) * lostQty,
    reason: reason || 'Torn / Damaged on Opening',
    notes: notes || '',
    date: new Date().toLocaleString()
  };
  logs.unshift(entry);
  localStorage.setItem(wKey, JSON.stringify(logs));
  window.dispatchEvent(new Event('disposablesWastageUpdated'));

  return entry;
};

export const getWastageLogs = () => {
  try {
    const data = localStorage.getItem(getWastageKey());
    if (data) return JSON.parse(data);
    const sample = [
      {
        id: 'wst_1',
        itemName: 'Black Nitrile Gloves Large (Box of 100)',
        category: 'Hair & Styling',
        quantity: 1,
        unit: 'Box',
        unitCost: 420,
        totalLoss: 420,
        reason: 'Water spill damage in storage cabinet',
        date: new Date(Date.now() - 86400000).toLocaleString()
      }
    ];
    localStorage.setItem(getWastageKey(), JSON.stringify(sample));
    return sample;
  } catch (e) {
    return [];
  }
};
