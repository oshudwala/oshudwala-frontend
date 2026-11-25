import apiClient from './client';

// Normalize buttons if secondary button was encoded in buttonLink
const normalizePromotion = (p) => {
  if (!p) return p;
  let primaryText = p.buttonText || '';
  let primaryLink = p.buttonLink || '';
  let secondaryText = p.secondaryButtonText || '';
  let secondaryLink = p.secondaryButtonLink || '';

  if (!secondaryText && primaryLink && primaryLink.includes('||')) {
    const parts = primaryLink.split('||');
    primaryLink = parts[0] || '';
    secondaryText = parts[1] || '';
    secondaryLink = parts[2] || '';
  }

  return {
    ...p,
    buttonText: primaryText,
    buttonLink: primaryLink,
    secondaryButtonText: secondaryText,
    secondaryButtonLink: secondaryLink,
  };
};

export const promotionApi = {
  /**
   * Public: Fetch active promotions for patient home page
   * @param {string} placement - defaults to 'HOME_TOP'
   */
  async getPublicPromotions(placement = 'HOME_TOP') {
    try {
      const response = await apiClient.get('/promotions', {
        params: placement ? { placement } : undefined,
      });
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data.map(normalizePromotion) : [];
    } catch (err) {
      console.warn('Backend getPublicPromotions notice:', err.message);
      return [];
    }
  },

  /**
   * Super Admin: Fetch all promotions (both active and inactive)
   */
  async getAdminPromotions() {
    try {
      const response = await apiClient.get('/promotions/admin');
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data.map(normalizePromotion) : [];
    } catch (err) {
      console.warn('Backend getAdminPromotions notice:', err.message);
      return this.getPublicPromotions();
    }
  },

  /**
   * Super Admin: Create new promotional hero banner
   */
  async createPromotion(data) {
    let buttonLink = data.buttonLink || data.ctaLink || null;
    const secondaryButtonText = data.secondaryButtonText || data.secondaryCtaText || null;
    const secondaryButtonLink = data.secondaryButtonLink || data.secondaryCtaLink || null;

    if (secondaryButtonText && buttonLink && !buttonLink.includes('||')) {
      buttonLink = `${buttonLink}||${secondaryButtonText}||${secondaryButtonLink || ''}`;
    }

    const payload = {
      heading: String(data.heading || data.headline || '').trim(),
      paragraph: data.paragraph !== undefined ? data.paragraph : (data.subtext ? String(data.subtext).trim() : null),
      imageUrl: String(data.imageUrl || data.image || '').trim(),
      buttonText: data.buttonText || data.ctaText || null,
      buttonLink: buttonLink,
      secondaryButtonText: secondaryButtonText,
      secondaryButtonLink: secondaryButtonLink,
      couponCode: data.couponCode ? String(data.couponCode).trim().toUpperCase() : (data.badge ? String(data.badge).trim().toUpperCase() : null),
      placement: data.placement ? String(data.placement).trim() : 'HOME_TOP',
      sortOrder: Math.max(0, parseInt(data.sortOrder, 10) || 0),
      isActive: data.isActive !== false,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
    };

    const response = await apiClient.post('/promotions', payload);
    return normalizePromotion(response.data?.data || response.data);
  },

  /**
   * Super Admin: Update existing promotion
   */
  async updatePromotion(id, data) {
    const payload = {};
    if (data.heading !== undefined || data.headline !== undefined) {
      payload.heading = String(data.heading || data.headline || '').trim();
    }
    if (data.paragraph !== undefined || data.subtext !== undefined) {
      payload.paragraph = data.paragraph !== undefined ? data.paragraph : (data.subtext ? String(data.subtext).trim() : null);
    }
    if (data.imageUrl !== undefined || data.image !== undefined) {
      payload.imageUrl = String(data.imageUrl || data.image || '').trim();
    }

    let buttonLink = data.buttonLink !== undefined ? data.buttonLink : (data.ctaLink || null);
    const secondaryButtonText = data.secondaryButtonText !== undefined ? data.secondaryButtonText : (data.secondaryCtaText || null);
    const secondaryButtonLink = data.secondaryButtonLink !== undefined ? data.secondaryButtonLink : (data.secondaryCtaLink || null);

    if (secondaryButtonText && buttonLink && !buttonLink.includes('||')) {
      buttonLink = `${buttonLink}||${secondaryButtonText}||${secondaryButtonLink || ''}`;
    }

    if (data.buttonText !== undefined || data.ctaText !== undefined) {
      payload.buttonText = data.buttonText !== undefined ? data.buttonText : (data.ctaText || null);
    }
    if (buttonLink !== undefined) {
      payload.buttonLink = buttonLink;
    }
    if (secondaryButtonText !== undefined) {
      payload.secondaryButtonText = secondaryButtonText;
    }
    if (secondaryButtonLink !== undefined) {
      payload.secondaryButtonLink = secondaryButtonLink;
    }
    if (data.couponCode !== undefined || data.badge !== undefined) {
      payload.couponCode = data.couponCode !== undefined ? (data.couponCode ? String(data.couponCode).trim().toUpperCase() : null) : (data.badge ? String(data.badge).trim().toUpperCase() : null);
    }
    if (data.placement !== undefined) {
      payload.placement = String(data.placement).trim();
    }
    if (data.sortOrder !== undefined) {
      payload.sortOrder = Math.max(0, parseInt(data.sortOrder, 10) || 0);
    }
    if (data.isActive !== undefined) {
      payload.isActive = Boolean(data.isActive);
    }
    if (data.validFrom !== undefined) {
      payload.validFrom = data.validFrom;
    }
    if (data.validTo !== undefined) {
      payload.validTo = data.validTo;
    }

    const response = await apiClient.put(`/promotions/${id}`, payload);
    return normalizePromotion(response.data?.data || response.data);
  },

  /**
   * Super Admin: Delete promotion
   */
  async deletePromotion(id) {
    const response = await apiClient.delete(`/promotions/${id}`);
    return response.data?.data || response.data;
  },
};

export default promotionApi;
