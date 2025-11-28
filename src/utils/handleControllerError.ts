import { Response } from 'express';

export function handleControllerError(res: Response, error: unknown): void {
    if (!(error instanceof Error)) {
        res
            .status(500)
            .json({ message: 'An unexpected error ocurred, try again' });
        return;
    }

    res
        .status(400)
        .json({ message: error.message });
}
