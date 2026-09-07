import { vi } from 'vitest';
import type { Response } from 'express';

// Mock mínimo y reutilizable de Response para tests de controllers: status/json/send
// encadenables como el objeto real de Express, para poder assertar sobre los
// argumentos con los que se llamó cada uno.
export const buildRes = (): Response => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.cookie = vi.fn().mockReturnValue(res);
    res.clearCookie = vi.fn().mockReturnValue(res);
    return res;
};
