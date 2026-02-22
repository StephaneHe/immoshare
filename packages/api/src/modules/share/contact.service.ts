import {
  IContactRepository,
  CreateContactInput,
  UpdateContactInput,
  ContactRecord,
  ContactListFilters,
  PaginatedResult,
} from './share.types';
import {
  ContactNotFoundError,
  NotContactOwnerError,
  ContactRequiresPhoneOrEmailError,
} from './share.errors';

export class ContactService {
  constructor(private readonly repo: IContactRepository) {}

  async create(userId: string, input: CreateContactInput): Promise<ContactRecord> {
    if (!input.phone && !input.email) {
      throw new ContactRequiresPhoneOrEmailError();
    }
    return this.repo.create(userId, input);
  }

  async getById(contactId: string, userId: string): Promise<ContactRecord> {
    const contact = await this.requireContact(contactId);
    if (contact.ownerId !== userId) throw new NotContactOwnerError();
    return contact;
  }

  async list(userId: string, filters: ContactListFilters): Promise<PaginatedResult<ContactRecord>> {
    return this.repo.list(userId, filters);
  }

  async update(contactId: string, userId: string, input: UpdateContactInput): Promise<ContactRecord> {
    const contact = await this.requireContact(contactId);
    if (contact.ownerId !== userId) throw new NotContactOwnerError();

    // After update, must still have phone or email
    const newPhone = input.phone !== undefined ? input.phone : contact.phone;
    const newEmail = input.email !== undefined ? input.email : contact.email;
    if (!newPhone && !newEmail) {
      throw new ContactRequiresPhoneOrEmailError();
    }

    return this.repo.update(contactId, input);
  }

  async delete(contactId: string, userId: string): Promise<void> {
    const contact = await this.requireContact(contactId);
    if (contact.ownerId !== userId) throw new NotContactOwnerError();
    await this.repo.delete(contactId);
  }

  private async requireContact(id: string): Promise<ContactRecord> {
    const contact = await this.repo.findById(id);
    if (!contact) throw new ContactNotFoundError();
    return contact;
  }
}
