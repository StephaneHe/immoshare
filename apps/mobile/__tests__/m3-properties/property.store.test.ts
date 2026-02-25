/**
 * Tests for Property Store (stores/property.store.ts)
 * Test plan: M3-09 through M3-16
 */
import { usePropertyStore } from '../../src/stores/property.store';
import { propertyService } from '../../src/services/property.service';
import { Property } from '../../src/types';

jest.mock('../../src/services/property.service', () => ({
  propertyService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
    duplicate: jest.fn(),
  },
}));

jest.mock('../../src/services/api', () => ({
  ApiError: class extends Error {
    status: number;
    code: string;
    constructor(s: number, c: string, m: string) { super(m); this.status = s; this.code = c; }
  },
}));

const mockService = propertyService as jest.Mocked<typeof propertyService>;

const fakeProperty: Property = {
  id: 'p1',
  ownerId: 'u1',
  agencyId: null,
  title: '3BR in Tel Aviv',
  description: 'Nice apartment',
  propertyType: 'apartment',
  status: 'active',
  price: 2500000,
  currency: 'ILS',
  address: '123 Dizengoff',
  city: 'Tel Aviv',
  neighborhood: 'Center',
  areaSqm: 85,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 1,
  floor: 5,
  totalFloors: 8,
  yearBuilt: 2010,
  parking: 1,
  elevator: true,
  balcony: true,
  garden: false,
  aircon: true,
  furnished: false,
  metadata: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function fakeProperty2(): Property {
  return { ...fakeProperty, id: 'p2', title: 'Studio Jaffa' };
}

beforeEach(() => {
  jest.clearAllMocks();
  usePropertyStore.setState({
    properties: [],
    total: 0,
    page: 1,
    totalPages: 0,
    filters: { limit: 20 },
    isLoading: false,
    error: null,
    selectedProperty: null,
    isLoadingDetail: false,
  });
});

describe('Property Store', () => {
  // M3-09
  it('M3-09: initial state is empty', () => {
    const state = usePropertyStore.getState();
    expect(state.properties).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  // M3-10
  it('M3-10: fetchProperties() populates list and total', async () => {
    mockService.list.mockResolvedValue({
      items: [fakeProperty],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    await usePropertyStore.getState().fetchProperties();

    const state = usePropertyStore.getState();
    expect(state.properties).toHaveLength(1);
    expect(state.properties[0].title).toBe('3BR in Tel Aviv');
    expect(state.total).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  // M3-11
  it('M3-11: fetchProperties() with search passes filter to service', async () => {
    mockService.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await usePropertyStore.getState().fetchProperties({ search: 'tel aviv' });

    expect(mockService.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'tel aviv' })
    );
  });

  // M3-12
  it('M3-12: fetchProperties() with status filter', async () => {
    mockService.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await usePropertyStore.getState().fetchProperties({ status: 'draft' });

    expect(mockService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft' })
    );
  });

  // M3-13
  it('M3-13: fetchNextPage() appends to existing list', async () => {
    // Set initial state with page 1 data
    usePropertyStore.setState({
      properties: [fakeProperty],
      total: 2,
      page: 1,
      totalPages: 2,
      isLoading: false,
    });

    const prop2 = fakeProperty2();
    mockService.list.mockResolvedValue({
      items: [prop2],
      total: 2,
      page: 2,
      limit: 20,
      totalPages: 2,
    });

    await usePropertyStore.getState().fetchNextPage();

    const state = usePropertyStore.getState();
    expect(state.properties).toHaveLength(2);
    expect(state.properties[1].id).toBe('p2');
    expect(state.page).toBe(2);
  });

  // M3-14
  it('M3-14: fetchNextPage() stops when all loaded (page >= totalPages)', async () => {
    usePropertyStore.setState({
      properties: [fakeProperty],
      total: 1,
      page: 1,
      totalPages: 1,
      isLoading: false,
    });

    await usePropertyStore.getState().fetchNextPage();

    expect(mockService.list).not.toHaveBeenCalled();
  });

  // M3-16
  it('M3-16: error state set on API failure', async () => {
    const { ApiError } = require('../../src/services/api');
    mockService.list.mockRejectedValue(new ApiError(500, 'SERVER_ERROR', 'Internal error'));

    await usePropertyStore.getState().fetchProperties();

    const state = usePropertyStore.getState();
    expect(state.error).toBe('Internal error');
    expect(state.isLoading).toBe(false);
  });

  // Additional store tests: createProperty, updateProperty, removeProperty, duplicateProperty
  it('createProperty() prepends to list and increments total', async () => {
    usePropertyStore.setState({ properties: [fakeProperty], total: 1 });
    const newProp = fakeProperty2();
    mockService.create.mockResolvedValue(newProp);

    const result = await usePropertyStore.getState().createProperty({
      title: 'Studio Jaffa',
      propertyType: 'studio',
    });

    expect(result).toEqual(newProp);
    const state = usePropertyStore.getState();
    expect(state.properties[0].id).toBe('p2'); // prepended
    expect(state.total).toBe(2);
  });

  it('updateProperty() replaces in list', async () => {
    usePropertyStore.setState({ properties: [fakeProperty], total: 1 });
    const updated = { ...fakeProperty, title: 'Renamed' };
    mockService.update.mockResolvedValue(updated);

    const result = await usePropertyStore.getState().updateProperty('p1', { title: 'Renamed' });

    expect(result?.title).toBe('Renamed');
    expect(usePropertyStore.getState().properties[0].title).toBe('Renamed');
  });

  it('removeProperty() filters from list and decrements total', async () => {
    usePropertyStore.setState({ properties: [fakeProperty], total: 1 });
    mockService.remove.mockResolvedValue(undefined);

    const ok = await usePropertyStore.getState().removeProperty('p1');

    expect(ok).toBe(true);
    expect(usePropertyStore.getState().properties).toHaveLength(0);
    expect(usePropertyStore.getState().total).toBe(0);
  });

  it('duplicateProperty() prepends duplicate to list', async () => {
    usePropertyStore.setState({ properties: [fakeProperty], total: 1 });
    const dup = { ...fakeProperty, id: 'p-dup', title: '3BR in Tel Aviv (copy)' };
    mockService.duplicate.mockResolvedValue(dup);

    const result = await usePropertyStore.getState().duplicateProperty('p1');

    expect(result?.id).toBe('p-dup');
    expect(usePropertyStore.getState().properties).toHaveLength(2);
    expect(usePropertyStore.getState().total).toBe(2);
  });

  it('changeStatus() updates property in list', async () => {
    usePropertyStore.setState({ properties: [fakeProperty], total: 1 });
    const updated = { ...fakeProperty, status: 'sold' as const };
    mockService.changeStatus.mockResolvedValue(updated);

    const ok = await usePropertyStore.getState().changeStatus('p1', 'sold');

    expect(ok).toBe(true);
    expect(usePropertyStore.getState().properties[0].status).toBe('sold');
  });

  it('fetchPropertyById() sets selectedProperty', async () => {
    mockService.getById.mockResolvedValue(fakeProperty);

    await usePropertyStore.getState().fetchPropertyById('p1');

    expect(usePropertyStore.getState().selectedProperty).toEqual(fakeProperty);
    expect(usePropertyStore.getState().isLoadingDetail).toBe(false);
  });

  it('clearError() resets error to null', () => {
    usePropertyStore.setState({ error: 'Some error' });
    usePropertyStore.getState().clearError();
    expect(usePropertyStore.getState().error).toBeNull();
  });

  it('clearSelectedProperty() resets selectedProperty', () => {
    usePropertyStore.setState({ selectedProperty: fakeProperty });
    usePropertyStore.getState().clearSelectedProperty();
    expect(usePropertyStore.getState().selectedProperty).toBeNull();
  });
});
