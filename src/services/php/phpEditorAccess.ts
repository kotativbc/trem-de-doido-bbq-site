import type { EditorAccessRepository } from "../repositories";
import { verifyToken, type EditorSession } from "./phpApi";

export const createPhpEditorAccess = (session: EditorSession): EditorAccessRepository => ({
  async authorize(token) {
    const valid = await verifyToken(token);
    session.token = valid ? token : null;
    return valid;
  },
});
