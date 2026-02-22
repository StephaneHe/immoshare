import { ContactService } from '../../../src/modules/share/contact.service';
import { IContactRepository, ContactRecord, PaginatedResult } from '../../../src/modules/share/share.types';
import {
  ContactNotFoundError,
  NotContactOwnerError,
  ContactRequiresPhoneOrEmailError,
} from '../../../src/modules/share/share.errors';

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const CONTACT_ID = 'cccccccc-1111-2222-3333-444444444444';

const sampleContact: ContactRecord = {
  id: CONTACT_ID,
  ownerId: USER_ID,
  name: 'David Cohen',
  phone: '+972501234567',
  email: 'david@example.com',
  tags: ['buyer', 'tel-aviv'],
  notes: 'Looking for 3-room apartment',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockRepo(overrides: Partial<IContactRepository> = {}): IContactRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleContact),
    findById: jest.fn().mockResolvedValue(null),
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    update: jest.fn().mockResolvedValue(sampleContact),
    delete: jest.fn(),
    ...overrides,
  };
}

describe('ContactService.create', () => {
  it('should create contact with ownerId', async () => {
    const repo = mockRepo();
    const service = new ContactService(repo);
    const result = await service.create(USER_ID, { name: 'David', phone: '+972501234567' });
    expect(result.id).toBe(CONTACT_ID);
    expect(repo.create).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ name: 'David' }));
  });

  it('should require at least phone or email', async () => {
    const service = new ContactService(mockRepo());
    await expect(service.create(USER_ID, { name: 'David' }))
      .rejects.toThrow(ContactRequiresPhoneOrEmailError);
  });

  it('should accept email-only contact', async () => {
    const repo = mockRepo();
    const service = new ContactService(repo);
    await service.create(USER_ID, { name: 'David', email: 'david@example.com' });
    expect(repo.create).toHaveBeenCalled();
  });
});

describe('ContactService.getById', () => {
  it('should return contact for owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const service = new ContactService(repo);
    const result = await service.getById(CONTACT_ID, USER_ID);
    expect(result.name).toBe('David Cohen');
  });

  it('should throw NOT_FOUND', async () => {
    const service = new ContactService(mockRepo());
    await expect(service.getById('bad-id', USER_ID)).rejects.toThrow(ContactNotFoundError);
  });

  it('should throw NOT_OWNER for other user', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const service = new ContactService(repo);
    await expect(service.getById(CONTACT_ID, OTHER_ID)).rejects.toThrow(NotContactOwnerError);
  });
});

describe('ContactService.list', () => {
  it('should return user contacts', async () => {
    const paginated: PaginatedResult<ContactRecord> = {
      items: [sampleContact], total: 1, page: 1, limit: 20, totalPages: 1,
    };
    const repo = mockRepo({ list: jest.fn().mockResolvedValue(paginated) });
    const service = new ContactService(repo);
    const result = await service.list(USER_ID, {});
    expect(result.items).toHaveLength(1);
    expect(repo.list).toHaveBeenCalledWith(USER_ID, {});
  });
});

describe('ContactService.update', () => {
  it('should update contact fields', async () => {
    const updated = { ...sampleContact, name: 'David Updated' };
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(sampleContact),
      update: jest.fn().mockResolvedValue(updated),
    });
    const service = new ContactService(repo);
    const result = await service.update(CONTACT_ID, USER_ID, { name: 'David Updated' });
    expect(result.name).toBe('David Updated');
  });

  it('should not allow removing both phone and email', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const service = new ContactService(repo);
    await expect(service.update(CONTACT_ID, USER_ID, { phone: null, email: null }))
      .rejects.toThrow(ContactRequiresPhoneOrEmailError);
  });

  it('should throw NOT_OWNER', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const service = new ContactService(repo);
    await expect(service.update(CONTACT_ID, OTHER_ID, { name: 'Hack' }))
      .rejects.toThrow(NotContactOwnerError);
  });
});

describe('ContactService.delete', () => {
  it('should delete contact', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const service = new ContactService(repo);
    await service.delete(CONTACT_ID, USER_ID);
    expect(repo.delete).toHaveBeenCalledWith(CONTACT_ID);
  });

  it('should throw NOT_OWNER', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const service = new ContactService(repo);
    await expect(service.delete(CONTACT_ID, OTHER_ID)).rejects.toThrow(NotContactOwnerError);
  });
});
