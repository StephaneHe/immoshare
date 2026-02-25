/**
 * Tests for Contact Service + Contact Store (M5 Sharing - Contacts)
 * Test plan: M5-01 through M5-05 (store), plus service tests
 */
import { api } from '../../src/services/api';
import { contactService } from '../../src/services/contact.service';
import { useContactStore } from '../../src/stores/contact.store';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  ApiError: class extends Error {
    constructor(s: number, c: string, msg: string) { super(msg); (this as any).status = s; (this as any).code = c; }
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakeContact = {
  id: 'c1', userId: 'u1', name: 'Alice', email: 'alice@test.com',
  phone: null, company: 'Acme', notes: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useContactStore.setState({
    contacts: [], total: 0, page: 1, totalPages: 0,
    isLoading: false, error: null, search: '',
  });
});

describe('Contact Service', () => {
  it('list() calls GET /contacts with params', async () => {
    mockApi.get.mockResolvedValue({ contacts: [fakeContact], total: 1, page: 1, totalPages: 1 });
    const result = await contactService.list({ page: 1, limit: 20, search: 'alice' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/contacts?page=1&limit=20&search=alice');
    expect(result.contacts).toHaveLength(1);
  });

  it('getById() calls GET /contacts/:id', async () => {
    mockApi.get.mockResolvedValue(fakeContact);
    await contactService.getById('c1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/contacts/c1');
  });

  it('create() calls POST /contacts', async () => {
    mockApi.post.mockResolvedValue(fakeContact);
    await contactService.create({ name: 'Alice', email: 'alice@test.com' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/contacts', { name: 'Alice', email: 'alice@test.com' });
  });

  it('update() calls PATCH /contacts/:id', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeContact, name: 'Bob' });
    await contactService.update('c1', { name: 'Bob' });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/contacts/c1', { name: 'Bob' });
  });

  it('remove() calls DELETE /contacts/:id', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await contactService.remove('c1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/contacts/c1');
  });
});

describe('Contact Store', () => {
  // M5-01: List contacts with pagination
  it('M5-01: fetchContacts() populates list and total', async () => {
    mockApi.get.mockResolvedValue({ contacts: [fakeContact], total: 1, page: 1, totalPages: 1 });
    await useContactStore.getState().fetchContacts();
    const s = useContactStore.getState();
    expect(s.contacts).toHaveLength(1);
    expect(s.total).toBe(1);
    expect(s.isLoading).toBe(false);
  });

  // M5-02: Create contact
  it('M5-02: createContact() adds to list', async () => {
    mockApi.post.mockResolvedValue(fakeContact);
    const contact = await useContactStore.getState().createContact({ name: 'Alice', email: 'a@b.com' });
    expect(contact.id).toBe('c1');
    expect(useContactStore.getState().contacts).toHaveLength(1);
  });

  // M5-03: Update contact
  it('M5-03: updateContact() updates in list', async () => {
    useContactStore.setState({ contacts: [fakeContact], total: 1 });
    mockApi.patch.mockResolvedValue({ ...fakeContact, name: 'Bob' });
    await useContactStore.getState().updateContact('c1', { name: 'Bob' });
    expect(useContactStore.getState().contacts[0].name).toBe('Bob');
  });

  // M5-04: Delete contact
  it('M5-04: deleteContact() removes from list', async () => {
    useContactStore.setState({ contacts: [fakeContact], total: 1 });
    mockApi.delete.mockResolvedValue(undefined);
    await useContactStore.getState().deleteContact('c1');
    expect(useContactStore.getState().contacts).toHaveLength(0);
    expect(useContactStore.getState().total).toBe(0);
  });

  // M5-05: Search contacts
  it('M5-05: setSearch() updates search term', () => {
    useContactStore.getState().setSearch('alice');
    expect(useContactStore.getState().search).toBe('alice');
  });

  it('fetchContacts() passes search to service', async () => {
    useContactStore.setState({ search: 'alice' });
    mockApi.get.mockResolvedValue({ contacts: [], total: 0, page: 1, totalPages: 0 });
    await useContactStore.getState().fetchContacts();
    expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('search=alice'));
  });

  it('error state set on API failure', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));
    await useContactStore.getState().fetchContacts();
    expect(useContactStore.getState().error).toBe('Network error');
  });
});
