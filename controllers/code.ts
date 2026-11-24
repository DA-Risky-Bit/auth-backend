import { Request, Response, NextFunction } from 'express';
import * as codeService from '../service/code.js';

/**
 * Retrieves the lobby code
 */
export const getLobbyCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let code = await codeService.getLobbyCode();

    if (!code) {
      code = await codeService.regenerateLobbyCode();
    }

    return res.status(200).json(code);
  } catch (error) {
    return next(error);
  }
};


/**
 * Regenerate the Lobby Code
 */
export const regenerateLobbyCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let code = await codeService.regenerateLobbyCode();
    return res.status(200).json(code);
  } catch (error) {
    return next(error);
  }
};
