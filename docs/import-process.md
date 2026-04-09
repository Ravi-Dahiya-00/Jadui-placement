# Import Process for External Module Code

When you add any module code in the main workspace, follow this process:

1. Copy or move source code into `module-dropzone/` with clear folder names.
2. Identify module type using `docs/module-mapping.md`.
3. Extract only required files/functions.
4. Move cleaned code to target folder under:
   - `backend/app/services/modules/...`
5. Add or update schemas in `shared/schemas/`.
6. Add route integration in `backend/app/api/`.
7. Connect frontend screens/components in `frontend/src/`.
8. Validate import paths and run tests.

## Naming Convention
- Use lowercase folder names with underscores.
- Keep one module per destination folder.
- Keep utility code in local `utils.py` or a shared utility package later.
