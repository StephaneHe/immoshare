import { RenderData } from './page.service';
import { PropertyForPage, MediaForPage, BrandingForPage, SectionConfig } from './page.types';

/**
 * Server-side HTML renderer for property pages.
 * Generates a self-contained, responsive, mobile-first HTML page.
 */
export class PageRenderer {
  render(data: RenderData): string {
    const { page, property, media, branding, isPreview } = data;
    const isRtl = branding.locale === 'he';
    const dir = isRtl ? 'rtl' : 'ltr';
    const lang = branding.locale || 'en';

    const enabledSections = page.selectedElements.order
      .map(id => page.selectedElements.sections.find(s => s.id === id))
      .filter((s): s is SectionConfig => !!s && s.enabled);

    const sectionsHtml = enabledSections
      .map(section => this.renderSection(section, property, media, branding))
      .join('\n');

    const previewBanner = isPreview
      ? `<div style="background:#ff9800;color:#fff;text-align:center;padding:8px;font-weight:bold;position:sticky;top:0;z-index:100;">PREVIEW — Not shared yet</div>`
      : '';

    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.escape(page.title || property.title)}</title>
  <style>${this.getStyles(branding, isRtl)}</style>
</head>
<body>
  ${previewBanner}
  <div class="page-container">
    ${this.renderHeader(branding)}
    <main class="page-content">
      ${sectionsHtml}
    </main>
    ${this.renderFooter(branding)}
  </div>
</body>
</html>`;
  }

  // ─── Section renderers ───

  private renderSection(section: SectionConfig, property: PropertyForPage, media: MediaForPage[], branding: BrandingForPage): string {
    switch (section.type) {
      case 'info': return this.renderInfoSection(section, property);
      case 'photos': return this.renderPhotosSection(section, media);
      case 'description': return this.renderDescriptionSection(section, property);
      case 'features': return this.renderFeaturesSection(section, property);
      case 'contact': return this.renderContactSection(section, branding);
      case 'plans': return this.renderMediaSection(section, media, 'floor_plan');
      case 'video': return this.renderMediaSection(section, media, 'video');
      case '3d': return this.renderMediaSection(section, media, 'model_3d');
      case 'location': return this.renderLocationSection(section, property);
      default: return '';
    }
  }

  private renderInfoSection(section: SectionConfig, property: PropertyForPage): string {
    const title = section.customTitle || property.title;
    const fields = section.fields || ['price', 'rooms', 'areaSqm', 'city'];

    const infoItems: string[] = [];
    for (const field of fields) {
      const value = this.getFieldDisplay(field, property);
      if (value) infoItems.push(`<div class="info-item"><span class="info-label">${this.escape(field)}</span><span class="info-value">${this.escape(value)}</span></div>`);
    }

    return `<section class="section section-info">
      <h1 class="property-title">${this.escape(title)}</h1>
      <div class="info-grid">${infoItems.join('\n')}</div>
    </section>`;
  }

  private renderPhotosSection(section: SectionConfig, media: MediaForPage[]): string {
    const photos = section.mediaIds
      ? media.filter(m => section.mediaIds!.includes(m.id) && m.type === 'photo')
      : media.filter(m => m.type === 'photo');

    if (photos.length === 0) return '';

    const imgs = photos
      .sort((a, b) => a.order - b.order)
      .map(p => `<div class="gallery-item"><img src="${this.escape(p.url)}" alt="${this.escape(p.caption || '')}" loading="lazy"></div>`)
      .join('\n');

    return `<section class="section section-photos">
      <h2>${section.customTitle || 'Photos'}</h2>
      <div class="photo-gallery">${imgs}</div>
    </section>`;
  }

  private renderDescriptionSection(section: SectionConfig, property: PropertyForPage): string {
    if (!property.description) return '';
    return `<section class="section section-description">
      <h2>${section.customTitle || 'Description'}</h2>
      <p>${this.escape(property.description)}</p>
    </section>`;
  }

  private renderFeaturesSection(section: SectionConfig, property: PropertyForPage): string {
    const features: string[] = [];
    if (property.elevator) features.push('Elevator');
    if (property.balcony) features.push('Balcony');
    if (property.garden) features.push('Garden');
    if (property.aircon) features.push('Air conditioning');
    if (property.furnished) features.push('Furnished');
    if (property.parking && property.parking > 0) features.push(`${property.parking} parking`);

    if (features.length === 0) return '';

    const items = features.map(f => `<span class="feature-tag">${this.escape(f)}</span>`).join('');
    return `<section class="section section-features">
      <h2>${section.customTitle || 'Features'}</h2>
      <div class="feature-tags">${items}</div>
    </section>`;
  }

  private renderContactSection(section: SectionConfig, branding: BrandingForPage): string {
    const parts: string[] = [];
    parts.push(`<div class="contact-name">${this.escape(branding.agentName)}</div>`);
    if (branding.agencyName) parts.push(`<div class="contact-agency">${this.escape(branding.agencyName)}</div>`);
    if (branding.phone) parts.push(`<a class="contact-phone" href="tel:${this.escape(branding.phone)}">${this.escape(branding.phone)}</a>`);
    if (branding.email) parts.push(`<a class="contact-email" href="mailto:${this.escape(branding.email)}">${this.escape(branding.email)}</a>`);

    return `<section class="section section-contact">
      <h2>${section.customTitle || 'Contact'}</h2>
      <div class="contact-card">${parts.join('\n')}</div>
    </section>`;
  }

  private renderMediaSection(section: SectionConfig, media: MediaForPage[], type: string): string {
    const items = section.mediaIds
      ? media.filter(m => section.mediaIds!.includes(m.id))
      : media.filter(m => m.type === type);

    if (items.length === 0) return '';

    const html = items.map(m => `<div class="media-item"><a href="${this.escape(m.url)}" target="_blank">${this.escape(m.caption || m.type)}</a></div>`).join('');
    return `<section class="section section-media">
      <h2>${section.customTitle || type}</h2>
      <div class="media-list">${html}</div>
    </section>`;
  }

  private renderLocationSection(section: SectionConfig, property: PropertyForPage): string {
    const parts: string[] = [];
    if (property.address) parts.push(property.address);
    if (property.neighborhood) parts.push(property.neighborhood);
    if (property.city) parts.push(property.city);

    if (parts.length === 0) return '';

    return `<section class="section section-location">
      <h2>${section.customTitle || 'Location'}</h2>
      <p>${this.escape(parts.join(', '))}</p>
    </section>`;
  }

  // ─── Layout ───

  private renderHeader(branding: BrandingForPage): string {
    const logo = branding.logoUrl
      ? `<img src="${this.escape(branding.logoUrl)}" alt="Logo" class="header-logo">`
      : '';
    return `<header class="page-header">${logo}<span class="header-name">${this.escape(branding.agencyName || branding.agentName)}</span></header>`;
  }

  private renderFooter(branding: BrandingForPage): string {
    return `<footer class="page-footer"><p>Powered by ImmoShare</p></footer>`;
  }

  // ─── Helpers ───

  private getFieldDisplay(field: string, property: PropertyForPage): string | null {
    switch (field) {
      case 'price': return property.price ? `${property.price.toLocaleString()} ${property.currency}` : null;
      case 'rooms': return property.rooms ? `${property.rooms} rooms` : null;
      case 'bedrooms': return property.bedrooms ? `${property.bedrooms} bedrooms` : null;
      case 'bathrooms': return property.bathrooms ? `${property.bathrooms} bathrooms` : null;
      case 'areaSqm': return property.areaSqm ? `${property.areaSqm} sqm` : null;
      case 'floor': return property.floor != null ? `Floor ${property.floor}/${property.totalFloors || '?'}` : null;
      case 'yearBuilt': return property.yearBuilt ? `Built ${property.yearBuilt}` : null;
      case 'city': return property.city;
      case 'address': return property.address;
      case 'propertyType': return property.propertyType;
      default: return null;
    }
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getStyles(branding: BrandingForPage, isRtl: boolean): string {
    return `
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.5; direction: ${isRtl ? 'rtl' : 'ltr'}; }
      .page-container { max-width: 800px; margin: 0 auto; background: #fff; min-height: 100vh; }
      .page-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: ${branding.primaryColor}; color: #fff; }
      .header-logo { height: 40px; width: auto; }
      .header-name { font-size: 18px; font-weight: 600; }
      .page-content { padding: 20px; }
      .section { margin-bottom: 24px; }
      .property-title { font-size: 24px; margin-bottom: 12px; color: ${branding.primaryColor}; }
      h2 { font-size: 18px; margin-bottom: 8px; color: ${branding.primaryColor}; border-bottom: 2px solid ${branding.primaryColor}; padding-bottom: 4px; }
      .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
      .info-item { padding: 8px; background: #f9f9f9; border-radius: 6px; text-align: center; }
      .info-label { display: block; font-size: 12px; color: #888; text-transform: uppercase; }
      .info-value { display: block; font-size: 16px; font-weight: 600; }
      .photo-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
      .gallery-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 6px; }
      .feature-tags { display: flex; flex-wrap: wrap; gap: 6px; }
      .feature-tag { background: ${branding.primaryColor}22; color: ${branding.primaryColor}; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
      .contact-card { background: #f9f9f9; padding: 16px; border-radius: 8px; }
      .contact-name { font-size: 18px; font-weight: 600; }
      .contact-agency { color: #666; }
      .contact-phone, .contact-email { display: block; color: ${branding.primaryColor}; text-decoration: none; margin-top: 4px; }
      .page-footer { padding: 16px 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
      @media (max-width: 600px) {
        .photo-gallery { grid-template-columns: 1fr; }
        .info-grid { grid-template-columns: repeat(2, 1fr); }
      }
    `;
  }
}
