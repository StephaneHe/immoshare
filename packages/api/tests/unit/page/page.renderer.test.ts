import { PageRenderer } from '../../../src/modules/page/page.renderer';
import { RenderData } from '../../../src/modules/page/page.service';
import { PageRecord, SelectedElements, MediaForPage, BrandingForPage, PropertyForPage } from '../../../src/modules/page/page.types';

const PAGE_ID = 'dddddddd-1111-2222-3333-444444444444';
const PROP_ID = 'cccccccc-1111-2222-3333-444444444444';
const MEDIA_1 = 'eeeeeeee-1111-2222-3333-444444444444';

const property: PropertyForPage = {
  id: PROP_ID, title: 'Nice apartment', description: 'A lovely place',
  propertyType: 'apartment', status: 'active', price: 1500000, currency: 'ILS',
  address: '10 Rothschild', city: 'Tel Aviv', neighborhood: 'Center',
  areaSqm: 85, rooms: 3.5, bedrooms: 2, bathrooms: 1, floor: 3, totalFloors: 8,
  yearBuilt: 2015, parking: 1, elevator: true, balcony: true, garden: false, aircon: true, furnished: false,
};

const media: MediaForPage[] = [
  { id: MEDIA_1, type: 'photo', url: 'https://cdn.example.com/1.jpg', thumbnailUrl: null, caption: 'Living room', order: 0 },
];

const brandingEn: BrandingForPage = {
  agentName: 'John Doe', agencyName: 'Top Agency', logoUrl: null,
  primaryColor: '#C8102E', phone: '+972501234567', email: 'john@test.com', locale: 'en',
};

const brandingHe: BrandingForPage = { ...brandingEn, locale: 'he' };

function makePage(overrides: Partial<PageRecord> = {}): PageRecord {
  const selectedElements: SelectedElements = {
    sections: [
      { id: 's1', type: 'info', enabled: true, fields: ['price', 'rooms', 'areaSqm'] },
      { id: 's2', type: 'photos', enabled: true, mediaIds: [MEDIA_1] },
      { id: 's3', type: 'description', enabled: true },
      { id: 's4', type: 'features', enabled: true },
      { id: 's5', type: 'contact', enabled: true },
    ],
    order: ['s1', 's2', 's3', 's4', 's5'],
  };
  return {
    id: PAGE_ID, propertyId: PROP_ID, brandingId: null,
    title: 'Test page', selectedElements, layout: 'standard',
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

const renderer = new PageRenderer();

describe('PageRenderer', () => {
  it('should render valid HTML with DOCTYPE', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en" dir="ltr">');
  });

  it('should render RTL for Hebrew locale', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingHe, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
  });

  it('should include preview banner when isPreview=true', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: true };
    const html = renderer.render(data);
    expect(html).toContain('PREVIEW');
  });

  it('should not include preview banner when isPreview=false', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).not.toContain('PREVIEW');
  });

  it('should render property price and rooms in info section', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('1,500,000');
    expect(html).toContain('3.5 rooms');
  });

  it('should render photo gallery with images', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('cdn.example.com/1.jpg');
    expect(html).toContain('photo-gallery');
  });

  it('should render contact section with agent info', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('John Doe');
    expect(html).toContain('+972501234567');
    expect(html).toContain('john@test.com');
  });

  it('should apply branding primary color', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('#C8102E');
  });

  it('should render only enabled sections in order', () => {
    const page = makePage({
      selectedElements: {
        sections: [
          { id: 's1', type: 'info', enabled: false, fields: ['price'] },
          { id: 's2', type: 'description', enabled: true },
          { id: 's3', type: 'contact', enabled: true },
        ],
        order: ['s2', 's3'], // info not in order
      },
    });
    const data: RenderData = { page, property, media: [], branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    // section-info should not appear in the rendered body (only in CSS as class definition)
    expect(html).not.toContain('section-info');
    expect(html).toContain('section-description');
    expect(html).toContain('section-contact');
  });

  it('should escape HTML in property data', () => {
    const xssProperty = { ...property, title: '<script>alert("xss")</script>' };
    const data: RenderData = { page: makePage(), property: xssProperty, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should render features section with property amenities', () => {
    const data: RenderData = { page: makePage(), property, media, branding: brandingEn, isPreview: false };
    const html = renderer.render(data);
    expect(html).toContain('Elevator');
    expect(html).toContain('Balcony');
    expect(html).toContain('Air conditioning');
  });
});
