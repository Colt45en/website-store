// Simple editable landing configuration persisted to localStorage
const DEFAULT = {
  heroTitle: 'NOVA',
  heroSubtitle: 'Neon goods and mythic apparel — green, orange, and black aesthetics.',
  promo: 'Free shipping on orders over $50!',
  showProducts: true
}

export function loadLanding(){
  try { return JSON.parse(localStorage.getItem('nova_landing')||'null') || DEFAULT } catch(e){ return DEFAULT }
}
export function saveLanding(cfg){ localStorage.setItem('nova_landing', JSON.stringify(cfg)) }
export default DEFAULT
