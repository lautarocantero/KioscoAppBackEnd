import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SellerModel } from '../sellerModel';
import { SellerSchema } from '../../schemas/sellerSchema';
import { SellerStatus } from '../../typings/seller/sellerEnums';

vi.mock('../../schemas/sellerSchema', () => ({
    SellerSchema: { findOneAndUpdate: vi.fn() },
}));

const mockedSellerSchema = vi.mocked(SellerSchema);

describe('SellerModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('edit', () => {
        it('actualiza solo los campos provistos', async () => {
            mockedSellerSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'seller-1' } as never);

            await SellerModel.edit({ _id: 'seller-1', name: 'Ana' });

            expect(mockedSellerSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'seller-1' },
                { $set: { name: 'Ana' } },
            );
        });

        it('actualiza name/profilePhoto/user_status juntos', async () => {
            mockedSellerSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'seller-1' } as never);

            await SellerModel.edit({ _id: 'seller-1', name: 'Ana', profilePhoto: 'http://x/a.png', user_status: SellerStatus.online });

            expect(mockedSellerSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'seller-1' },
                { $set: { name: 'Ana', profilePhoto: 'http://x/a.png', user_status: SellerStatus.online } },
            );
        });

        it('lanza error si user_status no es un valor válido', async () => {
            await expect(SellerModel.edit({ _id: 'seller-1', user_status: 'busy' as SellerStatus }))
                .rejects.toThrow('Invalid status: busy');
            expect(mockedSellerSchema.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it('lanza error si no existe un vendedor con ese id', async () => {
            mockedSellerSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(SellerModel.edit({ _id: 'seller-1', name: 'Ana' })).rejects.toThrow('There is not any seller with that id');
        });
    });
});
