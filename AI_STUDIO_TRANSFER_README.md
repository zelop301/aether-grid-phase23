# Transfer Phase 23 to Google AI Studio

## Official and most reliable route

1. Extract this ZIP.
2. Create a new GitHub repository.
3. Upload the extracted contents so `package.json` is at the repository root.
4. In Google AI Studio, open **Build mode**.
5. Select **Add files (+) → Import from GitHub**.
6. Choose the repository and branch.
7. Paste the contents of `AI_STUDIO_IMPORT_PROMPT.md` into the Build chat.

## Important

- Do not upload this entire project as a normal Gemini ZIP attachment and expect the file tree to become editable automatically.
- Keep `public/assets/models/` intact. Those GLB files are required by the game.
- This project does not use the Gemini API, so no `GEMINI_API_KEY` is required.
- AI Studio may update dependency versions. Ask it to report build errors before making dependency changes.
